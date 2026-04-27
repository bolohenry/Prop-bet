import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventByInvite, getQuestions, deriveScoredQuestions, getSubmission } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import PageTitle from '../components/PageTitle';
import Leaderboard from '../components/Leaderboard';
import { LoadingPage } from '../components/Skeleton';

export default function ParticipantLiveReveal() {
  const { inviteCode } = useParams();
  const [eventMeta, setEventMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevIndex, setPrevIndex] = useState(-1);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const ev = await getEventByInvite(inviteCode);
        setEventMeta(ev);
        const qs = await getQuestions(ev.id);
        setQuestions(qs);

        const name = sessionStorage.getItem(`wpb_name_${ev.id}`);
        if (name) {
          const sub = await getSubmission(ev.id, name);
          setMySubmission(sub);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [inviteCode]);

  const { submissions, outcomes, event: liveEvent } = useRealtimeDashboard(eventMeta?.id);
  const event = liveEvent || eventMeta;

  const scoredQuestions = useMemo(() => deriveScoredQuestions(questions).map((q, i) => ({ ...q, number: i + 1 })), [questions]);
  const questionMap = useMemo(() => Object.fromEntries(scoredQuestions.map(q => [q.question_key, q])), [scoredQuestions]);
  const outcomeMap = useMemo(() => {
    const m = {};
    if (outcomes) for (const o of outcomes) m[o.question_id] = o;
    return m;
  }, [outcomes]);

  const revealOrder = event?.reveal_order || [];
  const currentIndex = event?.current_reveal_index ?? -1;
  const isActive = event?.reveal_mode;

  useEffect(() => {
    if (currentIndex > prevIndex) {
      setShowResult(false);
      const timer = setTimeout(() => setShowResult(true), 500);
      setPrevIndex(currentIndex);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, prevIndex]);

  if (loading) return <LoadingPage dark />;
  if (!event) return null;

  if (!isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">📺</div>
          <h1 className="text-2xl font-extrabold text-white mb-2">{event.name}</h1>
          <p className="text-brand-400 text-sm mb-6">Live reveal hasn't started yet. Sit tight!</p>
          <Link to={`/i/${inviteCode}/dashboard`} className="text-brand-300 text-sm hover:text-brand-200 underline underline-offset-4">
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentKey = revealOrder[currentIndex];
  const currentQ = questionMap[currentKey];
  const currentOutcome = outcomeMap[currentKey];
  const myAnswer = mySubmission?.answers?.[currentKey];
  const isCorrect = currentOutcome?.resolved && myAnswer === currentOutcome.answer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 pb-12">
      <PageTitle title={`${event.name} — live`} />
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{event.name}</h1>
          <p className="text-brand-400 text-sm mt-1">
            Question {currentIndex + 1} of {revealOrder.length}
          </p>
        </div>

        {currentQ && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
              <p className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-3">Q{currentQ.number}</p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-6">{currentQ.label}</h2>

              {myAnswer && (
                <div className="mb-4">
                  <p className="text-brand-400 text-xs mb-1">Your answer</p>
                  <p className="text-white font-bold text-lg">{myAnswer}</p>
                </div>
              )}

              {showResult && currentOutcome?.resolved && (
                <div className={`mt-4 rounded-xl p-4 ${isCorrect ? 'bg-success-500/20' : 'bg-danger-500/20'}`}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
                    {isCorrect ? 'You got it right!' : 'Not this time'}
                  </p>
                  <p className="text-white font-extrabold text-xl">{currentOutcome.answer}</p>
                </div>
              )}
            </div>

            <Leaderboard
              submissions={submissions}
              outcomes={outcomes}
              winnerName={event.tie_winner_name}
              currentUser={mySubmission?.display_name}
            />
          </div>
        )}

        {currentIndex === -1 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <p className="text-xl font-extrabold text-white">Get ready...</p>
            <p className="text-brand-400 text-sm mt-2">The host is about to start revealing answers!</p>
          </div>
        )}
      </div>
    </div>
  );
}
