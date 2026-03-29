export function SkeletonLine({ className = '' }) {
  return <div className={`h-4 bg-gray-200 rounded-lg animate-pulse ${className}`} />;
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`bg-gray-200 rounded-2xl animate-pulse ${className}`} />;
}

export function LoadingPage({ dark = false }) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-3 ${dark ? 'bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800' : 'bg-surface'}`}>
      <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${dark ? 'border-brand-400' : 'border-brand-500'}`} />
      <p className={`text-sm ${dark ? 'text-brand-400' : 'text-gray-400'}`}>Loading...</p>
    </div>
  );
}
