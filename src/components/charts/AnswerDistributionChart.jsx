import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6'];

export default function AnswerDistributionChart({ question, submissions }) {
  const qKey = question.question_key;
  const counts = {};
  for (const s of submissions) {
    const a = s.answers?.[qKey] || '(none)';
    counts[a] = (counts[a] || 0) + 1;
  }

  const data = Object.entries(counts)
    .map(([answer, count]) => ({ answer, count, pct: Math.round((count / submissions.length) * 100) }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <p className="text-sm font-semibold text-gray-800 mb-2">Q{question.number}. {question.label}</p>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="answer" width={100} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip
            formatter={(value, name, props) => [`${value} (${props.payload.pct}%)`, 'Responses']}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
