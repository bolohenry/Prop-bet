import { useState } from 'react';
import { createTeam, joinTeam } from '../lib/api';

export default function TeamPicker({ eventId, onTeamSelected }) {
  const [mode, setMode] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setError('');
    setLoading(true);
    try {
      const team = await createTeam(eventId, teamName.trim());
      onTeamSelected(team);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!teamCode.trim()) return;
    setError('');
    setLoading(true);
    try {
      const team = await joinTeam(eventId, teamCode.trim());
      onTeamSelected(team);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  if (!mode) {
    return (
      <div>
        <label className="block text-sm font-semibold text-brand-200 mb-2">Join a team (optional)</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode('join')} className="flex-1 py-3 rounded-xl border border-white/10 bg-white/[0.06] text-brand-200 text-sm font-semibold hover:bg-white/[0.1] transition-colors">
            Join team
          </button>
          <button type="button" onClick={() => setMode('create')} className="flex-1 py-3 rounded-xl border border-white/10 bg-white/[0.06] text-brand-200 text-sm font-semibold hover:bg-white/[0.1] transition-colors">
            Create team
          </button>
          <button type="button" onClick={() => onTeamSelected(null)} className="py-3 px-4 text-brand-400/60 text-xs font-medium hover:text-brand-300 transition-colors">
            Skip
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div>
        <label className="block text-sm font-semibold text-brand-200 mb-2">Enter team code</label>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={teamCode}
            onChange={e => setTeamCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-base text-white placeholder-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/50 uppercase tracking-widest text-center font-mono"
          />
          <button type="submit" disabled={loading} className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
            Join
          </button>
          <button type="button" onClick={() => { setMode(null); setError(''); }} className="text-brand-400/60 text-xs px-2">Back</button>
        </form>
        {error && <p className="text-danger-400 text-xs mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-brand-200 mb-2">Create a new team</label>
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={teamName}
          onChange={e => setTeamName(e.target.value)}
          placeholder="Team name"
          className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-base text-white placeholder-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        />
        <button type="submit" disabled={loading} className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
          Create
        </button>
        <button type="button" onClick={() => { setMode(null); setError(''); }} className="text-brand-400/60 text-xs px-2">Back</button>
      </form>
      {error && <p className="text-danger-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
