import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getEventByAdmin, updateEventStatus, scoreQuestion, setTieBreakerAnswer, setTieWinnerOverride, downloadCsv } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import { SCORED_QUESTIONS, TOTAL_SCORED } from '../../shared/questions.js';
import { timeToMinutes } from '../../shared/tiebreaker.js';
import PageTitle from '../components/PageTitle';
import Leaderboard from '../components/Leaderboard';
import AnswerMatrix from '../components/AnswerMatrix';
import ConfirmDialog from '../components/ConfirmDialog';
import StickyTabNav from '../components/StickyTabNav';
import { LoadingPage } from '../components/Skeleton';

function parseTimeString(str) {
  if (!str) return { hour: '', minute: '', period: 'PM' };
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: '', minute: '', period: 'PM' };
  return { hour: match[1], minute: match[2], period: match[3].toUpperCase() };
}

function formatTimeString(hour, minute, period) {
  if (!hour || minute === '') return '';
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
}

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

  if (loading) return <LoadingPage />;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-surface"><p className="text-danger-500">{error}</p></div>;
  if (!event) return null;

  const resolvedCount = outcomes ? outcomes.filter(o => o.resolved).length : 0;

  return (
    <div className="min-h-screen bg-surface pb-12">
      <PageTitle title={`${event.name} — admin`} />
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-2">Admin dashboard</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 tracking-tight">{event.name}</h1>
        </div>
      </div>

      <StickyTabNav />

      <div className="max-w-4xl mx-auto px-4 -mt-5 space-y-8">
        <div id="section-overview">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-4 text-center">
              <p className="text-2xl font-extrabold text-gray-800">{submissions?.length || 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">submissions</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-4 text-center">
              <p className="text-2xl font-extrabold text-gray-800">{resolvedCount}<span className="text-base font-normal text-gray-300">/{TOTAL_SCORED}</span></p>
              <p className="text-xs text-gray-400 mt-0.5">scored</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-4 text-center">
              <p className="text-2xl font-extrabold text-gray-800 capitalize">{event.status}</p>
              <p className="text-xs text-gray-400 mt-0.5">status</p>
            </div>
          </div>
          <StatusControl adminCode={adminCode} currentStatus={event.status} />
        </div>

        <div id="section-submissions">
          <Section title="Submissions" count={submissions?.length || 0}
            action={<button onClick={() => downloadCsv(event, submissions || [])} className="text-sm bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl font-semibold transition-colors duration-150 text-gray-600 shadow-sm">Export CSV</button>}>
            <SubmissionsTable submissions={submissions} />
          </Section>
        </div>

        <div id="section-scoring">
          <Section title="Live scoring">
            <ScoringPanel adminCode={adminCode} outcomes={outcomes} submissions={submissions} />
          </Section>
        </div>

        <div id="section-leaderboard">
          <Section title="Leaderboard">
            <Leaderboard submissions={submissions} outcomes={outcomes} winnerName={event.tie_winner_name} />
          </Section>
        </div>

        <div id="section-tiebreaker">
          <Section title="Tie breaker">
            <TieBreakerControl adminCode={adminCode} event={event} submissions={submissions} />
          </Section>
        </div>

        <div id="section-matrix">
          <Section title="Answer matrix">
            <AnswerMatrix submissions={submissions} outcomes={outcomes} />
          </Section>
        </div>

        {event.status === 'finalized' && (
          <div className="text-center pb-4">
            <a
              href={`/i/${event.invite_code}/recap`}
              className="inline-block bg-brand-600 hover:bg-accent-500 text-white px-8 py-4 rounded-2xl text-base font-bold transition-all duration-200 shadow-lg shadow-brand-600/20"
            >
              🎉 View Recap
            </a>
          </div>
        )}
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
  const [confirmTarget, setConfirmTarget] = useState(null);
  const statuses = [
    { value: 'open', label: 'Open', desc: 'Participants can submit.', color: 'success' },
    { value: 'locked', label: 'Locked', desc: 'Submissions closed.', color: 'warn' },
    { value: 'scoring', label: 'Scoring', desc: 'Live scoring in progress.', color: 'brand' },
    { value: 'finalized', label: 'Finalized', desc: 'Event complete.', color: 'gray' },
  ];

  const needsConfirmation = { locked: true, finalized: true };
  const confirmMessages = {
    locked: { title: "Change status to 'Locked'?", desc: 'No new submissions will be accepted while the event is locked.', label: 'Lock submissions', destructive: false },
    finalized: { title: "Change status to 'Finalized'?", desc: 'This marks the event as complete. Scores will no longer update.', label: 'Finalize event', destructive: true },
  };

  function handleClick(status) {
    if (needsConfirmation[status]) {
      setConfirmTarget(status);
    } else {
      doChange(status);
    }
  }

  async function doChange(status) {
    setConfirmTarget(null);
    setUpdating(true);
    try { await updateEventStatus(adminCode, status); } catch {}
    setUpdating(false);
  }

  const current = statuses.find(s => s.value === currentStatus) || statuses[0];
  const cm = confirmTarget ? confirmMessages[confirmTarget] : null;

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
            <button key={s.value} onClick={() => handleClick(s.value)} disabled={updating}
              className={`${base} ${isActive ? active : inactive}`}>
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3">{current.desc}</p>

      <ConfirmDialog
        open={!!confirmTarget}
        title={cm?.title}
        description={cm?.desc}
        confirmLabel={cm?.label}
        destructive={cm?.destructive}
        onConfirm={() => doChange(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

function SubmissionsTable({ submissions }) {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-8 text-center">
        <div className="text-3xl mb-3 opacity-40">📭</div>
        <p className="text-gray-400 text-sm">No submissions yet.</p>
      </div>
    );
  }

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
              <td className="px-5 py-3.5 font-semibold text-gray-800">{s.avatar && <span className="mr-1">{s.avatar}</span>}{s.display_name}</td>
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
  const [undoMsg, setUndoMsg] = useState(null);
  const outcomeMap = {};
  if (outcomes) {
    for (const o of outcomes) outcomeMap[o.question_id] = o;
  }

  const showUndo = useCallback((msg) => {
    setUndoMsg(msg);
    setTimeout(() => setUndoMsg(null), 3000);
  }, []);

  return (
    <div className="space-y-3 relative">
      {undoMsg && (
        <div className="sticky top-2 z-30 bg-gray-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-pulse text-center">
          {undoMsg}
        </div>
      )}
      {SCORED_QUESTIONS.map(q => (
        <ScoringCard key={q.id} question={q} outcome={outcomeMap[q.id]} adminCode={adminCode} submissions={submissions} onUndo={showUndo} />
      ))}
    </div>
  );
}

function ScoringCard({ question, outcome, adminCode, submissions, onUndo }) {
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
        onUndo(`Q${question.number} unscored — tap again to re-score`);
      } else {
        await scoreQuestion(adminCode, question.id, answer, true);
        toast.success(`Q${question.number} scored: ${answer}`);
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
                : 'bg-white text-gray-500 border-gray-200 hover:border-accent-300 hover:text-accent-500 active:scale-[0.98]'
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

  const parsed = parseTimeString(correctTime);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);

  useEffect(() => {
    const p = parseTimeString(correctTime);
    setHour(p.hour);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [correctTime]);

  async function handleSaveTime() {
    const formatted = formatTimeString(hour, minute, period);
    if (!formatted) return;
    setSaving(true);
    try { await setTieBreakerAnswer(adminCode, formatted); } catch {}
    setSaving(false);
  }

  async function handleClearTime() {
    setSaving(true);
    try { await setTieBreakerAnswer(adminCode, null); } catch {}
    setHour(''); setMinute(''); setPeriod('PM');
    setSaving(false);
  }

  async function handleOverride(name) {
    setOverriding(true);
    try { await setTieWinnerOverride(adminCode, name === autoWinner ? null : name); } catch {}
    setOverriding(false);
  }

  const hasSubs = submissions && submissions.length > 0;
  const correctMin = correctTime ? timeToMinutes(correctTime) : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">What time did the bride actually leave?</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1" max="12"
            value={hour}
            onChange={e => setHour(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="12"
            className="w-16 border border-gray-200 rounded-xl px-3 py-3 text-center text-base font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200"
          />
          <span className="text-gray-400 text-lg font-bold">:</span>
          <input
            type="number"
            min="0" max="59"
            value={minute}
            onChange={e => setMinute(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="00"
            className="w-16 border border-gray-200 rounded-xl px-3 py-3 text-center text-base font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200"
          />
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {['AM', 'PM'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-4 py-3 text-sm font-bold transition-all duration-150 ${
                  period === p
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-gray-400 hover:text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={handleSaveTime}
            disabled={saving || !hour || minute === ''}
            className="px-5 py-3 bg-brand-600 hover:bg-accent-500 text-white rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 shadow-sm"
          >
            {saving ? '...' : correctTime ? 'Update' : 'Set'}
          </button>
          {correctTime && (
            <button
              onClick={handleClearTime}
              disabled={saving}
              className="px-3 py-3 text-gray-400 hover:text-danger-500 rounded-xl text-sm transition-colors duration-150"
            >
              ✕
            </button>
          )}
        </div>

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

      {hasSubs ? <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] overflow-hidden">
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
      </div> : <p className="text-gray-400 text-sm text-center py-4">Guesses will appear here once guests submit.</p>}

      {correctTime && (
        <p className="text-xs text-gray-400">
          Price Is Right rules: closest guess at or after the actual time wins. If everyone guessed too early, the closest overall wins. Use the 👑 button to manually override if needed.
        </p>
      )}
    </div>
  );
}
