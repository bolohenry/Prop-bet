import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createEvent } from '../lib/api';
import NavHeader from '../components/NavHeader';
import PageTitle from '../components/PageTitle';

export default function AdminCreate() {
  const [name, setName] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Wedding name is required.');
      return;
    }
    setLoading(true);
    try {
      const data = await createEvent(name.trim());
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
  }

  const origin = window.location.origin;

  if (result) {
    const inviteLink = `${origin}/i/${result.inviteCode}`;
    const adminLink = `${origin}/admin/${result.adminCode}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 relative overflow-hidden">
        <PageTitle title="Event created" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-accent-500)_0%,_transparent_50%)] opacity-10" />
        <NavHeader variant="dark" />
        <div className="max-w-lg mx-auto px-4 sm:px-8 pt-8 sm:pt-16 pb-12 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success-500/20 mb-5">
              <span className="text-3xl">🎉</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">Event created</h1>
            <p className="text-brand-300 text-base">Save both links below — you'll need them to run your event.</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🔗</span>
                <label className="text-sm font-semibold text-white/90">Participant invite link</label>
              </div>
              <p className="text-brand-400 text-xs mb-3">Share this with your wedding guests</p>
              <div className="flex items-center gap-2">
                <input readOnly value={inviteLink} className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm font-mono text-brand-200 focus:outline-none" />
                <button
                  onClick={() => copyToClipboard(inviteLink, 'invite')}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap"
                >
                  {copied.invite ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🔒</span>
                <label className="text-sm font-semibold text-white/90">Admin dashboard link</label>
              </div>
              <p className="text-accent-400 text-xs mb-3">Keep this private — for event admin only</p>
              <div className="flex items-center gap-2">
                <input readOnly value={adminLink} className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm font-mono text-brand-200 focus:outline-none" />
                <button
                  onClick={() => copyToClipboard(adminLink, 'admin')}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap"
                >
                  {copied.admin ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-warn-500/15 border border-warn-500/20 rounded-xl p-4 mb-6">
            <p className="text-warn-500 text-xs">Save your admin link somewhere safe. If you lose it, there's no way to recover access to your event.</p>
          </div>

          <Link
            to={`/admin/${result.adminCode}`}
            className="block w-full bg-brand-600 hover:bg-brand-500 text-white py-4 rounded-xl text-base font-bold transition-all duration-200 shadow-lg shadow-brand-900/40 text-center"
          >
            Open admin dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 relative overflow-hidden">
      <PageTitle title="Create event" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-accent-500)_0%,_transparent_50%)] opacity-10" />
      <NavHeader variant="dark" />
      <div className="max-w-lg mx-auto px-4 sm:px-8 pt-8 sm:pt-16 pb-12 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">Create a wedding event</h1>
          <p className="text-brand-300 text-base">Set up your prop bet event — you'll get shareable links after creating.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-brand-200 mb-2">Wedding name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Paul & Marie's wedding"
              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-base text-white placeholder-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200"
              autoFocus
            />
          </div>
          {error && (
            <div className="bg-danger-500/15 border border-danger-500/20 rounded-xl p-3">
              <p className="text-danger-400 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white py-4 rounded-xl text-base font-bold transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-900/40"
          >
            {loading ? 'Creating...' : 'Create event'}
          </button>
        </form>
      </div>
    </div>
  );
}
