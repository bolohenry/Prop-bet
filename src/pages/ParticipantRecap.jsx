import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventByInvite, getSubmissions, getOutcomes } from '../lib/api';
import { SCORED_QUESTIONS } from '../../shared/questions.js';
import PageTitle from '../components/PageTitle';
import { LoadingPage } from '../components/Skeleton';

export default function ParticipantRecap() {
  const { inviteCode } = useParams();
  const [event, setEvent] = useState(null);
  const [submissions, setSubmissions] = useState(null);
  const [outcomes, setOutcomes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ev = await getEventByInvite(inviteCode);
        const [subs, outs] = await Promise.all([
          getSubmissions(ev.id),
          getOutcomes(ev.id),
        ]);
        setEvent(ev);
        setSubmissions(subs);
        setOutcomes(outs);
      } catch {}
      setLoading(false);
    }
    load();
  }, [inviteCode]);

  if (loading) return <LoadingPage />;
  if (!event || !submissions) return null;

  const outcomeMap = {};
  if (outcomes) {
    for (const o of outcomes) outcomeMap[o.question_id] = o;
  }

  const sorted = [...submissions].sort(
    (a, b) => b.total_points - a.total_points || new Date(a.submitted_at) - new Date(b.submitted_at)
  );

  const winner = sorted[0];
  const winnerName = event.tie_winner_name || winner?.display_name;
  const winnerSub = submissions.find(s => s.display_name === winnerName) || winner;

  const resolvedQuestions = SCORED_QUESTIONS.filter(q => outcomeMap[q.id]?.resolved);

  const biggestUpset = findBiggestUpset(resolvedQuestions, outcomeMap, submissions);

  const questionBreakdowns = resolvedQuestions.map(q => {
    const outcome = outcomeMap[q.id];
    const correctCount = submissions.filter(s => s[q.id] === outcome.answer).length;
    const pct = submissions.length > 0 ? Math.round((correctCount / submissions.length) * 100) : 0;

    const answerCounts = {};
    for (const s of submissions) {
      const a = s[q.id] || '(no answer)';
      answerCounts[a] = (answerCounts[a] || 0) + 1;
    }
    const popular = Object.entries(answerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return { question: q, correct: outcome.answer, correctCount, pct, popular };
  });

  return (
    <div className="min-h-screen bg-surface pb-12">
      <PageTitle title={`${event.name} — recap`} />

      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-4 py-8 sm:py-10">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 tracking-tight">🎉 Event Recap</h1>
          <p className="text-brand-300 text-sm">{event.name}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-5 space-y-6">
        {/* Winner card */}
        {winnerSub && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-3">🏆</div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-1">{winnerSub.display_name}</h2>
            <p className="text-brand-600 font-bold">{winnerSub.total_points} points — Winner!</p>
          </div>
        )}

        {/* Final standings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Final Standings</h3>
          <div className="space-y-2">
            {sorted.map((s, i) => {
              const rank = i + 1;
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
              return (
                <div key={s.display_name} className="flex items-center gap-3 py-1.5">
                  <span className="w-8 text-center text-sm font-mono text-gray-400">{medal || rank}</span>
                  <span className="flex-1 font-semibold text-gray-800 text-sm">{s.display_name}</span>
                  <span className="text-brand-600 font-bold text-sm">{s.total_points}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Biggest upset */}
        {biggestUpset && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Biggest Upset</h3>
            <p className="text-sm font-semibold text-gray-800 mb-2">{biggestUpset.question.text}</p>
            <p className="text-xs text-gray-500">
              Only {biggestUpset.correctCount}/{submissions.length} got it right.
              Correct: <span className="font-semibold text-success-600">{biggestUpset.correct}</span>
              {biggestUpset.popular !== biggestUpset.correct && (
                <> · Most guessed: <span className="font-semibold text-gray-700">{biggestUpset.popular}</span></>
              )}
            </p>
          </div>
        )}

        {/* Question breakdown */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Question Breakdown</h3>
          <div className="space-y-5">
            {questionBreakdowns.map(({ question, correct, correctCount, pct, popular }) => (
              <div key={question.id}>
                <p className="text-sm font-semibold text-gray-800 mb-1">{question.text}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span className="text-success-600 font-semibold">✓ {correct}</span>
                  <span>{correctCount}/{submissions.length} correct ({pct}%)</span>
                  <span>Popular: {popular}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shareable recap card */}
        <RecapCard event={event} winner={winnerSub} sorted={sorted} />

        <div className="text-center pt-2 pb-4">
          <Link
            to={`/i/${inviteCode}/dashboard`}
            className="text-brand-600 hover:text-brand-800 font-semibold text-sm underline underline-offset-4 transition-colors duration-150"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function findBiggestUpset(resolvedQuestions, outcomeMap, submissions) {
  if (resolvedQuestions.length === 0 || submissions.length === 0) return null;

  let worst = null;
  let worstPct = 1;

  for (const q of resolvedQuestions) {
    const outcome = outcomeMap[q.id];
    const correctCount = submissions.filter(s => s[q.id] === outcome.answer).length;
    const pct = correctCount / submissions.length;

    if (pct < worstPct) {
      worstPct = pct;

      const answerCounts = {};
      for (const s of submissions) {
        const a = s[q.id] || '(no answer)';
        answerCounts[a] = (answerCounts[a] || 0) + 1;
      }
      const popular = Object.entries(answerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

      worst = { question: q, correct: outcome.answer, correctCount, popular };
    }
  }

  return worst;
}

function RecapCard({ event, winner, sorted }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const top3 = sorted.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  async function getCanvas() {
    const { default: html2canvas } = await import('html2canvas');
    return html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
    });
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const canvas = await getCanvas();
      const link = document.createElement('a');
      link.download = `${event.name.replace(/\s+/g, '-').toLowerCase()}-recap.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
    setDownloading(false);
  }

  async function handleShare() {
    if (!navigator.share) return;
    setSharing(true);
    try {
      const canvas = await getCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'recap.png', { type: 'image/png' });
      await navigator.share({
        title: `${event.name} — Wedding Prop Bets Results`,
        files: [file],
      });
    } catch {}
    setSharing(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Share Results</h3>

      <div className="flex justify-center mb-4">
        <div
          ref={cardRef}
          className="w-[400px] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 rounded-2xl p-6 text-center"
        >
          <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">🎉 Final Results</p>
          <h4 className="text-lg font-extrabold text-white mb-1">{event.name}</h4>
          <p className="text-brand-400 text-xs mb-5">Wedding Prop Bets</p>

          {winner && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="text-2xl mb-1">🏆</div>
              <p className="text-white font-extrabold">{winner.display_name}</p>
              <p className="text-brand-300 text-xs">{winner.total_points} points</p>
            </div>
          )}

          <div className="space-y-1.5 mb-4">
            {top3.map((s, i) => (
              <div key={s.display_name} className="flex items-center justify-between text-sm px-2">
                <span className="text-white/80">
                  {medals[i]} {s.display_name}
                </span>
                <span className="text-brand-300 font-bold">{s.total_points}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-brand-400 border-t border-white/10 pt-3">
            <span>{sorted.length} players</span>
            <span>·</span>
            <span>{SCORED_QUESTIONS.length} questions</span>
          </div>
          <p className="text-brand-500/60 text-[10px] mt-2">weddingpropbets.com</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50"
        >
          {downloading ? 'Saving...' : 'Download PNG'}
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            onClick={handleShare}
            disabled={sharing}
            className="px-5 py-2.5 bg-white border-2 border-brand-200 hover:border-brand-400 text-brand-600 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50"
          >
            {sharing ? 'Sharing...' : 'Share'}
          </button>
        )}
      </div>
    </div>
  );
}
