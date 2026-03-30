import { useState } from 'react';

const SHARE_DATA = {
  title: 'Wedding prop bets',
  text: 'Make your wedding more fun — set up prop bets for your guests to play in real time.',
};

export default function ShareButton({ variant = 'dark', className = '' }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.origin;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ ...SHARE_DATA, url });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  if (variant === 'banner') {
    return (
      <button
        onClick={handleShare}
        className={`text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors duration-150 cursor-pointer ${className}`}
      >
        {copied ? 'Link copied' : 'Share with a friend'}
      </button>
    );
  }

  const styles = variant === 'dark'
    ? 'text-brand-400 hover:text-white border-brand-400/20 hover:border-brand-400/40 hover:bg-white/[0.06]'
    : 'text-gray-400 hover:text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50';

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border cursor-pointer transition-all duration-200 ${styles} ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      {copied ? 'Link copied' : 'Share with a friend'}
    </button>
  );
}
