import { Link } from 'react-router-dom';
import ShareButton from '../components/ShareButton';
import PageTitle from '../components/PageTitle';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <PageTitle title={null} />

      {/* Hero */}
      <div className="flex-1 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-brand-800)_0%,_transparent_50%)] opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--color-accent-500)_0%,_transparent_40%)] opacity-10" />

        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight leading-[1.1]">
            Wedding<br />prop bets
          </h1>
          <p className="text-brand-300 text-lg sm:text-xl max-w-sm mx-auto mb-12 leading-relaxed">
            Predict what'll happen at the wedding. Compete on a live leaderboard. Crown a winner.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              to="/admin/create"
              className="inline-block bg-white text-brand-700 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-brand-50 transition-all duration-200 shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Create new event
            </Link>
            <ShareButton variant="dark" />
          </div>
        </div>
      </div>

      {/* Bottom banner — contrasting warm background */}
      <Link
        to="/about"
        className="block bg-gradient-to-r from-brand-50 via-accent-50 to-brand-50 hover:from-brand-100 hover:via-accent-100 hover:to-brand-100 transition-all duration-200 group"
      >
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p className="text-gray-800 font-semibold text-sm">How it works</p>
              <p className="text-gray-500 text-xs mt-0.5">See the rules, sample questions, and the story behind the app</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </Link>
    </div>
  );
}
