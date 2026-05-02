export default function LoadingSpinner() {
  return (
    <div className="loading-overlay">
      <div className="spinner-ring" />
      <p className="loading-text">Generating molecules…</p>
      <p className="loading-subtext">This may take a few moments</p>
    </div>
  );
}
