import { useState } from 'react';

const DEFAULTS = {
  number_of_molecules: 20,
  target_qed: 0.8,
  target_logp: 2.0,
  temperature: 0.8,
};

const VALIDATION = {
  number_of_molecules: (v) => {
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 1) return 'Must be a positive integer';
    if (n > 200) return 'Maximum 200 molecules per request';
    return null;
  },
  target_qed: (v) => {
    const f = parseFloat(v);
    if (isNaN(f) || f < 0 || f > 1) return 'Must be between 0 and 1';
    return null;
  },
  target_logp: (v) => {
    if (v === '' || isNaN(parseFloat(v))) return 'Must be a valid number';
    return null;
  },
  temperature: (v) => {
    if (v === '') return null; // optional
    const f = parseFloat(v);
    if (isNaN(f) || f <= 0) return 'Must be a positive number';
    return null;
  },
};

export default function MoleculeForm({ onGenerate, isLoading }) {
  const [values, setValues] = useState({ ...DEFAULTS });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (name, value) => {
    const err = VALIDATION[name]?.(value);
    setErrors((prev) => ({ ...prev, [name]: err }));
    return err;
  };

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) validate(name, value);
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validate(name, values[name]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Touch all & validate
    const allTouched = Object.fromEntries(Object.keys(values).map((k) => [k, true]));
    setTouched(allTouched);
    const errs = {};
    let hasError = false;
    for (const key of Object.keys(VALIDATION)) {
      const err = VALIDATION[key](values[key]);
      if (err) { errs[key] = err; hasError = true; }
    }
    setErrors(errs);
    if (hasError) return;

    onGenerate({
      number_of_molecules: parseInt(values.number_of_molecules, 10),
      target_qed: parseFloat(values.target_qed),
      target_logp: parseFloat(values.target_logp),
      temperature: values.temperature === '' ? DEFAULTS.temperature : parseFloat(values.temperature),
    });
  };

  const qedFillPct = `${parseFloat(values.target_qed) * 100}%`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="form-title">Generation Parameters</p>

      {/* Number of Molecules */}
      <div className="form-group">
        <div className="form-label">
          <span>Number of Molecules</span>
          <span className="label-hint">1 – 200</span>
        </div>
        <input
          type="number"
          className={`form-input${errors.number_of_molecules && touched.number_of_molecules ? ' error' : ''}`}
          value={values.number_of_molecules}
          min={1}
          max={200}
          onChange={(e) => handleChange('number_of_molecules', e.target.value)}
          onBlur={() => handleBlur('number_of_molecules')}
          placeholder="e.g. 20"
        />
        {touched.number_of_molecules && errors.number_of_molecules && (
          <div className="validation-error">⚠ {errors.number_of_molecules}</div>
        )}
      </div>

      {/* Target QED Slider */}
      <div className="form-group">
        <div className="form-label">
          <span>Target QED <span title="Drug-likeness score, higher is more drug-like" style={{ cursor: 'help', color: 'var(--text-muted)', fontSize: '0.75rem' }}>ⓘ</span></span>
          <span className="label-value">{parseFloat(values.target_qed).toFixed(2)}</span>
        </div>
        <div className="slider-wrapper">
          <div className="slider-track-bg" />
          {/* Filled portion overlay */}
          <div style={{
            position: 'absolute', top: '50%', left: 0,
            width: qedFillPct, height: '4px',
            background: 'linear-gradient(90deg, var(--accent-teal), #00b09b)',
            borderRadius: '99px', transform: 'translateY(-50%)',
            pointerEvents: 'none', transition: 'width 0.05s',
          }} />
          <input
            type="range"
            className="form-slider"
            min={0} max={1} step={0.01}
            value={values.target_qed}
            onChange={(e) => handleChange('target_qed', e.target.value)}
            style={{ position: 'relative', zIndex: 1 }}
          />
        </div>
        <div className="slider-ticks">
          <span>0.0</span><span>0.25</span><span>0.5</span><span>0.75</span><span>1.0</span>
        </div>
        {touched.target_qed && errors.target_qed && (
          <div className="validation-error">⚠ {errors.target_qed}</div>
        )}
      </div>

      {/* Target logP */}
      <div className="form-group">
        <div className="form-label">
          <span>Target logP <span title="Lipophilicity; typically -2 to 5 for drugs" style={{ cursor: 'help', color: 'var(--text-muted)', fontSize: '0.75rem' }}>ⓘ</span></span>
          <span className="label-hint">lipophilicity</span>
        </div>
        <input
          type="number"
          className={`form-input${errors.target_logp && touched.target_logp ? ' error' : ''}`}
          value={values.target_logp}
          step={0.1}
          onChange={(e) => handleChange('target_logp', e.target.value)}
          onBlur={() => handleBlur('target_logp')}
          placeholder="e.g. 2.0"
        />
        {touched.target_logp && errors.target_logp && (
          <div className="validation-error">⚠ {errors.target_logp}</div>
        )}
      </div>

      {/* Temperature */}
      <div className="form-group">
        <div className="form-label">
          <span>Temperature <span className="optional-tag">optional</span></span>
          <span className="label-hint">default 0.8</span>
        </div>
        <input
          type="number"
          className={`form-input${errors.temperature && touched.temperature ? ' error' : ''}`}
          value={values.temperature}
          min={0.01}
          step={0.05}
          onChange={(e) => handleChange('temperature', e.target.value)}
          onBlur={() => handleBlur('temperature')}
          placeholder="0.8"
        />
        {touched.temperature && errors.temperature && (
          <div className="validation-error">⚠ {errors.temperature}</div>
        )}
      </div>

      <div className="form-divider" />

      <button type="submit" className="btn-generate" disabled={isLoading}>
        {isLoading ? (
          <>
            <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(5,11,24,0.4)', borderTopColor: '#050b18', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Generating…
          </>
        ) : (
          <>
            <span>⚗</span>
            Generate Molecules
          </>
        )}
      </button>
    </form>
  );
}
