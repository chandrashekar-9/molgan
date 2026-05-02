"""
model_server.py
---------------
Clean, import-safe server module extracted from model_converted.py.
Contains ONLY the classes and functions needed by app.py:
  - Generator (model architecture)
  - generate_molecules()
  - calculate_qed / calculate_logp / calculate_molecular_weight / calculate_sa_score
"""

import os
import sys
import warnings
import numpy as np
import torch
import torch.nn as nn
from rdkit import Chem
from rdkit.Chem import QED, Descriptors, Draw, AllChem, RDConfig
from rdkit import RDLogger

warnings.filterwarnings('ignore')
RDLogger.DisableLog('rdApp.*')

# ── Device ────────────────────────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── Molecule / model constants (must match training) ──────────────────────────
MAX_ATOMS         = 9
ATOM_TYPES        = ['C', 'N', 'O', 'F']
NUM_ATOM_FEATURES = len(ATOM_TYPES)
Z_DIM             = 32
HIDDEN_DIM        = 128
COND_DIM          = 2
DEFAULT_TEMPERATURE = 0.8
ATOM_TO_IDX       = {atom: idx for idx, atom in enumerate(ATOM_TYPES)}

# ── SA Score (optional) ───────────────────────────────────────────────────────
try:
    sys.path.append(os.path.join(RDConfig.RDContribDir, 'SA_Score'))
    import sascorer
    SA_AVAILABLE = True
except Exception:
    SA_AVAILABLE = False


# ── Generator ─────────────────────────────────────────────────────────────────
class Generator(nn.Module):
    """
    Conditional generator.
    Input : z (B, Z_DIM) + cond (B, COND_DIM)
    Output: nodes (B, MAX_ATOMS, NUM_ATOM_FEATURES)
            adj   (B, MAX_ATOMS, MAX_ATOMS)
    """
    def __init__(self):
        super().__init__()
        in_dim    = Z_DIM + COND_DIM
        out_nodes = MAX_ATOMS * NUM_ATOM_FEATURES
        out_adj   = MAX_ATOMS * MAX_ATOMS

        self.shared = nn.Sequential(
            nn.Linear(in_dim, HIDDEN_DIM),
            nn.ReLU(),
            nn.Linear(HIDDEN_DIM, HIDDEN_DIM),
            nn.ReLU(),
        )
        self.node_head = nn.Linear(HIDDEN_DIM, out_nodes)
        self.adj_head  = nn.Linear(HIDDEN_DIM, out_adj)

    def forward(self, z, cond):
        x     = torch.cat([z, cond], dim=-1)
        h     = self.shared(x)
        nodes = self.node_head(h).view(-1, MAX_ATOMS, NUM_ATOM_FEATURES)
        nodes = torch.softmax(nodes, dim=-1)
        adj   = self.adj_head(h).view(-1, MAX_ATOMS, MAX_ATOMS)
        adj   = torch.sigmoid(adj)
        adj   = (adj + adj.transpose(1, 2)) / 2.0
        return nodes, adj


# ── Input normalisation ───────────────────────────────────────────────────────
def normalize_inputs(qed: float, logp: float):
    """Normalise QED to [0,1] and logP to [0,1] via (logp+5)/10."""
    qed  = max(0.0, min(1.0, qed))
    logp = (logp + 5) / 10.0
    logp = max(0.0, min(1.0, logp))
    return qed, logp


# ── Graph → SMILES decoder ────────────────────────────────────────────────────
def graph_to_smiles(nodes_batch, adj_batch) -> list:
    """Greedy decode a generator output batch into SMILES strings."""
    smiles_out = []
    nodes_np = nodes_batch.detach().cpu().numpy()
    adj_np   = adj_batch.detach().cpu().numpy()

    for b in range(nodes_np.shape[0]):
        try:
            atom_indices = np.argmax(nodes_np[b], axis=-1)
            adj_mat      = (adj_np[b] > 0.5).astype(int)

            rw_mol   = Chem.RWMol()
            atom_map = {}
            for i in range(MAX_ATOMS):
                sym = ATOM_TYPES[atom_indices[i]]
                idx = rw_mol.AddAtom(Chem.Atom(sym))
                atom_map[i] = idx

            for i in range(MAX_ATOMS):
                for j in range(i + 1, MAX_ATOMS):
                    if adj_mat[i, j] == 1:
                        rw_mol.AddBond(atom_map[i], atom_map[j],
                                       Chem.BondType.SINGLE)

            Chem.SanitizeMol(rw_mol)
            smiles_out.append(Chem.MolToSmiles(rw_mol))
        except Exception:
            smiles_out.append("")

    return smiles_out


# ── Property calculators ──────────────────────────────────────────────────────
def calculate_qed(mol) -> float:
    try:
        return float(QED.qed(mol))
    except Exception:
        return 0.0


def calculate_logp(mol) -> float:
    try:
        return float(Descriptors.MolLogP(mol))
    except Exception:
        return 0.0


def calculate_molecular_weight(mol) -> float:
    try:
        return float(Descriptors.ExactMolWt(mol))
    except Exception:
        return 0.0


def calculate_sa_score(mol) -> float:
    if not SA_AVAILABLE:
        return 0.0
    try:
        return float(sascorer.calculateScore(mol))
    except Exception:
        return 0.0


# ── Main generation function ──────────────────────────────────────────────────
def generate_molecules(generator_model,
                       number_of_molecules: int,
                       target_qed: float,
                       target_logp: float,
                       temperature: float = DEFAULT_TEMPERATURE):
    """
    Generate molecules conditioned on (target_qed, target_logp).

    Parameters
    ----------
    generator_model     : loaded Generator instance
    number_of_molecules : how many to request
    target_qed          : desired QED (0–1)
    target_logp         : desired logP
    temperature         : noise scaling

    Returns
    -------
    valid_mols   : list of RDKit Mol objects
    valid_smiles : list of SMILES strings
    """
    generator_model.eval()

    qed_n, logp_n = normalize_inputs(target_qed, target_logp)
    cond_vec = torch.tensor(
        [[qed_n, logp_n]], dtype=torch.float32, device=device
    ).repeat(number_of_molecules, 1)

    with torch.no_grad():
        z = torch.randn(number_of_molecules, Z_DIM, device=device) * temperature
        gen_nodes, gen_adj = generator_model(z, cond_vec)

    raw_smiles   = graph_to_smiles(gen_nodes, gen_adj)
    valid_mols   = []
    valid_smiles = []

    for smi in raw_smiles:
        if smi:
            mol = Chem.MolFromSmiles(smi)
            if mol is not None:
                valid_mols.append(mol)
                valid_smiles.append(smi)

    print(f"Generated {number_of_molecules} → {len(valid_mols)} valid "
          f"({100*len(valid_mols)/max(number_of_molecules,1):.1f}%)")
    return valid_mols, valid_smiles
