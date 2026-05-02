import { useState } from 'react';
import MoleculeCard from './MoleculeCard';

const PAGE_SIZE = 12;

export default function MoleculeGrid({ molecules, meta }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(molecules.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const visible = molecules.slice(start, start + PAGE_SIZE);

  const handlePageChange = (p) => {
    setPage(p);
    // Scroll results panel to top
    document.querySelector('.results-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Results header */}
      <div className="results-header">
        <div className="results-title-group">
          <h2 className="gradient-text">Generated Molecules</h2>
          <div className="results-stats">
            <span className="stat-pill valid">✓ {meta.generated} valid</span>
            <span className="stat-pill requested">↳ {meta.requested} requested</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="molecule-grid">
        {visible.map((mol, i) => (
          <MoleculeCard
            key={`${mol.smiles}-${start + i}`}
            molecule={mol}
            index={start + i}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`page-btn${page === p ? ' active' : ''}`}
              onClick={() => handlePageChange(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            →
          </button>
          <span className="page-info">
            {start + 1}–{Math.min(start + PAGE_SIZE, molecules.length)} / {molecules.length}
          </span>
        </div>
      )}
    </>
  );
}
