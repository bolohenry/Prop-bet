import { Link } from 'react-router-dom';
import ShareButton from '../components/ShareButton';
import PageTitle from '../components/PageTitle';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      <PageTitle title={null} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-brand-800)_0%,_transparent_50%)] opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--color-accent-500)_0%,_transparent_40%)] opacity-10" />

      <div className="relative z-10 max-w-lg">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight leading-[1.1]">
          Wedding<br />prop bets
        </h1>
        <p className="text-brand-300 text-lg sm:text-xl max-w-sm mx-auto mb-12 leading-relaxed">
          Predict what'll happen at the wedding. Compete on a live leaderboard. Crown a winner.
        </p>
        <div className="flex flex-col items-center gap-5">
          <Link
            to="/admin/create"
            className="inline-block bg-white text-brand-700 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-brand-50 transition-all duration-200 shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Create new event
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/about"
              className="text-sm font-medium text-brand-400 hover:text-white transition-colors duration-150 underline underline-offset-2 decoration-brand-400/30 hover:decoration-white/40"
            >
              How it works
            </Link>
            <span className="text-brand-700">·</span>
            <ShareButton variant="dark" />
          </div>
        </div>
      </div>
    </div>
  );
}
