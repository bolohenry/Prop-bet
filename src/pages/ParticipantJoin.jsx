import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventByInvite, checkName, getSubmission } from '../lib/api';

export default function ParticipantJoin() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    getEventByInvite(inviteCode)
      .then(setEvent)
      .catch(() => setError('Event not found.'))
      .finally(() => setLoading(false));
  }, [inviteCode]);

  async function handleContinue(e) {
    e.preventDefault();
    setError('');
    const name = displayName.trim();
    if (!name) { setError('Please enter your name.'); return; }

    setChecking(true);
    try {
      const existing = await getSubmission(event.id, name);
      if (existing) {
        sessionStorage.setItem(`wpb_name_${event.id}`, name);
        navigate(`/i/${inviteCode}/dashboard`);
        return;
      }
    } catch {}

    try {
      const { taken } = await checkName(event.id, name);
      if (taken) {
        setError('That name is already taken. If you already submitted, you should be redirected to your dashboard.');
        setChecking(false);
        return;
      }
    } catch (err) {
      setError(err.message);
      setChecking(false);
      return;
    }

    sessionStorage.setItem(`wpb_name_${event.id}`, name);
    navigate(`/i/${inviteCode}/survey`, { state: { displayName: name, event } });
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800"><p className="text-brand-300">Loading...</p></div>;
  if (!event) return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800"><p className="text-danger-500">{error || 'Event not found.'}</p></div>;

  const formattedDate = new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-4 sm:p-6">
      <div className="max-w-lg mx-auto pt-8 sm:pt-16">
        <div className="text-center mb-8">
          <span className="text-4xl mb-3 block">🥂</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{event.name}</h1>
          <p className="text-brand-300">{formattedDate}</p>
        </div>

        {event.status !== 'open' ? (
          <div className="bg-warn-500/20 border border-warn-500/30 rounded-2xl p-5 text-center">
            <span className="text-2xl block mb-2">🔒</span>
            <p className="text-warn-500 font-semibold">Submissions are currently closed for this event.</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <p className="text-brand-200 text-sm mb-5">Enter your name to get started with the prop bets.</p>
            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-200 mb-1.5">Your display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Uncle Bob"
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3.5 text-base text-white placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              {error && (
                <div className="bg-danger-500/20 border border-danger-500/30 rounded-xl p-3">
                  <p className="text-danger-500 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={checking}
                className="w-full bg-brand-500 hover:bg-brand-400 text-white py-3.5 rounded-xl text-base font-bold transition-all disabled:opacity-50 shadow-lg shadow-brand-500/25"
              >
                {checking ? 'Checking...' : 'Continue →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
