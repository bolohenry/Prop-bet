import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventByAdmin, updateEventStatus, scoreQuestion, setTieBreakerAnswer, setTieWinnerOverride, downloadCsv } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import { SCORED_QUESTIONS } from '../../shared/questions.js';
import { timeToMinutes } from '../../shared/tiebreaker.js';
import Leaderboard from '../components/Leaderboard';
import AnswerMatrix from '../components/AnswerMatrix';

const TIME_OPTIONS = (() => {
  const times = [];
  for (let hour24 = 21; hour24 <= 28; hour24++) {
    const h = hour24 % 24;
    for (let m = 0; m < 60; m += 15) {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const suffix = h >= 12 && h < 24 ? 'PM' : 'AM';
      times.push(`${hour12}:${String(m).padStart(2, '0')} ${suffix}`);
      if (h === 4 && m === 0) return times;
    }
  }
  return times;
})();

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

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-surface"><p className="text-gray-400">Loading...</p></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-surface"><p className="text-danger-500">{error}</p></div>;
  if (!event) return null;

  const formattedDate = new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-surface pb-12">
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 px-4 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-2">Admin dashboard</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 tracking-tight">{event.name}</h1>
          <p className="text-brand-300 text-sm">{formattedDate}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-5 space-y-8">
        <StatusControl adminCode={adminCode} currentStatus={event.status} />

        <Section title="Submissions" count={submissions?.length || 0}
          action={<button onClick={() => downloadCsv(event, submissions || [])} className="text-sm bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl font-semibold transition-colors duration-150 text-gray-600 shadow-sm">Export CSV</button>}>
          <SubmissionsTable submissions={submissions} />
        </Section>

        <Section title="Live scoring">
          <ScoringPanel adminCode={adminCode} outcomes={outcomes} submissions={submissions} />
        </Section>

        <Section title="Leaderboard">
          <Leaderboard submissions={submissions} winnerName={event.tie_winner_name} />
        </Section>

        <Section title="Tie breaker">
          <TieBreakerControl adminCode={adminCode} event={event} submissions={submissions} />
        </Section>

        <Section title="Answer matrix">
          <AnswerMatrix submissions={submissions} outcomes={outcomes} />
        </Section>

        <Section title="Tie breaker answers">
          <TieBreakerTable submissions={submissions} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, count, action, children }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800 tracking-tight">
          {title}
          {count !== undefined && <span className="text-sm font-normal text-gray-400 ml-2">({count})</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
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
    <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-6">
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Event status</label>
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => {
          const isActive = currentStatus === s.value;
          const base = 'px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200';
          const active = s.color === 'success' ? 'bg-success-500 text-white border-success-500 shadow-md shadow-success-500/20'
            : s.color === 'warn' ? 'bg-warn-500 text-white border-warn-500 shadow-md shadow-warn-500/20'
            : s.color === 'brand' ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
            : 'bg-gray-700 text-white border-gray-700 shadow-md shadow-gray-700/20';
          const inactive = 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-500';

          return (
            <button key={s.value} onClick={() => handleChange(s.value)} disabled={updating}
              className={`${base} ${isActive ? active : inactive}`}>
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3">{current.desc}</p>
    </div>
  );
}

function SubmissionsTable({ submissions }) {
  if (!submissions || submissions.length === 0) return <p className="text-gray-400 text-sm">No submissions yet.</p>;

  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Name</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Submitted</th>
            <th className="text-right px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {submissions.map(s => (
            <tr key={s.display_name} className="hover:bg-gray-50/50 transition-colors duration-150">
              <td className="px-5 py-3.5 font-semibold text-gray-800">{s.display_name}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(s.submitted_at).toLocaleString()}</td>
              <td className="px-5 py-3.5 text-right">
                <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 bg-brand-100 text-brand-700 font-bold rounded-lg text-xs">
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
    <div className={`bg-white rounded-2xl border-2 p-5 transition-all duration-200 ${isResolved ? 'border-success-500/30 bg-success-50/20' : 'border-transparent shadow-sm shadow-gray-900/[0.04]'}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="text-sm font-semibold text-gray-800">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold mr-2">
            {question.number}
          </span>
          {question.text}
        </p>
        {isResolved && (
          <span className="text-xs bg-success-500 text-white px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
            ✓ resolved
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleScore(opt)}
            disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
              isResolved && currentAnswer === opt
                ? 'bg-success-500 text-white border-success-500 shadow-md shadow-success-500/20'
                : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300 active:scale-[0.98]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {correctCount !== null && (
        <p className="text-xs text-gray-400 mt-3">
          {correctCount} of {submissions.length} got this correct ({Math.round(correctCount / submissions.length * 100)}%)
        </p>
      )}
    </div>
  );
}

function TieBreakerControl({ adminCode, event, submissions }) {
  const [saving, setSaving] = useState(false);
  const [overriding, setOverriding] = useState(false);

  const correctTime = event?.tie_breaker_answer;
  const autoWinner = event?.tie_winner_name;

  async function handleTimeChange(time) {
    setSaving(true);
    try { await setTieBreakerAnswer(adminCode, time || null); } catch {}
    setSaving(false);
  }

  async function handleOverride(name) {
    setOverriding(true);
    try { await setTieWinnerOverride(adminCode, name === autoWinner ? null : name); } catch {}
    setOverriding(false);
  }

  if (!submissions || submissions.length === 0) return <p className="text-gray-400 text-sm">No submissions yet.</p>;

  const correctMin = correctTime ? timeToMinutes(correctTime) : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">What time did the bride actually leave?</label>
        <select
          value={correctTime || ''}
          onChange={e => handleTimeChange(e.target.value)}
          disabled={saving}
          className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200 appearance-none bg-white ${!correctTime ? 'text-gray-400' : 'text-gray-800'}`}
        >
          <option value="">Select the actual time...</option>
          {TIME_OPTIONS.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {correctTime && autoWinner && (
          <div className="mt-4 bg-accent-50 border border-accent-200 rounded-xl p-4">
            <p className="text-sm font-bold text-accent-500 mb-1">
              Auto-selected winner: {autoWinner}
            </p>
            <p className="text-xs text-gray-500">
              Closest guess at or after {correctTime} (Price Is Right rules).
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Guess</th>
              {correctMin !== null && <th className="text-right px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Diff</th>}
              <th className="text-center px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {submissions.map(s => {
              const guessMin = timeToMinutes(s.q15);
              const diff = correctMin !== null && guessMin !== null ? guessMin - correctMin : null;
              const isWinner = autoWinner === s.display_name;
              const isEarly = diff !== null && diff < 0;

              return (
                <tr key={s.display_name} className={`transition-colors duration-150 ${isWinner ? 'bg-accent-50/60' : 'hover:bg-gray-50/50'}`}>
                  <td className="px-5 py-3.5 font-semibold text-gray-800">
                    {s.display_name}
                    {isWinner && <span className="text-accent-500 text-xs ml-1.5 font-bold">★ winner</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{s.q15}</td>
                  {correctMin !== null && (
                    <td className={`px-5 py-3.5 text-right text-xs font-mono ${isEarly ? 'text-danger-500' : 'text-success-600'}`}>
                      {diff !== null ? (
                        <>
                          {diff === 0 ? 'Exact' : diff > 0 ? `+${diff} min` : `${diff} min`}
                          {isEarly && <span className="ml-1 text-danger-400">(over)</span>}
                        </>
                      ) : '—'}
                    </td>
                  )}
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleOverride(s.display_name)}
                      disabled={overriding}
                      title="Manual override"
                      className={`text-xs px-2 py-1 rounded-lg border transition-all duration-200 ${
                        isWinner
                          ? 'bg-accent-500 text-white border-accent-500'
                          : 'text-gray-300 border-gray-200 hover:border-accent-300 hover:text-accent-500'
                      }`}
                    >
                      👑
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {correctTime && (
        <p className="text-xs text-gray-400">
          Price Is Right rules: closest guess at or after the actual time wins. If everyone guessed too early, the closest overall wins. Use the 👑 button to manually override if needed.
        </p>
      )}
    </div>
  );
}

function TieBreakerTable({ submissions }) {
  if (!submissions || submissions.length === 0) return <p className="text-gray-400 text-sm">No submissions yet.</p>;

  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Name</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Tie breaker answer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {submissions.map(s => (
            <tr key={s.display_name} className="hover:bg-gray-50/50 transition-colors duration-150">
              <td className="px-5 py-3.5 font-semibold text-gray-800">{s.display_name}</td>
              <td className="px-5 py-3.5 text-gray-600">{s.q15}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
