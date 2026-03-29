import { Link } from 'react-router-dom';
import ShareButton from '../components/ShareButton';
import PageTitle from '../components/PageTitle';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex flex-col relative overflow-hidden">
      <PageTitle title={null} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-brand-800)_0%,_transparent_50%)] opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--color-accent-500)_0%,_transparent_40%)] opacity-10" />

      {/* Main hero */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
        <div className="max-w-lg">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight leading-[1.1]">
            Wedding<br />prop bets
          </h1>
          <p className="text-brand-300 text-lg sm:text-xl max-w-sm mx-auto mb-12 leading-relaxed">
            Predict what'll happen at the wedding. Compete on a live leaderboard. Crown a winner.
          </p>
          <Link
            to="/admin/create"
            className="inline-block bg-white text-brand-700 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-brand-50 transition-all duration-200 shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Create new event
          </Link>
        </div>
      </div>

      {/* Bottom banner */}
      <div className="relative z-10 px-6 pb-8">
        <Link
          to="/about"
          className="block max-w-lg mx-auto bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-sm border border-white/[0.1] rounded-2xl px-6 py-4 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">How it works</p>
              <p className="text-brand-400 text-xs mt-0.5">See the rules, sample questions, and the story behind the app</p>
            </div>
            <svg className="w-5 h-5 text-brand-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200 shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>
        <div className="flex justify-center mt-4">
          <ShareButton variant="dark" />
        </div>
      </div>
    </div>
  );
}
