import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventByAdmin, updateEventStatus, scoreQuestion, setTieWinner, downloadCsv } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import { QUESTIONS, SCORED_QUESTIONS } from '../../shared/questions.js';
import Leaderboard from '../components/Leaderboard';
import AnswerMatrix from '../components/AnswerMatrix';

export default function AdminDashboard() {
  const { adminCode } = useParams();
  const [eventMeta, setEventMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getEventByAdmin(adminCode)
      .then(setEventMeta)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [adminCode]);

  const { submissions, outcomes, event: liveEvent } = useRealtimeDashboard(eventMeta?.id);
  const event = liveEvent || eventMeta;

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">Loading...</p></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen"><p className="text-red-500">{error}</p></div>;
  if (!event) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-12">
      <h1 className="text-2xl font-bold mb-1">{event.name}</h1>
      <p className="text-gray-500 text-sm mb-2">
        {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      <p className="text-xs text-gray-400 mb-6">Admin Dashboard</p>

      <StatusControl adminCode={adminCode} currentStatus={event.status} />

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Submissions ({submissions?.length || 0})</h2>
          <button
            onClick={() => downloadCsv(event, submissions || [])}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded font-medium transition-colors"
          >
            Export CSV
          </button>
        </div>
        <SubmissionsTable submissions={submissions} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Scoring</h2>
        <ScoringPanel adminCode={adminCode} outcomes={outcomes} submissions={submissions} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
        <Leaderboard submissions={submissions} winnerName={event.tie_winner_name} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Tie Winner</h2>
        <TieWinnerControl adminCode={adminCode} submissions={submissions} currentWinner={event.tie_winner_name} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Answer Matrix</h2>
        <AnswerMatrix submissions={submissions} outcomes={outcomes} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Tie Breaker Answers</h2>
        <TieBreakerTable submissions={submissions} />
      </section>
    </div>
  );
}

function StatusControl({ adminCode, currentStatus }) {
  const [updating, setUpdating] = useState(false);
  const statuses = ['open', 'locked', 'scoring', 'finalized'];

  async function handleChange(status) {
    setUpdating(true);
    try { await updateEventStatus(adminCode, status); } catch {}
    setUpdating(false);
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-6">
      <label className="block text-sm font-medium text-gray-600 mb-2">Event Status</label>
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => handleChange(s)}
            disabled={updating}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
              currentStatus === s
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {currentStatus === 'open' && 'Participants can submit answers.'}
        {currentStatus === 'locked' && 'Submissions closed. Ready to start scoring.'}
        {currentStatus === 'scoring' && 'Scoring in progress. Dashboard updates live.'}
        {currentStatus === 'finalized' && 'Event is complete.'}
      </p>
    </div>
  );
}

function SubmissionsTable({ submissions }) {
  if (!submissions || submissions.length === 0) return <p className="text-gray-400 text-sm">No submissions yet.</p>;

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-2 font-medium text-gray-500">Name</th>
            <th className="text-left px-4 py-2 font-medium text-gray-500">Submitted</th>
            <th className="text-right px-4 py-2 font-medium text-gray-500">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {submissions.map(s => (
            <tr key={s.display_name}>
              <td className="px-4 py-2 font-medium">{s.display_name}</td>
              <td className="px-4 py-2 text-gray-500">{new Date(s.submitted_at).toLocaleString()}</td>
              <td className="px-4 py-2 text-right font-mono">{s.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoringPanel({ adminCode, outcomes, submissions }) {
  const outcomeMap = {};
  if (outcomes) {
    for (const o of outcomes) outcomeMap[o.question_id] = o;
  }

  return (
    <div className="space-y-3">
      {SCORED_QUESTIONS.map(q => (
        <ScoringCard key={q.id} question={q} outcome={outcomeMap[q.id]} adminCode={adminCode} submissions={submissions} />
      ))}
    </div>
  );
}

function ScoringCard({ question, outcome, adminCode, submissions }) {
  const [saving, setSaving] = useState(false);
  const isResolved = outcome?.resolved;
  const currentAnswer = outcome?.answer;

  const options = question.type === 'yesno' ? ['Yes', 'No']
    : question.type === 'overunder' ? ['Over', 'Under']
    : question.options || [];

  const correctCount = isResolved && submissions
    ? submissions.filter(s => s[question.id] === currentAnswer).length
    : null;

  async function handleScore(answer) {
    setSaving(true);
    try {
      if (isResolved && currentAnswer === answer) {
        await scoreQuestion(adminCode, question.id, null, false);
      } else {
        await scoreQuestion(adminCode, question.id, answer, true);
      }
    } catch {}
    setSaving(false);
  }

  return (
    <div className={`bg-white border rounded-lg p-4 ${isResolved ? 'border-green-200 bg-green-50/30' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-medium">
          <span className="text-gray-400">Q{question.number}.</span> {question.text}
        </p>
        {isResolved && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
            Resolved
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleScore(opt)}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              isResolved && currentAnswer === opt
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {correctCount !== null && (
        <p className="text-xs text-gray-500 mt-2">{correctCount} of {submissions.length} got this correct</p>
      )}
    </div>
  );
}

function TieWinnerControl({ adminCode, submissions, currentWinner }) {
  const [saving, setSaving] = useState(false);

  async function handleSelect(name) {
    setSaving(true);
    try { await setTieWinner(adminCode, name === currentWinner ? null : name); } catch {}
    setSaving(false);
  }

  if (!submissions || submissions.length === 0) return <p className="text-gray-400 text-sm">No submissions yet.</p>;

  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-3">Select the tie-break winner (if needed):</p>
      <div className="flex flex-wrap gap-2">
        {submissions.map(s => (
          <button
            key={s.display_name}
            onClick={() => handleSelect(s.display_name)}
            disabled={saving}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              currentWinner === s.display_name
                ? 'bg-yellow-500 text-white border-yellow-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {s.display_name}
          </button>
        ))}
      </div>
    </div>
  );
}

function TieBreakerTable({ submissions }) {
  if (!submissions || submissions.length === 0) return <p className="text-gray-400 text-sm">No submissions yet.</p>;

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-2 font-medium text-gray-500">Name</th>
            <th className="text-left px-4 py-2 font-medium text-gray-500">Tie Breaker Answer</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {submissions.map(s => (
            <tr key={s.display_name}>
              <td className="px-4 py-2 font-medium">{s.display_name}</td>
              <td className="px-4 py-2">{s.q15}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
