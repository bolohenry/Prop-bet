import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getEventByAdmin, getQuestions, setRevealMode, revealNext, deriveScoredQuestions } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import PageTitle from '../components/PageTitle';
import Leaderboard from '../components/Leaderboard';
import { LoadingPage } from '../components/Skeleton';

export default function AdminReveal() {
  const { adminCode } = useParams();
  const [eventMeta, setEventMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [lastRevealed, setLastRevealed] = useState(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const ev = await getEventByAdmin(adminCode);
        setEventMeta(ev);
        const qs = await getQuestions(ev.id);
        setQuestions(qs);
      } catch {}
      setLoading(false);
    }
    load();
  }, [adminCode]);

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
  const allRevealed = currentIndex >= revealOrder.length - 1;

  async function handleStart() {
    const order = scoredQuestions.map(q => q.question_key);
    try {
      await setRevealMode(adminCode, true, order);
      toast.success('Reveal mode started!');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleRevealNext() {
    setRevealing(true);
    setCountdown(3);

    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(0);

    try {
      const result = await revealNext(adminCode);
      setLastRevealed(result);
      toast.success(`Revealed: ${questionMap[result.questionKey]?.label}`);
    } catch (err) {
      toast.error(err.message);
    }
    setRevealing(false);
  }

  async function handleStop() {
    try {
      await setRevealMode(adminCode, false);
      toast.success('Reveal mode ended');
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <LoadingPage />;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 pb-12">
      <PageTitle title={`${event.name} — live reveal`} />
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link to={`/admin/${adminCode}`} className="text-brand-400 text-xs font-semibold hover:text-brand-300 transition-colors">
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-white mt-3 tracking-tight">Live Reveal</h1>
        <p className="text-brand-400 text-sm mt-1">{event.name}</p>

        {!isActive ? (
          <div className="mt-10 text-center">
            <p className="text-brand-300 text-sm mb-6">Start the live reveal to go through each question one by one with your guests.</p>
            <button
              onClick={handleStart}
              disabled={scoredQuestions.length === 0}
              className="px-10 py-5 bg-accent-500 hover:bg-accent-400 text-white text-xl font-extrabold rounded-2xl transition-all duration-200 shadow-xl shadow-accent-500/30 disabled:opacity-50"
            >
              Start Live Reveal
            </button>
            {scoredQuestions.length === 0 && <p className="text-warn-500 text-xs mt-3">No scored questions to reveal. Score questions first.</p>}
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-brand-300 text-sm">
                {currentIndex + 1} of {revealOrder.length} revealed
              </p>
              <button onClick={handleStop} className="text-xs text-danger-400 hover:text-danger-300 font-semibold">
                End Reveal
              </button>
            </div>

            {countdown > 0 && (
              <div className="text-center py-16">
                <div className="text-8xl font-extrabold text-white animate-pulse">{countdown}</div>
              </div>
            )}

            {countdown === 0 && lastRevealed && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
                <p className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">Just Revealed</p>
                <p className="text-xl font-extrabold text-white mb-3">{questionMap[lastRevealed.questionKey]?.label}</p>
                <div className="inline-block bg-success-500 text-white px-6 py-3 rounded-xl text-lg font-extrabold">
                  {lastRevealed.answer}
                </div>
              </div>
            )}

            {countdown === 0 && !allRevealed && (
              <div className="text-center">
                <button
                  onClick={handleRevealNext}
                  disabled={revealing}
                  className="px-10 py-5 bg-brand-600 hover:bg-accent-500 text-white text-lg font-extrabold rounded-2xl transition-all duration-200 shadow-xl shadow-brand-600/30 disabled:opacity-50"
                >
                  {revealing ? 'Revealing...' : `Reveal Question ${currentIndex + 2}`}
                </button>
              </div>
            )}

            {allRevealed && countdown === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-xl font-extrabold text-white mb-2">All questions revealed!</p>
                <button onClick={handleStop} className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 text-brand-200 rounded-xl font-semibold transition-colors">
                  End Reveal Mode
                </button>
              </div>
            )}

            <div className="pt-4">
              <Leaderboard submissions={submissions} outcomes={outcomes} winnerName={event.tie_winner_name} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
