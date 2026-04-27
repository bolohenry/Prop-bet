import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventByInvite, checkName, getSubmission } from '../lib/api';
import PageTitle from '../components/PageTitle';
import AvatarPicker from '../components/AvatarPicker';
import { LoadingPage } from '../components/Skeleton';

export default function ParticipantJoin() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
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
        if (avatar) sessionStorage.setItem(`wpb_avatar_${event.id}`, avatar);
        navigate(`/i/${inviteCode}/dashboard`);
        return;
      }
    } catch {}

    try {
      const { taken } = await checkName(event.id, name);
      if (taken) {
        setError('That name is taken — try a different one, or use the exact name you submitted with to view your dashboard.');
        setChecking(false);
        return;
      }
    } catch (err) {
      setError(err.message);
      setChecking(false);
      return;
    }

    sessionStorage.setItem(`wpb_name_${event.id}`, name);
    if (avatar) sessionStorage.setItem(`wpb_avatar_${event.id}`, avatar);
    navigate(`/i/${inviteCode}/survey`, { state: { displayName: name, avatar, event } });
  }

  if (loading) return <LoadingPage dark />;
  if (!event) return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800"><p className="text-danger-400">{error || 'Event not found.'}</p></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 relative overflow-hidden">
      <PageTitle title={event.name} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-accent-500)_0%,_transparent_50%)] opacity-10" />
      <div className="max-w-lg mx-auto px-4 sm:px-8 pt-8 sm:pt-16 pb-12 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">{event.name}</h1>
          <p className="text-brand-400 text-sm font-medium">wedding prop bets</p>
        </div>

        {event.status !== 'open' ? (
          <div className="bg-warn-500/15 border border-warn-500/20 rounded-2xl p-6 text-center">
            <span className="text-2xl block mb-3">🔒</span>
            <p className="text-warn-500 font-semibold">Submissions are currently closed for this event.</p>
          </div>
        ) : (
          <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 sm:p-8">
            <p className="text-brand-300 text-sm mb-6">Place your bets and see how you stack up.</p>
            <form onSubmit={handleContinue} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-brand-200 mb-2">Your name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Uncle Bob"
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-base text-white placeholder-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200"
                  autoFocus
                />
              </div>
              <AvatarPicker value={avatar} onChange={setAvatar} />
              <div>
                <label className="block text-sm font-semibold text-brand-200 mb-2">
                  Your email
                  <span className="text-brand-400/60 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-base text-white placeholder-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200"
                />
                <p className="text-brand-400/50 text-xs mt-1.5">We'll send you a link to check your results later.</p>
              </div>
              {error && (
                <div className="bg-danger-500/15 border border-danger-500/20 rounded-xl p-3">
                  <p className="text-danger-400 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={checking}
                className="w-full bg-brand-600 hover:bg-accent-500 text-white py-4 rounded-xl text-base font-bold transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-900/40 hover:shadow-accent-500/30"
              >
                {checking ? 'Checking...' : 'Continue'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
