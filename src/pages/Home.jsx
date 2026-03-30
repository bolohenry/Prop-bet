import { Link } from 'react-router-dom';
import ShareButton from '../components/ShareButton';
import PageTitle from '../components/PageTitle';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <PageTitle title={null} />

      {/* Top banner */}
      <div className="bg-brand-100/60">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">💍</span>
            <span className="text-sm font-bold text-brand-800 tracking-tight">Wedding prop bets</span>
          </div>
          <div className="flex items-center gap-4">
            <ShareButton variant="banner" />
            <Link
              to="/about"
              className="flex items-center gap-1.5 text-brand-600 hover:text-brand-800 transition-colors duration-150"
            >
              <span className="text-xs font-semibold">How it works</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="flex-1 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-brand-800)_0%,_transparent_50%)] opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--color-accent-500)_0%,_transparent_40%)] opacity-10" />

        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 tracking-tight leading-[1.15]">
            Weddings are fun.<br />
            <span className="text-accent-400">Betting on them is better.</span>
          </h1>
          <p className="text-brand-300 text-lg sm:text-xl max-w-md mx-auto mb-12 leading-relaxed">
            Turn any reception into a live, interactive game your guests will actually remember.
          </p>
          <Link
            to="/admin/create"
            className="inline-block bg-white text-brand-700 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-brand-50 transition-all duration-200 shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Create new event
          </Link>
        </div>
      </div>
    </div>
  );
}
