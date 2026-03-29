import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventByInvite, getSubmission } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import { QUESTIONS } from '../../shared/questions.js';
import Leaderboard from '../components/Leaderboard';
import AnswerMatrix from '../components/AnswerMatrix';

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

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">Loading...</p></div>;
  if (!event || !submission) return null;

  const outcomeMap = {};
  if (outcomes) {
    for (const o of outcomes) outcomeMap[o.question_id] = o;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pb-12">
      <h1 className="text-2xl font-bold mb-1">{event.name}</h1>
      <p className="text-gray-500 text-sm mb-6">
        {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <section className="mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 font-medium">Your answers have been submitted!</p>
        </div>

        <h2 className="text-lg font-semibold mb-3">Your Submission</h2>
        <div className="bg-white border rounded-lg divide-y">
          {QUESTIONS.map(q => {
            const answer = submission[q.id];
            const outcome = outcomeMap[q.id];
            const isResolved = outcome?.resolved;
            const isCorrect = isResolved && outcome.answer === answer;

            return (
              <div key={q.id} className="px-4 py-3 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">Q{q.number}. {q.text}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium">{answer}</span>
                  {q.scored && isResolved && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
        <>
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
            <Leaderboard
              submissions={submissions}
              winnerName={event?.tie_winner_name}
              currentUser={submission.display_name}
            />
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Answer Matrix</h2>
            <AnswerMatrix submissions={submissions} outcomes={outcomes} />
          </section>
        </>
      )}
    </div>
  );
}
