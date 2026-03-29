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

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">Loading...</p></div>;
  if (!event) return <div className="flex items-center justify-center min-h-screen"><p className="text-red-500">{error || 'Event not found.'}</p></div>;

  return (
    <div className="max-w-lg mx-auto p-6 pt-12">
      <h1 className="text-2xl font-bold mb-1">{event.name}</h1>
      <p className="text-gray-500 mb-6">{new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      {event.status !== 'open' ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">Submissions are currently closed for this event.</p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">Enter your name to get started with the prop bets!</p>
          <form onSubmit={handleContinue} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Your Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Uncle Bob"
                className="w-full border rounded-lg px-4 py-3 text-base"
                autoFocus
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={checking}
              className="w-full bg-black text-white py-3 rounded-lg text-base font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {checking ? 'Checking...' : 'Continue'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
