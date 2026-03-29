export default function Leaderboard({ submissions, winnerName, currentUser }) {
  if (!submissions || submissions.length === 0) {
    return <p className="text-gray-400 text-sm">No submissions yet.</p>;
  }

  const sorted = [...submissions].sort((a, b) => b.total_points - a.total_points || new Date(a.submitted_at) - new Date(b.submitted_at));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 font-semibold text-gray-500 w-10">#</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Name</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-500">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((s, i) => {
            const isMe = currentUser && s.display_name === currentUser;
            const isWinner = winnerName && s.display_name === winnerName;
            const rank = i + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

            return (
              <tr
                key={s.display_name}
                className={`transition-colors ${isMe ? 'bg-brand-50/60' : ''} ${isWinner ? 'bg-warn-50' : ''}`}
              >
                <td className="px-4 py-3 text-gray-400 font-mono">
                  {medal || rank}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {s.display_name}
                  {isMe && <span className="text-brand-500 text-xs ml-1.5 font-bold">(you)</span>}
                  {isWinner && <span className="text-warn-600 text-xs ml-1.5 font-bold">★ Winner</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-brand-100 text-brand-700 font-bold rounded-lg text-sm">
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
