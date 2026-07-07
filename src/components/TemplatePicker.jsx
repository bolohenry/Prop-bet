export default function TemplatePicker({ onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        onClick={() => onSelect({ name: 'Classic Wedding', questions: null, editAfter: false })}
        className="text-left bg-white/[0.08] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.12] hover:border-brand-400/30 transition-all duration-200"
      >
        <div className="text-xl mb-2">💒</div>
        <p className="text-sm font-bold text-white">Classic Wedding</p>
        <p className="text-xs text-brand-400 mt-1">Our default 12 questions — ready to share right away</p>
      </button>

      <button
        onClick={() => onSelect({ name: 'Custom', questions: null, editAfter: true })}
        className="text-left bg-white/[0.06] border-2 border-dashed border-white/[0.12] rounded-2xl p-5 hover:border-brand-400/40 hover:bg-white/[0.08] transition-all duration-200"
      >
        <div className="text-xl mb-2">✏️</div>
        <p className="text-sm font-bold text-white">Custom</p>
        <p className="text-xs text-brand-400 mt-1">Same starting questions, but edit them before you share the link</p>
      </button>
    </div>
  );
}
