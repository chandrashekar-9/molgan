import { useEffect } from 'react';
import archImg from '../assets/molgan_architecture.png';

export default function ArchitectureSlide({ onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    // Lock body scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="slide-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Architecture Slide">
      <div className="slide-panel arch-slide-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="slide-header">
          <div className="slide-header-left">
            <div className="slide-icon" style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))' }}>🏗</div>
            <div>
              <h2 className="slide-title gradient-text">MolGAN Architecture</h2>
              <p className="slide-subtitle">Conditional Molecular Graph Generative Adversarial Network</p>
            </div>
          </div>
          <button className="slide-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Architecture Image */}
        <div className="arch-image-wrapper">
          <img src={archImg} alt="MolGAN Architecture Diagram" className="arch-image" />
          <div className="arch-image-caption">
            Figure: MolGAN Conditional Generation Pipeline — WGAN-GP with Reinforcement Learning reward shaping
          </div>
        </div>

        {/* Architecture Overview Cards */}
        <div className="arch-cards-grid">
          <div className="arch-card">
            <div className="arch-card-icon" style={{ color: 'var(--accent-teal)' }}>⚙</div>
            <div className="arch-card-title">Generator</div>
            <div className="arch-card-desc">WGAN-GP with condition vector encoding QED, logP, and temperature for property-guided generation</div>
          </div>
          <div className="arch-card">
            <div className="arch-card-icon" style={{ color: 'var(--accent-blue)' }}>🔍</div>
            <div className="arch-card-title">Discriminator</div>
            <div className="arch-card-desc">Graph-level validity discriminator trained with Wasserstein loss and gradient penalty</div>
          </div>
          <div className="arch-card">
            <div className="arch-card-icon" style={{ color: 'var(--accent-amber)' }}>🏆</div>
            <div className="arch-card-title">Reward Module</div>
            <div className="arch-card-desc">RL-based reward shaping using RDKit property scores: QED, logP, SA Score, and Molecular Weight</div>
          </div>
          <div className="arch-card">
            <div className="arch-card-icon" style={{ color: 'var(--success)' }}>🧬</div>
            <div className="arch-card-title">Output</div>
            <div className="arch-card-desc">Valid molecular graphs converted to SMILES strings with computed physicochemical properties</div>
          </div>
        </div>

        {/* Footer */}
        <div className="slide-footer">
          <span className="slide-footer-note">Based on: MolGAN — De novo molecular graph generation using WGAN-GP + RL</span>
          <button className="btn-action" onClick={onClose}>← Back to Generator</button>
        </div>
      </div>
    </div>
  );
}
