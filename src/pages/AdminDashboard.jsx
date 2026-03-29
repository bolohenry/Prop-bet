import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventByAdmin, updateEventStatus, scoreQuestion, setTieWinner, downloadCsv } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import { SCORED_QUESTIONS } from '../../shared/questions.js';
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

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50"><p className="text-gray-400">Loading...</p></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-gray-50"><p className="text-danger-500">{error}</p></div>;
  if (!event) return null;

  const formattedDate = new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-300 text-xs font-semibold uppercase tracking-wider mb-1">Admin Dashboard</p>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">{event.name}</h1>
          <p className="text-brand-200 text-sm">{formattedDate}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-6">
        {/* Status Control */}
        <StatusControl adminCode={adminCode} currentStatus={event.status} />

        {/* Submissions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-brand-100 text-brand-600 text-sm">👥</span>
              Submissions
              <span className="text-sm font-normal text-gray-400">({submissions?.length || 0})</span>
            </h2>
            <button
              onClick={() => downloadCsv(event, submissions || [])}
              className="text-sm bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl font-semibold transition-colors text-gray-700 shadow-sm"
            >
              📥 Export CSV
            </button>
          </div>
          <SubmissionsTable submissions={submissions} />
        </section>

        {/* Scoring */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-success-100 text-success-600 text-sm">⚡</span>
            Live Scoring
          </h2>
          <ScoringPanel adminCode={adminCode} outcomes={outcomes} submissions={submissions} />
        </section>

        {/* Leaderboard */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-warn-100 text-warn-600 text-sm">🏆</span>
            Leaderboard
          </h2>
          <Leaderboard submissions={submissions} winnerName={event.tie_winner_name} />
        </section>

        {/* Tie Winner */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent-400/20 text-accent-500 text-sm">👑</span>
            Tie Winner
          </h2>
          <TieWinnerControl adminCode={adminCode} submissions={submissions} currentWinner={event.tie_winner_name} />
        </section>

        {/* Answer Matrix */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-brand-100 text-brand-600 text-sm">📊</span>
            Answer Matrix
          </h2>
          <AnswerMatrix submissions={submissions} outcomes={outcomes} />
        </section>

        {/* Tie Breaker Answers */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-600 text-sm">⏰</span>
            Tie Breaker Answers
          </h2>
          <TieBreakerTable submissions={submissions} />
        </section>
      </div>
    </div>
  );
}

function StatusControl({ adminCode, currentStatus }) {
  const [updating, setUpdating] = useState(false);
  const statuses = [
    { value: 'open', label: 'Open', desc: 'Participants can submit.', color: 'success' },
    { value: 'locked', label: 'Locked', desc: 'Submissions closed.', color: 'warn' },
    { value: 'scoring', label: 'Scoring', desc: 'Live scoring in progress.', color: 'brand' },
    { value: 'finalized', label: 'Finalized', desc: 'Event complete.', color: 'gray' },
  ];

  async function handleChange(status) {
    setUpdating(true);
    try { await updateEventStatus(adminCode, status); } catch {}
    setUpdating(false);
  }

  const current = statuses.find(s => s.value === currentStatus) || statuses[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <label className="block text-sm font-bold text-gray-700 mb-3">Event Status</label>
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => {
          const isActive = currentStatus === s.value;
          const baseClass = 'px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all';
          const activeClass = s.color === 'success' ? 'bg-success-500 text-white border-success-500 shadow-md shadow-success-500/25'
            : s.color === 'warn' ? 'bg-warn-500 text-white border-warn-500 shadow-md shadow-warn-500/25'
            : s.color === 'brand' ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/25'
            : 'bg-gray-700 text-white border-gray-700 shadow-md';
          const inactiveClass = 'bg-white text-gray-500 border-gray-200 hover:border-gray-300';

          return (
            <button
              key={s.value}
              onClick={() => handleChange(s.value)}
              disabled={updating}
              className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-2">{current.desc}</p>
    </div>
  );
}

function SubmissionsTable({ submissions }) {
  if (!submissions || submissions.length === 0) return <p className="text-gray-400 text-sm">No submissions yet.</p>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Name</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Submitted</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-500">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {submissions.map(s => (
            <tr key={s.display_name} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 font-semibold text-gray-800">{s.display_name}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">{new Date(s.submitted_at).toLocaleString()}</td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-brand-100 text-brand-700 font-bold rounded-lg text-sm">
                  {s.total_points}
                </span>
              </td>
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
    <div className={`bg-white rounded-2xl border-2 p-4 transition-all ${isResolved ? 'border-success-500/40 bg-success-50/30' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-gray-800">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold mr-2">
            {question.number}
          </span>
          {question.text}
        </p>
        {isResolved && (
          <span className="text-xs bg-success-500 text-white px-2.5 py-1 rounded-full font-bold whitespace-nowrap shadow-sm">
            ✓ Resolved
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleScore(opt)}
            disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              isResolved && currentAnswer === opt
                ? 'bg-success-500 text-white border-success-500 shadow-md shadow-success-500/25'
                : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300 hover:bg-brand-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {correctCount !== null && (
        <p className="text-xs text-gray-400 mt-2.5 font-medium">
          {correctCount} of {submissions.length} got this correct ({Math.round(correctCount / submissions.length * 100)}%)
        </p>
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <p className="text-sm text-gray-500 mb-3">Select the tie-break winner (if needed):</p>
      <div className="flex flex-wrap gap-2">
        {submissions.map(s => (
          <button
            key={s.display_name}
            onClick={() => handleSelect(s.display_name)}
            disabled={saving}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              currentWinner === s.display_name
                ? 'bg-warn-500 text-white border-warn-500 shadow-md shadow-warn-500/25'
                : 'bg-white text-gray-500 border-gray-200 hover:border-warn-500/50'
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Name</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Tie Breaker Answer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {submissions.map(s => (
            <tr key={s.display_name} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 font-semibold text-gray-800">{s.display_name}</td>
              <td className="px-4 py-3 text-gray-600">{s.q15}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
