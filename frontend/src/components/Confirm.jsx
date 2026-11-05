export default function Confirm({ title, text, confirmLabel = "Delete", onConfirm, onCancel }) {
  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal glass" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3><p>{text}</p>
        <div className="row end">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
