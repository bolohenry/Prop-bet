export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', destructive = false, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 z-10">
        <h3 className="text-lg font-extrabold text-gray-800 mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-500 mb-6">{description}</p>}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 shadow-md ${
              destructive
                ? 'bg-danger-500 hover:bg-danger-600 shadow-danger-500/20'
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
