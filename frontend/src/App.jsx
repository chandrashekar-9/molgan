import { useState } from 'react';
import './App.css';
import MoleculeForm from './components/MoleculeForm';
import MoleculeGrid from './components/MoleculeGrid';
import LoadingSpinner from './components/LoadingSpinner';
import ArchitectureSlide from './components/ArchitectureSlide';
import PropertyGuide from './components/PropertyGuide';
import LandingPage from './components/LandingPage';

const API_BASE = 'http://127.0.0.1:8000';

// ── CSV export helper ────────────────────────────────────────────────────────
function downloadCSV(molecules) {
  const headers = ['smiles', 'qed', 'logp', 'molecular_weight', 'synthetic_accessibility'];
  const rows = molecules.map((m) =>
    headers.map((h) => {
      const v = m[h];
      return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? '';
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `molgan_results_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Banner component ─────────────────────────────────────────────────────────
function Banner({ type, message, onClose }) {
  return (
    <div className={`banner ${type}`}>
      <span className="banner-icon">{type === 'error' ? '✕' : '✓'}</span>
      <span>{message}</span>
      <button className="banner-close" onClick={onClose}>✕</button>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [molecules, setMolecules] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showArch, setShowArch] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // NOTE: FastAPI defines params as plain function args (not a Pydantic model),
  // so they are query parameters — not JSON body.
  const handleGenerate = async (params) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const qs = new URLSearchParams({
      number_of_molecules: params.number_of_molecules,
      target_qed: params.target_qed,
      target_logp: params.target_logp,
      temperature: params.temperature,
    }).toString();

    try {
      const res = await fetch(`${API_BASE}/generate?${qs}`, {
        method: 'POST',
      });

      if (!res.ok) {
        let detail = `Server error ${res.status}`;
        try {
          const err = await res.json();
          detail = err.detail || JSON.stringify(err);
        } catch (_) {}
        throw new Error(detail);
      }

      const data = await res.json();
      setMolecules(data.molecules ?? []);
      setMeta({
        requested: data.requested_molecules,
        generated: data.generated_valid_molecules,
      });
      setSuccess(
        `Successfully generated ${data.generated_valid_molecules} valid molecule${data.generated_valid_molecules !== 1 ? 's' : ''} out of ${data.requested_molecules} requested.`
      );
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot reach backend at http://127.0.0.1:8000 — make sure the FastAPI server is running (uvicorn app:app --reload).');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
      setMolecules([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMolecules([]);
    setMeta(null);
    setError(null);
    setSuccess(null);
  };

  if (!hasEntered) {
    return <LandingPage onEnter={() => setHasEntered(true)} />;
  }

  return (
    <>
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">⚛</div>
          <div className="header-titles">
            <h1 className="gradient-text">MolGAN Generator</h1>
            <p>Conditional Molecular Generation</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            id="btn-architecture"
            className="header-slide-btn"
            onClick={() => setShowArch(true)}
            title="View MolGAN Architecture"
          >
            🏗 Architecture
          </button>
          <button
            id="btn-input-guide"
            className="header-slide-btn accent"
            onClick={() => setShowGuide(true)}
            title="Open Input Ranges & Property Guide"
          >
            ℹ Input Guide
          </button>
          <div className="header-badge">
            <span className="status-dot" />
            FastAPI Backend
          </div>
        </div>
      </header>

      {/* ── Modals ── */}
      {showArch && <ArchitectureSlide onClose={() => setShowArch(false)} />}
      {showGuide && <PropertyGuide onClose={() => setShowGuide(false)} />}

      {/* ── Main layout ── */}
      <div className="app-layout">
        {/* Left: Form panel */}
        <aside className="form-panel">
          <MoleculeForm onGenerate={handleGenerate} isLoading={isLoading} />
        </aside>

        {/* Right: Results panel */}
        <main className="results-panel">
          {/* Banners */}
          {error && (
            <Banner type="error" message={error} onClose={() => setError(null)} />
          )}
          {success && !error && (
            <Banner type="success" message={success} onClose={() => setSuccess(null)} />
          )}

          {/* Action buttons (shown when results exist) */}
          {molecules.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
              <button
                className="btn-action success-btn"
                onClick={() => downloadCSV(molecules)}
                title="Download all results as CSV"
              >
                ↓ Download CSV
              </button>
              <button
                className="btn-action danger"
                onClick={handleClear}
                title="Clear all results"
              >
                ✕ Clear Results
              </button>
            </div>
          )}

          {/* State: loading */}
          {isLoading && <LoadingSpinner />}

          {/* State: results */}
          {!isLoading && molecules.length > 0 && (
            <MoleculeGrid molecules={molecules} meta={meta} />
          )}

          {/* State: empty */}
          {!isLoading && molecules.length === 0 && !error && (
            <div className="results-empty">
              <div className="results-empty-icon">🧬</div>
              <h3>No molecules yet</h3>
              <p>Set your target properties and click <strong>Generate Molecules</strong> to begin.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
