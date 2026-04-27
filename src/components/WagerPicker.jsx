export default function WagerPicker({ answers, wagers, onWagerChange, onBack, onSubmit, submitting, scoredQuestions }) {
  const tripleQ = Object.entries(wagers).find(([, v]) => v === 3)?.[0] || null;
  const doubleQ = Object.entries(wagers).find(([, v]) => v === 2)?.[0] || null;

  function handleCycle(qId) {
    const current = wagers[qId] || 1;
    let next;
    if (current === 1) {
      next = tripleQ ? (doubleQ ? 1 : 2) : 3;
    } else if (current === 2) {
      next = tripleQ ? 1 : 3;
    } else {
      next = doubleQ ? 1 : 2;
    }

    onWagerChange(qId, next);
  }

  return (
    <div className="min-h-screen bg-surface pb-8">
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-4 py-6 text-center">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1 tracking-tight">Place Your Wagers 🎰</h2>
        <p className="text-brand-300 text-sm max-w-md mx-auto">
          Pick <span className="text-brand-200 font-bold">1 question to triple down (3×)</span> and{' '}
          <span className="text-accent-300 font-bold">1 to double down (2×)</span>
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-3 space-y-3">
        {scoredQuestions.map(q => {
          const qKey = q.question_key;
          const wager = wagers[qKey] || 1;
          const answer = answers[qKey];

          const borderClass =
            wager === 3
              ? 'border-brand-500 bg-brand-50/60'
              : wager === 2
              ? 'border-accent-400 bg-accent-50/60'
              : 'border-transparent';

          const pillClass =
            wager === 3
              ? 'bg-brand-600 text-white'
              : wager === 2
              ? 'bg-accent-500 text-white'
              : 'bg-gray-100 text-gray-400';

          return (
            <button
              key={qKey}
              type="button"
              onClick={() => handleCycle(qKey)}
              className={`w-full text-left bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 transition-all duration-200 ${borderClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold mr-2">
                      {q.number}
                    </span>
                    {q.label}
                  </p>
                  {answer && (
                    <p className="text-xs text-gray-400 italic mt-1.5 ml-8">Your answer: {answer}</p>
                  )}
                </div>
                <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${pillClass}`}>
                  {wager}×
                </span>
              </div>
            </button>
          );
        })}

        <div className="flex items-center justify-center gap-6 py-2 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
            3× Triple {tripleQ ? '✓' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-500" />
            2× Double {doubleQ ? '✓' : ''}
          </span>
        </div>

        <div className="flex gap-3 pt-2 sticky bottom-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300 py-4 rounded-2xl text-base font-bold transition-all duration-200"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="flex-[2] bg-brand-600 hover:bg-accent-500 text-white py-4 rounded-2xl text-base font-bold transition-all duration-200 disabled:opacity-50 shadow-xl shadow-brand-600/25 hover:shadow-accent-500/30 active:scale-[0.98]"
          >
            {submitting ? 'Submitting...' : 'Submit my bets 🎲'}
          </button>
        </div>
      </div>
    </div>
  );
}
