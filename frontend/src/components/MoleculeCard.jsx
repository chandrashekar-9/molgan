import { useState } from 'react';

export default function MoleculeCard({ molecule, index }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(molecule.smiles).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="molecule-card" style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}>
      {/* Structure Image */}
      <div className="card-image-wrapper">
        {molecule.structure_image ? (
          <img
            src={`data:image/png;base64,${molecule.structure_image}`}
            alt={`Structure of ${molecule.smiles}`}
            loading="lazy"
          />
        ) : (
          <div style={{ color: '#aaa', fontSize: '0.8rem', textAlign: 'center' }}>
            No image
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="card-body">
        {/* SMILES */}
        <div className="smiles-row">
          <span className="smiles-text">{molecule.smiles}</span>
          <button className="copy-btn" onClick={handleCopy} title="Copy SMILES">
            {copied ? '✓' : '⎘'}
          </button>
        </div>

        {/* Properties */}
        <div className="properties-grid">
          <div className="prop-item qed">
            <div className="prop-label">QED</div>
            <div className="prop-value">{molecule.qed?.toFixed(3) ?? '—'}</div>
          </div>
          <div className="prop-item logp">
            <div className="prop-label">logP</div>
            <div className="prop-value">{molecule.logp?.toFixed(3) ?? '—'}</div>
          </div>
          <div className="prop-item mw">
            <div className="prop-label">MW (Da)</div>
            <div className="prop-value">{molecule.molecular_weight?.toFixed(2) ?? '—'}</div>
          </div>
          <div className="prop-item sa">
            <div className="prop-label">SA Score</div>
            <div className="prop-value">{molecule.synthetic_accessibility?.toFixed(2) ?? '—'}</div>
          </div>
        </div>

        <div className="card-index">#{index + 1}</div>
      </div>
    </div>
  );
}
