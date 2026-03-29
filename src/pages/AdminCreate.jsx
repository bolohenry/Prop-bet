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
      <div className="max-w-lg mx-auto p-6 pt-12">
        <h1 className="text-2xl font-bold mb-2">Event Created!</h1>
        <p className="text-gray-500 mb-6">Save both links below. You'll need them to manage your event.</p>

        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Participant Invite Link</label>
            <p className="text-sm text-gray-400 mb-2">Share this with your guests</p>
            <div className="flex items-center gap-2">
              <input readOnly value={inviteLink} className="flex-1 bg-gray-50 border rounded px-3 py-2 text-sm font-mono" />
              <button
                onClick={() => copyToClipboard(inviteLink, 'invite')}
                className="px-3 py-2 bg-black text-white rounded text-sm font-medium hover:bg-gray-800 whitespace-nowrap"
              >
                {copied.invite ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Admin Dashboard Link</label>
            <p className="text-sm text-red-400 mb-2">Keep this private — for event admin only</p>
            <div className="flex items-center gap-2">
              <input readOnly value={adminLink} className="flex-1 bg-gray-50 border rounded px-3 py-2 text-sm font-mono" />
              <button
                onClick={() => copyToClipboard(adminLink, 'admin')}
                className="px-3 py-2 bg-black text-white rounded text-sm font-medium hover:bg-gray-800 whitespace-nowrap"
              >
                {copied.admin ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 pt-12">
      <h1 className="text-2xl font-bold mb-2">Create a Wedding Event</h1>
      <p className="text-gray-500 mb-6">Set up your prop bet event. You'll get invite and admin links after creating.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Wedding Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Paul & Marie's Wedding"
            className="w-full border rounded-lg px-4 py-3 text-base"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Wedding Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 text-base"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg text-base font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}
