import { useEffect, useState } from 'react';

const SECTIONS = [
  {
    id: 'molecules',
    icon: '🔢',
    title: 'Number of Molecules',
    subtitle: 'Batch Size Control',
    color: 'var(--accent-teal)',
    colorRaw: '#00d4b4',
    tooltip: 'Controls how many candidate molecules the model attempts to generate per run.',
    recommended: '10 – 50',
    unit: 'molecules',
    ranges: [
      { range: '1 – 20',   label: 'Fast generation',        level: 'green',  note: 'Recommended for testing' },
      { range: '20 – 50',  label: 'Standard generation',    level: 'green',  note: 'Optimal balance' },
      { range: '50 – 100', label: 'Large batch',            level: 'yellow', note: 'May take longer' },
      { range: '> 100',    label: 'Very large batch',       level: 'red',    note: 'High computation time' },
    ],
  },
  {
    id: 'qed',
    icon: '💊',
    title: 'QED',
    subtitle: 'Drug-Likeness Score',
    color: 'var(--accent-teal)',
    colorRaw: '#00d4b4',
    tooltip: 'QED (Quantitative Estimate of Drug-likeness) measures how drug-like a molecule is based on its structure and physicochemical properties. Higher values indicate better drug candidates.',
    recommended: '0.6 – 0.8',
    unit: '',
    ranges: [
      { range: '0.0 – 0.3', label: 'Poor drug-likeness',      level: 'red',    note: 'Not suitable for drugs' },
      { range: '0.3 – 0.6', label: 'Moderate drug-likeness',  level: 'yellow', note: 'Borderline acceptable' },
      { range: '0.6 – 0.8', label: 'Good drug-likeness',      level: 'green',  note: '✦ Recommended range' },
      { range: '0.8 – 1.0', label: 'Excellent drug-likeness', level: 'green',  note: 'Ideal drug candidates' },
    ],
  },
  {
    id: 'logp',
    icon: '⚖️',
    title: 'logP',
    subtitle: 'Lipophilicity Balance',
    color: 'var(--accent-blue)',
    colorRaw: '#4f9cf9',
    tooltip: 'logP indicates the partition coefficient between octanol and water — a measure of lipophilicity. Most oral drugs fall between 2 and 3 (Lipinski Rule of Five: logP ≤ 5).',
    recommended: '2 – 3',
    unit: '',
    ranges: [
      { range: '< 0',  label: 'Very hydrophilic',          level: 'yellow', note: 'Poor membrane penetration' },
      { range: '0 – 2', label: 'Hydrophilic',              level: 'yellow', note: 'Limited oral bioavailability' },
      { range: '2 – 3', label: 'Balanced (optimal)',       level: 'green',  note: '✦ Recommended range' },
      { range: '3 – 5', label: 'Lipophilic',               level: 'yellow', note: 'Acceptable for some drugs' },
      { range: '> 5',   label: 'Highly lipophilic',        level: 'red',    note: 'Poor aqueous solubility' },
    ],
  },
  {
    id: 'temperature',
    icon: '🌡️',
    title: 'Temperature',
    subtitle: 'Molecular Diversity Control',
    color: 'var(--accent-purple)',
    colorRaw: '#a855f7',
    tooltip: 'Temperature controls the randomness (diversity) of the generator\'s output. Lower values produce more stable, reproducible molecules; higher values yield more diverse but potentially less valid structures.',
    recommended: '0.6 – 1.0',
    unit: '',
    ranges: [
      { range: '0.3 – 0.6', label: 'Conservative generation',   level: 'yellow', note: 'Low diversity, high stability' },
      { range: '0.6 – 1.0', label: 'Balanced generation',       level: 'green',  note: '✦ Recommended range' },
      { range: '1.0 – 1.5', label: 'High diversity',            level: 'yellow', note: 'More creative structures' },
      { range: '> 1.5',     label: 'Very random structures',    level: 'red',    note: 'Low validity rate' },
    ],
  },
  {
    id: 'sa',
    icon: '🏭',
    title: 'SA Score',
    subtitle: 'Ease of Synthesis',
    color: 'var(--accent-amber)',
    colorRaw: '#f59e0b',
    tooltip: 'The Synthetic Accessibility (SA) score estimates how easy it is to synthesize a molecule in a laboratory. Lower scores = easier synthesis. Ranges from 1 (very easy) to 10 (very hard).',
    recommended: '2 – 4',
    unit: '',
    ranges: [
      { range: '1 – 2', label: 'Very easy to synthesize', level: 'green',  note: 'Simple reactions needed' },
      { range: '2 – 4', label: 'Easy to synthesize',      level: 'green',  note: '✦ Preferred range' },
      { range: '4 – 6', label: 'Moderate difficulty',     level: 'yellow', note: 'Requires expertise' },
      { range: '6 – 8', label: 'Difficult',               level: 'red',    note: 'Complex multi-step synthesis' },
      { range: '> 8',   label: 'Very difficult',          level: 'red',    note: 'Not practical' },
    ],
  },
  {
    id: 'mw',
    icon: '⚛️',
    title: 'Molecular Weight',
    subtitle: 'Size of Molecule (Daltons)',
    color: 'var(--accent-purple)',
    colorRaw: '#a855f7',
    tooltip: 'Molecular Weight (MW) measured in Daltons (Da). Lipinski\'s Rule of Five states that drug-like molecules should have MW ≤ 500 Da. Most successful oral drugs range between 200 and 500 Da.',
    recommended: '200 – 500',
    unit: 'Da',
    ranges: [
      { range: '< 200 Da',    label: 'Small molecules',    level: 'yellow', note: 'May lack specificity' },
      { range: '200 – 500 Da', label: 'Drug-like molecules', level: 'green',  note: '✦ Preferred range (Lipinski)' },
      { range: '> 500 Da',    label: 'Large molecules',    level: 'red',    note: 'Poor oral bioavailability' },
    ],
  },
];

