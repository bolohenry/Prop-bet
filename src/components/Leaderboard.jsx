import { useState, useEffect, useRef } from 'react';

export default function Leaderboard({ submissions, outcomes, winnerName, currentUser }) {
  const [flashNames, setFlashNames] = useState(new Set());
  const prevPoints = useRef({});

  useEffect(() => {
    if (!submissions) return;
    const newFlash = new Set();
    for (const s of submissions) {
      const prev = prevPoints.current[s.display_name];
      if (prev !== undefined && prev !== s.total_points) {
        newFlash.add(s.display_name);
      }
      prevPoints.current[s.display_name] = s.total_points;
    }
    if (newFlash.size > 0) {
      setFlashNames(newFlash);
      const timer = setTimeout(() => setFlashNames(new Set()), 1500);
      return () => clearTimeout(timer);
    }
  }, [submissions]);

  if (!submissions || submissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-8 text-center">
        <div className="text-3xl mb-3 opacity-40">📭</div>
        <p className="text-gray-400 text-sm">No submissions yet.</p>
      </div>
    );
  }

  const resolved = outcomes ? outcomes.filter(o => o.resolved).length : 0;
  const sorted = [...submissions].sort((a, b) => b.total_points - a.total_points || new Date(a.submitted_at) - new Date(b.submitted_at));

  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider w-10">#</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Name</th>
            <th className="text-right px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">
              Pts{resolved > 0 && <span className="font-normal text-gray-300">/{resolved}</span>}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((s, i) => {
            const isMe = currentUser && s.display_name === currentUser;
            const isWinner = winnerName && s.display_name === winnerName;
            const isFlashing = flashNames.has(s.display_name);
            const rank = i + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

            return (
              <tr
                key={s.display_name}
                className={`transition-all duration-300 ${isMe ? 'bg-brand-50/60' : ''} ${isWinner ? 'bg-warn-50/60' : ''} ${isFlashing ? 'bg-accent-100/80' : ''}`}
              >
                <td className="px-5 py-3.5 text-gray-400 font-mono text-sm">
                  {medal || rank}
                </td>
                <td className="px-5 py-3.5 font-semibold text-gray-800">
                  {s.avatar && <span className="mr-1">{s.avatar}</span>}
                  {s.display_name}
                  {isMe && <span className="text-brand-500 text-xs ml-1.5 font-bold">(you)</span>}
                  {isWinner && <span className="text-warn-600 text-xs ml-1.5 font-bold">★ winner</span>}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 bg-brand-100 text-brand-700 font-bold rounded-lg text-xs transition-transform duration-300 ${isFlashing ? 'scale-110' : ''}`}>
                    {s.total_points}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
