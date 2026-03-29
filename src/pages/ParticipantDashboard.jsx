import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventByInvite, getSubmission } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import { QUESTIONS } from '../../shared/questions.js';
import Leaderboard from '../components/Leaderboard';
import AnswerMatrix from '../components/AnswerMatrix';
import ShareButton from '../components/ShareButton';

export default function ParticipantDashboard() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [eventId, setEventId] = useState(null);
  const [eventMeta, setEventMeta] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ev = await getEventByInvite(inviteCode);
        setEventMeta(ev);
        setEventId(ev.id);

        const name = sessionStorage.getItem(`wpb_name_${ev.id}`);
        if (!name) { navigate(`/i/${inviteCode}`); return; }

        const sub = await getSubmission(ev.id, name);
        if (!sub) { navigate(`/i/${inviteCode}`); return; }

        setSubmission(sub);
      } catch {
        navigate(`/i/${inviteCode}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [inviteCode, navigate]);

  const { submissions, outcomes, event: liveEvent } = useRealtimeDashboard(eventId);
  const event = liveEvent || eventMeta;

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-surface"><p className="text-gray-400">Loading...</p></div>;
  if (!event || !submission) return null;

  const outcomeMap = {};
  if (outcomes) {
    for (const o of outcomes) outcomeMap[o.question_id] = o;
  }

  const formattedDate = new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-surface pb-12">
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-4 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 tracking-tight">{event.name}</h1>
          <p className="text-brand-300 text-sm">{formattedDate}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-5 space-y-6">
        <div className="bg-brand-600 rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-brand-600/20">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-white font-semibold">Your answers have been submitted.</p>
            <p className="text-brand-200 text-sm">You're locked in, {submission.display_name}.</p>
          </div>
        </div>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-3 tracking-tight">Your submission</h2>
          <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] divide-y divide-gray-100 overflow-hidden">
            {QUESTIONS.map(q => {
              const answer = submission[q.id];
              const outcome = outcomeMap[q.id];
              const isResolved = outcome?.resolved;
              const isCorrect = isResolved && outcome.answer === answer;

              return (
                <div key={q.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Q{q.number}</p>
                    <p className="text-sm text-gray-600">{q.text}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-gray-800">{answer}</span>
                    {q.scored && isResolved && (
                      <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold ${isCorrect ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-600'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {submissions && (
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3 tracking-tight">Leaderboard</h2>
            <Leaderboard
              submissions={submissions}
              winnerName={event?.tie_winner_name}
              currentUser={submission.display_name}
            />
          </section>
        )}

        {submissions && (
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3 tracking-tight">Answer matrix</h2>
            <AnswerMatrix submissions={submissions} outcomes={outcomes} />
          </section>
        )}

        <div className="text-center pt-4 pb-2">
          <p className="text-gray-400 text-xs mb-3">Know someone planning a wedding?</p>
          <ShareButton variant="light" />
        </div>
      </div>
    </div>
  );
}
