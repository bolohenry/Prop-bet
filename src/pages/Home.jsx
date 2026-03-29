import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8">
        <span className="text-5xl">💍</span>
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight">
        Wedding prop bets
      </h1>
      <p className="text-brand-200 text-lg sm:text-xl max-w-md mb-10 leading-relaxed">
        Create prop bet games for your wedding and let guests play along in real time.
      </p>
      <Link
        to="/admin/create"
        className="bg-white text-brand-700 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-brand-50 transition-all shadow-lg shadow-brand-950/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
      >
        Create new event
      </Link>
    </div>
  );
}
