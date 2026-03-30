import { Link } from 'react-router-dom';
import ShareButton from './ShareButton';

export default function TopBanner() {
  return (
    <div className="bg-brand-100/60">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-150">
          <span className="text-sm">💍</span>
          <span className="text-sm font-bold text-brand-800 tracking-tight">Wedding prop bets</span>
        </Link>
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
  );
}
