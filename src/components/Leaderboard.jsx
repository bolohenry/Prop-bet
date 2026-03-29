export default function Leaderboard({ submissions, winnerName, currentUser }) {
  if (!submissions || submissions.length === 0) {
    return <p className="text-gray-400 text-sm">No submissions yet.</p>;
  }

  const sorted = [...submissions].sort((a, b) => b.total_points - a.total_points || new Date(a.submitted_at) - new Date(b.submitted_at));

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-2 font-medium text-gray-500">#</th>
            <th className="text-left px-4 py-2 font-medium text-gray-500">Name</th>
            <th className="text-right px-4 py-2 font-medium text-gray-500">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((s, i) => {
            const isMe = currentUser && s.display_name === currentUser;
            const isWinner = winnerName && s.display_name === winnerName;
            return (
              <tr
                key={s.display_name}
                className={`${isMe ? 'bg-blue-50' : ''} ${isWinner ? 'bg-yellow-50' : ''}`}
              >
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2 font-medium">
                  {s.display_name}
                  {isMe && <span className="text-blue-500 text-xs ml-1">(you)</span>}
                  {isWinner && <span className="text-yellow-600 text-xs ml-1">★ Winner</span>}
                </td>
                <td className="px-4 py-2 text-right font-mono">{s.total_points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
