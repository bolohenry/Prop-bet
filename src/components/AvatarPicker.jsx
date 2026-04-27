const AVATARS = [
  '😀', '😎', '🤠', '🥳', '😍',
  '🤩', '🧐', '🤓', '😇', '🥸',
  '👻', '🦊', '🐻', '🦄', '🐸',
  '🌸', '🔥', '⭐', '💎', '🎩',
];

export default function AvatarPicker({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-200 mb-2">Pick your avatar</label>
      <div className="grid grid-cols-10 gap-1.5">
        {AVATARS.map(emoji => {
          const isSelected = value === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg text-lg transition-all duration-150 ${
                isSelected
                  ? 'bg-brand-600 ring-2 ring-brand-400 scale-110 shadow-md'
                  : 'bg-white/[0.08] hover:bg-white/[0.15] active:scale-95'
              }`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { AVATARS };
