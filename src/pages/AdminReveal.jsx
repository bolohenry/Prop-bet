import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getEventByAdmin, getQuestions, setRevealMode, revealNext, deriveScoredQuestions } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import PageTitle from '../components/PageTitle';
import Leaderboard from '../components/Leaderboard';
import WinnerScreen from '../components/WinnerScreen';
import { LoadingPage } from '../components/Skeleton';

const REVEAL_DWELL_MS = 4500;

export default function AdminReveal() {
  const { adminCode } = useParams();
  const [eventMeta, setEventMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
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
    setPaused(false);
    setLastRevealed(null);
    setCountdown(0);
    try {
      await setRevealMode(adminCode, true, order);
      toast.success('Reveal mode started!');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleStop() {
    try {
      await setRevealMode(adminCode, false);
      toast.success('Reveal mode ended');
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Auto-advance loop: drives the 3-2-1 countdown -> revealNext -> dwell cycle on its own
  // once reveal mode is active. Deliberately does NOT depend on `currentIndex` — that value
  // only changes via the realtime echo of our own revealNext() calls, and re-running this
  // effect on every tick would restart the countdown mid-cycle. `currentIndex` is only read
  // once, as the loop's starting point (so a page refresh mid-reveal resumes correctly).
  useEffect(() => {
    if (!isActive || paused) return;
    if (revealOrder.length === 0) return;
    if (currentIndex >= revealOrder.length - 1) return;

    let cancelled = false;
    const timers = [];
    const wait = ms => new Promise(resolve => {
      timers.push(setTimeout(resolve, ms));
    });

    async function loop() {
      let idx = currentIndex;
      while (idx < revealOrder.length - 1) {
        if (cancelled) return;
        for (let i = 3; i > 0; i--) {
          if (cancelled) return;
          setCountdown(i);
          await wait(1000);
        }
        if (cancelled) return;
        setCountdown(0);

        let result;
        try {
          result = await revealNext(adminCode);
        } catch (err) {
          toast.error(err.message);
          setPaused(true);
          return;
        }

        setLastRevealed(result);
        toast.success(`Revealed: ${questionMap[result.questionKey]?.label}`);
        idx = result.index;

        if (cancelled || idx >= revealOrder.length - 1) return;
        await wait(REVEAL_DWELL_MS);
      }
    }

    loop();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      setCountdown(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, paused, revealOrder.length, adminCode]);

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
                {paused && !allRevealed && <span className="ml-2 text-warn-500 font-bold uppercase tracking-wide text-xs">Paused</span>}
              </p>
              <div className="flex items-center gap-4">
                {!allRevealed && (
                  <button
                    onClick={() => setPaused(p => !p)}
                    className="text-xs text-brand-200 hover:text-white font-semibold border border-white/20 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                )}
                <button onClick={handleStop} className="text-xs text-danger-400 hover:text-danger-300 font-semibold">
                  End Reveal
                </button>
              </div>
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

            {allRevealed && countdown === 0 && (
              <div className="text-center py-8">
                <button onClick={handleStop} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-brand-200 rounded-xl font-semibold transition-colors">
                  End Reveal Mode
                </button>
              </div>
            )}

            {!allRevealed && (
              <div className="pt-4">
                <Leaderboard submissions={submissions} outcomes={outcomes} winnerName={event.tie_winner_name} />
              </div>
            )}
          </div>
        )}

        {isActive && allRevealed && countdown === 0 && (
          <div className="mt-8">
            <WinnerScreen submissions={submissions} tieWinnerName={event.tie_winner_name} compact />
          </div>
        )}
      </div>
    </div>
  );
}
