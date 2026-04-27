export default function TeamLeaderboard({ teams, submissions }) {
  if (!teams || teams.length === 0 || !submissions) return null;

  const teamScores = teams.map(t => {
    const members = submissions.filter(s => s.team_id === t.id);
    const totalPoints = members.reduce((sum, m) => sum + m.total_points, 0);
    const avgPoints = members.length > 0 ? Math.round(totalPoints / members.length * 10) / 10 : 0;
    return { ...t, members: members.length, totalPoints, avgPoints };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Team Standings</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-5 py-2 font-semibold text-gray-400 text-xs uppercase tracking-wider w-10">#</th>
            <th className="text-left px-5 py-2 font-semibold text-gray-400 text-xs uppercase tracking-wider">Team</th>
            <th className="text-center px-5 py-2 font-semibold text-gray-400 text-xs uppercase tracking-wider">Members</th>
            <th className="text-right px-5 py-2 font-semibold text-gray-400 text-xs uppercase tracking-wider">Avg</th>
            <th className="text-right px-5 py-2 font-semibold text-gray-400 text-xs uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {teamScores.map((t, i) => (
            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-5 py-3 text-gray-400 font-mono text-sm">{medals[i] || i + 1}</td>
              <td className="px-5 py-3 font-semibold text-gray-800">{t.name}</td>
              <td className="px-5 py-3 text-center text-gray-400 text-xs">{t.members}</td>
              <td className="px-5 py-3 text-right text-gray-500 text-xs">{t.avgPoints}</td>
              <td className="px-5 py-3 text-right">
                <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 bg-brand-100 text-brand-700 font-bold rounded-lg text-xs">
                  {t.totalPoints}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
