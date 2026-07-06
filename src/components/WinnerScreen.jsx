import { computeWinner } from '../lib/winner';

export default function WinnerScreen({ submissions, tieWinnerName }) {
  const winner = computeWinner(submissions, tieWinnerName);
  if (!winner) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-accent-900 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-7xl mb-6">🏆</div>
        <p className="text-brand-300 text-sm font-bold uppercase tracking-wider mb-2">Winner</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight">
          {winner.avatar && <span className="mr-2">{winner.avatar}</span>}
          {winner.display_name}
        </h1>
        <p className="text-accent-300 text-2xl font-bold">{winner.total_points} points</p>
      </div>
    </div>
  );
}
