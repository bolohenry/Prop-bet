import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-brand-800)_0%,_transparent_50%)] opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--color-accent-500)_0%,_transparent_40%)] opacity-10" />

      <div className="relative z-10 max-w-lg">
        <div className="mb-10">
          <span className="text-6xl">💍</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight leading-[1.1]">
          Wedding<br />prop bets
        </h1>
        <p className="text-brand-300 text-lg sm:text-xl max-w-sm mx-auto mb-12 leading-relaxed">
          Create prop bet games for your wedding and let guests play along in real time.
        </p>
        <Link
          to="/admin/create"
          className="inline-block bg-white text-brand-700 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-brand-50 transition-all duration-200 shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
        >
          Create new event
        </Link>
      </div>
    </div>
  );
}
