import { Link } from 'react-router-dom';

export default function NavHeader({ variant = 'light' }) {
  const isDark = variant === 'dark';

  return (
    <header className={`px-4 sm:px-6 py-3 flex items-center justify-between ${isDark ? '' : 'bg-white/80 backdrop-blur-sm border-b border-gray-100'}`}>
      <Link to="/" className={`text-sm font-bold tracking-tight transition-colors duration-150 ${isDark ? 'text-white/70 hover:text-white' : 'text-gray-800 hover:text-brand-600'}`}>
        💍 Wedding prop bets
      </Link>
      <Link to="/about" className={`text-xs font-medium transition-colors duration-150 ${isDark ? 'text-brand-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
        How it works
      </Link>
    </header>
  );
}
