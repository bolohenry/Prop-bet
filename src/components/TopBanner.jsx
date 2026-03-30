import { Link } from 'react-router-dom';
import ShareButton from './ShareButton';

export default function TopBanner() {
  return (
    <div className="bg-brand-100/60 border-b border-brand-200/40">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-150">
          <span className="text-sm">💍</span>
          <span className="text-sm font-bold text-brand-800 tracking-tight">Wedding prop bets</span>
        </Link>
        <div className="flex items-center gap-1">
          <ShareButton variant="banner" />
          <span className="text-brand-300 mx-1">·</span>
          <Link
            to="/about"
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors duration-150 cursor-pointer px-2 py-1"
          >
            How it works
          </Link>
        </div>
      </div>
    </div>
  );
}
