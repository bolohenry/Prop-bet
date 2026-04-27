import { useState, useEffect } from 'react';
import { getTemplates } from '../lib/api';

const CATEGORY_LABELS = {
  wedding: 'Wedding',
  baby_shower: 'Baby Shower',
  birthday: 'Birthday',
  sports: 'Sports',
  custom: 'Custom',
};

const CATEGORY_ICONS = {
  wedding: '💒',
  baby_shower: '👶',
  birthday: '🎂',
  sports: '🏈',
  custom: '✏️',
};

export default function TemplatePicker({ onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getTemplates().then(setTemplates).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(templates.map(t => t.category))];
  const filtered = filter === 'all' ? templates : templates.filter(t => t.category === filter);

  if (loading) {
    return <div className="text-brand-400 text-sm text-center py-8">Loading templates...</div>;
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
              filter === c
                ? 'bg-brand-600 text-white'
                : 'bg-white/[0.08] text-brand-300 hover:bg-white/[0.12]'
            }`}
          >
            {c === 'all' ? 'All' : `${CATEGORY_ICONS[c] || ''} ${CATEGORY_LABELS[c] || c}`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onSelect(null)}
          className="text-left bg-white/[0.06] border-2 border-dashed border-white/[0.12] rounded-2xl p-5 hover:border-brand-400/40 hover:bg-white/[0.08] transition-all duration-200"
        >
          <div className="text-xl mb-2">📝</div>
          <p className="text-sm font-bold text-white">Start from scratch</p>
          <p className="text-xs text-brand-400 mt-1">Create your own questions</p>
        </button>

        {filtered.map(t => {
          const qCount = Array.isArray(t.questions) ? t.questions.length : 0;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="text-left bg-white/[0.08] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.12] hover:border-brand-400/30 transition-all duration-200"
            >
              <div className="text-xl mb-2">{CATEGORY_ICONS[t.category] || '📋'}</div>
              <p className="text-sm font-bold text-white">{t.name}</p>
              {t.description && <p className="text-xs text-brand-400 mt-1 line-clamp-2">{t.description}</p>}
              <p className="text-[10px] text-brand-500 mt-2">{qCount} questions</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
