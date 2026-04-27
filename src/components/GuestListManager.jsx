import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { addGuests, deleteGuest, importGuestsCsv } from '../lib/api';

export default function GuestListManager({ eventId, guests, setGuests, submissions }) {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const fileRef = useRef(null);

  const submissionNames = new Set((submissions || []).map(s => s.display_name.toLowerCase()));

  const enrichedGuests = guests.map(g => {
    let status = g.status;
    if (status === 'invited' && submissionNames.has(g.name.toLowerCase())) {
      status = 'submitted';
    }
    return { ...g, liveStatus: status };
  });

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const added = await addGuests(eventId, [{ name: newName.trim(), email: newEmail.trim() || null }]);
      setGuests(prev => [...prev, ...added]);
      setNewName('');
      setNewEmail('');
      toast.success('Guest added');
    } catch (err) {
      toast.error(err.message);
    }
    setAdding(false);
  }

  async function handleCsvUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const added = await importGuestsCsv(eventId, text);
      setGuests(prev => [...prev, ...added]);
      toast.success(`${added.length} guests imported`);
    } catch (err) {
      toast.error(err.message);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleRemove(guestId) {
    try {
      await deleteGuest(guestId);
      setGuests(prev => prev.filter(g => g.id !== guestId));
    } catch (err) {
      toast.error(err.message);
    }
  }

  const statusColor = {
    invited: 'bg-gray-100 text-gray-500',
    joined: 'bg-blue-100 text-blue-600',
    submitted: 'bg-success-100 text-success-600',
  };

  const submittedCount = enrichedGuests.filter(g => g.liveStatus === 'submitted').length;

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-5">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Guest name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Optional"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <button type="submit" disabled={adding} className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 whitespace-nowrap">
            Add
          </button>
          <label className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-600 cursor-pointer transition-colors whitespace-nowrap">
            CSV
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
          </label>
        </div>
      </form>

      {enrichedGuests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">{submittedCount}/{enrichedGuests.length} submitted</span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {enrichedGuests.map(g => (
                <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-gray-800">{g.name}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{g.email || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[g.liveStatus] || statusColor.invited}`}>
                      {g.liveStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleRemove(g.id)} className="text-gray-300 hover:text-danger-500 text-xs transition-colors">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {enrichedGuests.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-8 text-center">
          <p className="text-gray-400 text-sm">No guests added yet. Add them manually or upload a CSV.</p>
        </div>
      )}
    </div>
  );
}
