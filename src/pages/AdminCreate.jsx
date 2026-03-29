import { useState } from 'react';
import { createEvent } from '../lib/api';

export default function AdminCreate() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !date) {
      setError('Both fields are required.');
      return;
    }
    setLoading(true);
    try {
      const data = await createEvent(name.trim(), date);
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
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-4 sm:p-6">
        <div className="max-w-lg mx-auto pt-8 sm:pt-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-500/20 mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Event created</h1>
            <p className="text-brand-300">Save both links below. You'll need them to run your event.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔗</span>
                <label className="text-sm font-semibold text-white">Participant invite link</label>
              </div>
              <p className="text-brand-300 text-xs mb-3">Share this with your wedding guests</p>
              <div className="flex items-center gap-2">
                <input readOnly value={inviteLink} className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-mono text-brand-100 focus:outline-none" />
                <button
                  onClick={() => copyToClipboard(inviteLink, 'invite')}
                  className="px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  {copied.invite ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔒</span>
                <label className="text-sm font-semibold text-white">Admin dashboard link</label>
              </div>
              <p className="text-accent-400 text-xs mb-3">Keep this private — for event admin only</p>
              <div className="flex items-center gap-2">
                <input readOnly value={adminLink} className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-mono text-brand-100 focus:outline-none" />
                <button
                  onClick={() => copyToClipboard(adminLink, 'admin')}
                  className="px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  {copied.admin ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-4 sm:p-6">
      <div className="max-w-lg mx-auto pt-8 sm:pt-16">
        <div className="text-center mb-8">
          <span className="text-4xl mb-3 block">💍</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create a wedding event</h1>
          <p className="text-brand-300">Set up your prop bet event. You'll get shareable links after creating.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-brand-200 mb-1.5">Wedding name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Paul & Marie's Wedding"
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-200 mb-1.5">Wedding date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent [color-scheme:dark]"
            />
          </div>
          {error && (
            <div className="bg-danger-500/20 border border-danger-500/30 rounded-xl p-3">
              <p className="text-danger-500 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-400 text-white py-3.5 rounded-xl text-base font-bold transition-all disabled:opacity-50 shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30"
          >
            {loading ? 'Creating...' : 'Create event'}
          </button>
        </form>
      </div>
    </div>
  );
}
