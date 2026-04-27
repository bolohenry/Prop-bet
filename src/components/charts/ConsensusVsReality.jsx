export default function ConsensusVsReality({ scoredQuestions, outcomes, submissions }) {
  if (!scoredQuestions || !outcomes || !submissions || submissions.length === 0) return null;

  const outcomeMap = {};
  for (const o of outcomes) outcomeMap[o.question_id] = o;

  const rows = scoredQuestions
    .filter(q => outcomeMap[q.question_key]?.resolved)
    .map(q => {
      const correct = outcomeMap[q.question_key].answer;
      const counts = {};
      for (const s of submissions) {
        const a = s.answers?.[q.question_key] || '(none)';
        counts[a] = (counts[a] || 0) + 1;
      }
      const popular = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      const popularAnswer = popular?.[0] || '—';
      const popularPct = popular ? Math.round((popular[1] / submissions.length) * 100) : 0;
      const correctCount = counts[correct] || 0;
      const correctPct = Math.round((correctCount / submissions.length) * 100);
      const match = popularAnswer === correct;

      return { question: q, correct, popularAnswer, popularPct, correctPct, match };
    });

  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Consensus vs Reality</h3>
      <div className="space-y-4">
        {rows.map(r => (
          <div key={r.question.question_key} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
            <p className="text-sm font-semibold text-gray-800 mb-2">Q{r.question.number}. {r.question.label}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-3 ${r.match ? 'bg-success-50' : 'bg-gray-50'}`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Most Popular</p>
                <p className="text-sm font-bold text-gray-800">{r.popularAnswer}</p>
                <p className="text-xs text-gray-500">{r.popularPct}% picked this</p>
              </div>
              <div className="bg-brand-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Correct Answer</p>
                <p className="text-sm font-bold text-brand-700">{r.correct}</p>
                <p className="text-xs text-gray-500">{r.correctPct}% got it right</p>
              </div>
            </div>
            {r.match && (
              <p className="text-xs text-success-600 font-semibold mt-1.5">The crowd got this one right!</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