const LEVEL_CONFIG = {
  green:  { bg: 'rgba(63, 185, 80, 0.12)',  border: 'rgba(63, 185, 80, 0.3)',  text: '#7ee787', dot: '#3fb950' },
  yellow: { bg: 'rgba(210, 153, 34, 0.12)', border: 'rgba(210, 153, 34, 0.3)', text: '#e3b341', dot: '#d29922' },
  red:    { bg: 'rgba(248, 81, 73, 0.12)',  border: 'rgba(248, 81, 73, 0.3)',  text: '#ff8580', dot: '#f85149' },
};

function RangeRow({ range, label, level, note }) {
  const cfg = LEVEL_CONFIG[level];
  return (
    <div className="pg-range-row" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="pg-range-left">
        <span className="pg-range-dot" style={{ background: cfg.dot }} />
        <code className="pg-range-code">{range}</code>
      </div>
      <div className="pg-range-right">
        <span className="pg-range-label" style={{ color: cfg.text }}>{label}</span>
        <span className="pg-range-note">{note}</span>
      </div>
    </div>
  );
}

function Section({ section }) {
  const [open, setOpen] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="pg-section">
      {/* Section Header */}
      <button
        className="pg-section-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ '--section-color': section.color }}
      >
        <div className="pg-section-header-left">
          <span className="pg-section-icon">{section.icon}</span>
          <div>
            <div className="pg-section-title" style={{ color: section.color }}>{section.title}</div>
            <div className="pg-section-subtitle">{section.subtitle}</div>
          </div>
        </div>
        <div className="pg-section-header-right">
          <div className="pg-recommended-badge" style={{ borderColor: section.color, color: section.color }}>
            ✦ {section.recommended}{section.unit && ` ${section.unit}`}
          </div>
          <button
            className="pg-info-btn"
            onClick={(e) => { e.stopPropagation(); setShowTooltip((t) => !t); }}
            aria-label="Info"
            title={section.tooltip}
          >
            ℹ
          </button>
          <span className="pg-chevron" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </div>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="pg-tooltip-box" style={{ borderColor: section.color }}>
          <span className="pg-tooltip-close" onClick={() => setShowTooltip(false)}>✕</span>
          {section.tooltip}
        </div>
      )}

      {/* Collapsible Body */}
      {open && (
        <div className="pg-section-body">
          {section.ranges.map((r, i) => (
            <RangeRow key={i} {...r} />
          ))}
          <div className="pg-legend-row">
            <span className="pg-legend-item green">● Recommended</span>
            <span className="pg-legend-item yellow">● Acceptable</span>
            <span className="pg-legend-item red">● Extreme / Avoid</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertyGuide({ onClose }) {
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
    <div className="slide-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Property Guide">
      <div className="slide-panel pg-slide-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="slide-header">
          <div className="slide-header-left">
            <div className="slide-icon" style={{ background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))' }}>📊</div>
            <div>
              <h2 className="slide-title gradient-text">Input Ranges & Molecular Property Guide</h2>
              <p className="slide-subtitle">Scientific reference for property-conditioned molecule generation</p>
            </div>
          </div>
          <button className="slide-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Legend Banner */}
        <div className="pg-legend-banner">
          <span className="pg-legend-item green">🟢 Recommended</span>
          <span className="pg-legend-item yellow">🟡 Acceptable</span>
          <span className="pg-legend-item red">🔴 Extreme Values</span>
          <span className="pg-legend-tip">Click any section to collapse · Click ℹ for detailed tooltip</span>
        </div>

        {/* Sections */}
        <div className="pg-sections">
          {SECTIONS.map((s) => <Section key={s.id} section={s} />)}
        </div>

        {/* Footer */}
        <div className="slide-footer">
          <span className="slide-footer-note">📖 Reference: Lipinski Rule of Five · RDKit property scoring · MolGAN training constraints</span>
          <button className="btn-action" onClick={onClose}>← Back to Generator</button>
        </div>
      </div>
    </div>
  );
}
