from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import torch
import base64
from io import BytesIO

from rdkit import Chem
from rdkit.Chem import Draw

from model_server import (
    Generator,
    generate_molecules,
    calculate_qed,
    calculate_logp,
    calculate_molecular_weight,
    calculate_sa_score,
    device,
)

app = FastAPI(title="MolGAN API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Starting MolGAN API...")

# -----------------------------
# Load Model
# -----------------------------

generator = Generator().to(device)

generator.load_state_dict(
    torch.load(
        "molgan_gen.pth",
        map_location=device,
        weights_only=True,
    )
)

generator.eval()

print("Model loaded successfully")


# -----------------------------
# Convert molecule to image
# -----------------------------

def mol_to_base64(mol):

    img = Draw.MolToImage(
        mol,
        size=(300, 300)
    )

    buffer = BytesIO()

    img.save(
        buffer,
        format="PNG"
    )

    return base64.b64encode(
        buffer.getvalue()
    ).decode()


# -----------------------------
# Health check route
# -----------------------------

@app.get("/")
def home():

    return {
        "message": "MolGAN API is running"
    }


# -----------------------------
# Main Generation API
# -----------------------------

@app.post("/generate")
def generate(
    number_of_molecules: int,
    target_qed: float,
    target_logp: float,
    temperature: float = 1.0
):

    print(
        "Request received:",
        number_of_molecules,
        target_qed,
        target_logp
    )

    # Generate molecules — pass the loaded generator instance
    mols, smiles = generate_molecules(
        generator_model=generator,
        number_of_molecules=number_of_molecules,
        target_qed=target_qed,
        target_logp=target_logp,
        temperature=temperature
    )

    results = []

    for mol, smi in zip(mols, smiles):

        try:

            qed_value = calculate_qed(mol)

            logp_value = calculate_logp(mol)

            mw_value = calculate_molecular_weight(mol)

            sa_value = calculate_sa_score(mol)

            image_base64 = mol_to_base64(mol)

            results.append({

                "smiles": smi,

                "qed": round(qed_value, 3),

                "logp": round(logp_value, 3),

                "molecular_weight": round(mw_value, 2),

                "synthetic_accessibility": round(sa_value, 2),

                "structure_image": image_base64

            })

        except Exception as e:

            print("Error processing molecule:", e)

    return {

        "requested_molecules": number_of_molecules,

        "generated_valid_molecules": len(results),

        "molecules": results

    }