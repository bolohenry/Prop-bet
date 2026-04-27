import { useState, useEffect, useRef } from 'react';

const DEFAULT_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'submissions', label: 'Submissions' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'tiebreaker', label: 'Tiebreaker' },
  { id: 'matrix', label: 'Matrix' },
];

export default function StickyTabNav({ sections }) {
  const items = sections || DEFAULT_SECTIONS;
  const [active, setActive] = useState(items[0]?.id);
  const observerRef = useRef(null);

  useEffect(() => {
    const elements = items.map(s => document.getElementById(`section-${s.id}`)).filter(Boolean);
    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('section-', '');
            setActive(id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    for (const el of elements) observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [items]);

  function handleClick(id) {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-gray-200/60">
      <div className="max-w-4xl mx-auto px-4 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {items.map(s => (
          <button
            key={s.id}
            onClick={() => handleClick(s.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
              active === s.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { DEFAULT_SECTIONS };
