import { SCORED_QUESTIONS } from '../../shared/questions.js';

export default function AnswerMatrix({ submissions, outcomes }) {
  if (!submissions || submissions.length === 0) {
    return <p className="text-gray-400 text-sm">No submissions yet.</p>;
  }

  const outcomeMap = {};
  if (outcomes) {
    for (const o of outcomes) outcomeMap[o.question_id] = o;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04]">
      <table className="text-xs min-w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider sticky left-0 bg-white z-10">Name</th>
            {SCORED_QUESTIONS.map(q => (
              <th key={q.id} className="px-2 py-3 font-semibold text-gray-400 text-center whitespace-nowrap uppercase tracking-wider">
                Q{q.number}
              </th>
            ))}
          </tr>
          <tr className="border-b border-gray-100 bg-brand-50/40">
            <td className="px-4 py-2 font-bold text-brand-600 sticky left-0 bg-brand-50/40 z-10 text-xs">Correct</td>
            {SCORED_QUESTIONS.map(q => {
              const outcome = outcomeMap[q.id];
              return (
                <td key={q.id} className="px-2 py-2 text-center">
                  {outcome?.resolved ? (
                    <span className="font-bold text-brand-600">{outcome.answer}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {submissions.map(s => (
            <tr key={s.display_name} className="hover:bg-gray-50/50 transition-colors duration-150">
              <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap sticky left-0 bg-white z-10">{s.display_name}</td>
              {SCORED_QUESTIONS.map(q => {
                const answer = s[q.id];
                const outcome = outcomeMap[q.id];
                const isResolved = outcome?.resolved;
                const isCorrect = isResolved && outcome.answer === answer;
                const wagerLabel = s.wager_3x === q.id ? '3×' : s.wager_2x === q.id ? '2×' : null;

                return (
                  <td key={q.id} className={`px-2 py-3 text-center font-medium ${
                    isResolved
                      ? isCorrect
                        ? 'text-success-700 bg-success-50/60'
                        : 'text-gray-300'
                      : 'text-gray-500'
                  }`}>
                    {answer || '—'}
                    {wagerLabel && <sup className="text-[9px] ml-0.5 text-accent-500 font-bold">{wagerLabel}</sup>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
