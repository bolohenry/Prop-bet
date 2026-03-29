import { SCORED_QUESTIONS, QUESTION_MAP } from '../../shared/questions.js';

export default function AnswerMatrix({ submissions, outcomes }) {
  if (!submissions || submissions.length === 0) {
    return <p className="text-gray-400 text-sm">No submissions yet.</p>;
  }

  const outcomeMap = {};
  if (outcomes) {
    for (const o of outcomes) {
      outcomeMap[o.question_id] = o;
    }
  }

  return (
    <div className="overflow-x-auto bg-white border rounded-lg">
      <table className="text-xs min-w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-3 py-2 font-medium text-gray-500 sticky left-0 bg-gray-50 z-10">Name</th>
            {SCORED_QUESTIONS.map(q => (
              <th key={q.id} className="px-2 py-2 font-medium text-gray-500 text-center whitespace-nowrap">
                Q{q.number}
              </th>
            ))}
          </tr>
          {/* Correct answers row */}
          <tr className="bg-gray-100 border-b">
            <td className="px-3 py-1 font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 text-xs">Answer</td>
            {SCORED_QUESTIONS.map(q => {
              const outcome = outcomeMap[q.id];
              return (
                <td key={q.id} className="px-2 py-1 text-center">
                  {outcome?.resolved ? (
                    <span className="font-semibold text-green-700">{outcome.answer}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y">
          {submissions.map(s => (
            <tr key={s.display_name}>
              <td className="px-3 py-2 font-medium whitespace-nowrap sticky left-0 bg-white z-10">{s.display_name}</td>
              {SCORED_QUESTIONS.map(q => {
                const answer = s[q.id];
                const outcome = outcomeMap[q.id];
                const isResolved = outcome?.resolved;
                const isCorrect = isResolved && outcome.answer === answer;

                let cellClass = 'text-gray-600';
                if (isResolved) {
                  cellClass = isCorrect ? 'text-green-700 font-semibold bg-green-50' : 'text-red-400';
                }

                return (
                  <td key={q.id} className={`px-2 py-2 text-center ${cellClass}`}>
                    {answer || '—'}
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
