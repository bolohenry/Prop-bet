export default function MyResults({ scoredQuestions, answers, outcomeMap, wager3xKey, wager2xKey }) {
  if (!scoredQuestions || scoredQuestions.length === 0) {
    return <p className="text-gray-400 text-sm">No scored questions yet.</p>;
  }

  return (
    <div className="space-y-2">
      {scoredQuestions.map(q => {
        const myAnswer = answers?.[q.question_key];
        const outcome = outcomeMap?.[q.question_key];
        const isResolved = outcome?.resolved;
        const isCorrect = isResolved && outcome.answer === myAnswer;
        const wagerLabel = wager3xKey === q.question_key ? '3×' : wager2xKey === q.question_key ? '2×' : null;

        return (
          <div
            key={q.question_key}
            className={`rounded-xl p-4 border ${
              isResolved
                ? isCorrect
                  ? 'bg-success-50/60 border-success-200'
                  : 'bg-gray-50 border-gray-100'
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-gray-800 flex-1">
                Q{q.number}. {q.label}
                {wagerLabel && <span className="ml-1.5 text-accent-500 text-xs font-bold">{wagerLabel}</span>}
              </p>
              {isResolved ? (
                <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${isCorrect ? 'bg-success-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap bg-gray-100 text-gray-400">
                  Pending
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <p className="text-gray-500">Your answer: <span className="font-semibold text-gray-800">{myAnswer || '—'}</span></p>
              {isResolved && (
                <p className="text-gray-500">Correct answer: <span className="font-semibold text-gray-800">{outcome.answer}</span></p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
