import { Link } from 'react-router-dom';
import PageTitle from '../components/PageTitle';

export default function Home() {
  return (
    <div className="flex-1 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      <PageTitle title={null} />
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
          className="inline-block bg-white text-brand-700 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-accent-100 hover:text-accent-500 transition-all duration-200 shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
        >
          Create new event
        </Link>
      </div>
    </div>
  );
}
