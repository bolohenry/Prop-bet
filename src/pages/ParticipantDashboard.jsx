import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventByInvite, getSubmission } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import { SURVEY_QUESTIONS } from '../../shared/questions.js';
import PageTitle from '../components/PageTitle';
import Leaderboard from '../components/Leaderboard';
import AnswerMatrix from '../components/AnswerMatrix';
import ShareButton from '../components/ShareButton';
import { LoadingPage } from '../components/Skeleton';

export default function ParticipantDashboard() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [eventId, setEventId] = useState(null);
  const [eventMeta, setEventMeta] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

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

  const currentSub = submissions?.find(s => s.display_name === submission?.display_name) || submission;

  if (loading) return <LoadingPage />;
  if (!event || !submission) return null;

  const outcomeMap = {};
  if (outcomes) {
    for (const o of outcomes) outcomeMap[o.question_id] = o;
  }

  const resolvedCount = outcomes ? outcomes.filter(o => o.resolved).length : 0;

  return (
    <div className="min-h-screen bg-surface pb-12">
      <PageTitle title={`${event.name} — dashboard`} />
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-4 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-0.5 tracking-tight">{event.name}</h1>
          <p className="text-brand-400 text-sm font-medium">wedding prop bets</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-5 space-y-6">
        {/* Confirmation banner */}
        <div className="bg-brand-600 rounded-2xl p-5 shadow-lg shadow-brand-600/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-white font-semibold text-sm">Locked in as {currentSub?.display_name || submission.display_name}</p>
                <p className="text-brand-200 text-xs">{currentSub?.total_points ?? submission.total_points} pts · {resolvedCount} of 12 scored</p>
              </div>
            </div>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="text-xs text-brand-200 hover:text-white font-medium transition-colors duration-150"
            >
              {showAnswers ? 'Hide answers' : 'View my answers'}
            </button>
          </div>

          {showAnswers && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              {SURVEY_QUESTIONS.map(q => {
                const answer = submission[q.id];
                const outcome = outcomeMap[q.id];
                const isResolved = outcome?.resolved;
                const isCorrect = isResolved && outcome.answer === answer;

                return (
                  <div key={q.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-brand-200/70 truncate flex-1">Q{q.number}. {q.text}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-white font-medium">{answer}</span>
                      {submission.wager_3x === q.id && <span className="text-brand-300 text-xs font-bold">3×</span>}
                      {submission.wager_2x === q.id && <span className="text-accent-300 text-xs font-bold">2×</span>}
                      {q.scored && isResolved && (
                        <span className={`text-xs ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        {submissions && (
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3 tracking-tight">Leaderboard</h2>
            <Leaderboard
              submissions={submissions}
              outcomes={outcomes}
              winnerName={event?.tie_winner_name}
              currentUser={submission.display_name}
            />
          </section>
        )}

        {/* Answer matrix */}
        {submissions && (
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3 tracking-tight">Answer matrix</h2>
            <AnswerMatrix submissions={submissions} outcomes={outcomes} />
          </section>
        )}

        {event.status === 'finalized' && (
          <div className="text-center">
            <Link
              to={`/i/${inviteCode}/recap`}
              className="inline-block w-full bg-brand-600 hover:bg-accent-500 text-white py-4 rounded-2xl text-base font-bold transition-all duration-200 shadow-lg shadow-brand-600/20 hover:shadow-accent-500/30"
            >
              🎉 View Event Recap
            </Link>
          </div>
        )}

        <div className="text-center pt-4 pb-2">
          <p className="text-gray-400 text-xs mb-3">Know someone planning a wedding?</p>
          <ShareButton variant="light" />
        </div>
      </div>
    </div>
  );
}
