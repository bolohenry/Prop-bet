import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LINE_COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6', '#6366f1', '#f97316'];

export default function ScoreProgressionChart({ scoredQuestions, outcomes, submissions }) {
  if (!scoredQuestions || !outcomes || !submissions || submissions.length === 0) return null;

  const outcomeMap = {};
  for (const o of outcomes) outcomeMap[o.question_id] = o;

  const resolvedQs = scoredQuestions.filter(q => outcomeMap[q.question_key]?.resolved);
  if (resolvedQs.length === 0) return null;

  const top5 = [...submissions]
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 5);

  const data = resolvedQs.map((q, qi) => {
    const point = { question: `Q${q.number}` };
    for (const s of top5) {
      let cumulative = 0;
      for (let j = 0; j <= qi; j++) {
        const rq = resolvedQs[j];
        const outcome = outcomeMap[rq.question_key];
        if (outcome?.resolved && s.answers?.[rq.question_key] === outcome.answer) {
          let mult = 1;
          if (s.wager_3x === rq.question_key) mult = 3;
          else if (s.wager_2x === rq.question_key) mult = 2;
          cumulative += mult;
        }
      }
      point[s.display_name] = cumulative;
    }
    return point;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Score Progression (Top 5)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <XAxis dataKey="question" tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} width={30} />
          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {top5.map((s, i) => (
            <Line
              key={s.display_name}
              type="monotone"
              dataKey={s.display_name}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
