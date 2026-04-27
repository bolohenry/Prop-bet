import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventByAdmin, getQuestions, getSubmissions, getOutcomes, deriveScoredQuestions } from '../lib/api';
import PageTitle from '../components/PageTitle';
import AnswerDistributionChart from '../components/charts/AnswerDistributionChart';
import ConsensusVsReality from '../components/charts/ConsensusVsReality';
import ScoreProgressionChart from '../components/charts/ScoreProgressionChart';
import { LoadingPage } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminAnalytics() {
  const { adminCode } = useParams();
  const [event, setEvent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ev = await getEventByAdmin(adminCode);
        setEvent(ev);
        const [qs, subs, outs] = await Promise.all([
          getQuestions(ev.id),
          getSubmissions(ev.id),
          getOutcomes(ev.id),
        ]);
        setQuestions(qs);
        setSubmissions(subs);
        setOutcomes(outs);
      } catch {}
      setLoading(false);
    }
    load();
  }, [adminCode]);

  const scoredQuestions = useMemo(() => deriveScoredQuestions(questions).map((q, i) => ({ ...q, number: i + 1 })), [questions]);

  const analytics = useMemo(() => {
    if (submissions.length === 0) return null;

    const hourCounts = {};
    for (const s of submissions) {
      const h = new Date(s.submitted_at).getHours();
      const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      hourCounts[label] = (hourCounts[label] || 0) + 1;
    }
    const peakActivity = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => {
        const hourA = parseInt(a.hour);
        const hourB = parseInt(b.hour);
        return hourA - hourB;
      });

    const wager3xCounts = {};
    const wager2xCounts = {};
    for (const s of submissions) {
      if (s.wager_3x) wager3xCounts[s.wager_3x] = (wager3xCounts[s.wager_3x] || 0) + 1;
      if (s.wager_2x) wager2xCounts[s.wager_2x] = (wager2xCounts[s.wager_2x] || 0) + 1;
    }
    const wagerDist = scoredQuestions.map(q => ({
      question: `Q${q.number}`,
      label: q.label,
      triple: wager3xCounts[q.question_key] || 0,
      double: wager2xCounts[q.question_key] || 0,
    })).filter(w => w.triple > 0 || w.double > 0)
      .sort((a, b) => (b.triple + b.double) - (a.triple + a.double));

    const outcomeMap = {};
    for (const o of outcomes) outcomeMap[o.question_id] = o;

    const contestedQs = scoredQuestions
      .filter(q => outcomeMap[q.question_key]?.resolved)
      .map(q => {
        const counts = {};
        for (const s of submissions) {
          const a = s.answers?.[q.question_key] || '(none)';
          counts[a] = (counts[a] || 0) + 1;
        }
        const maxPct = Math.max(...Object.values(counts)) / submissions.length;
        const correctCount = submissions.filter(s => s.answers?.[q.question_key] === outcomeMap[q.question_key].answer).length;
        return { question: q, maxAgreement: maxPct, correctPct: correctCount / submissions.length };
      })
      .sort((a, b) => a.maxAgreement - b.maxAgreement);

    const mostContested = contestedQs.slice(0, 3);
    const mostUnanimous = [...contestedQs].sort((a, b) => b.maxAgreement - a.maxAgreement).slice(0, 3);

    return { peakActivity, wagerDist, mostContested, mostUnanimous };
  }, [submissions, outcomes, scoredQuestions]);

  if (loading) return <LoadingPage />;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-surface pb-12">
      <PageTitle title={`${event.name} — analytics`} />
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link to={`/admin/${adminCode}`} className="text-brand-400 text-xs font-semibold hover:text-brand-300 transition-colors">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">Analytics</h1>
          <p className="text-brand-400 text-sm mt-1">{event.name} · {submissions.length} submissions</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={submissions.length} label="Total Submissions" />
          <StatCard value={scoredQuestions.length} label="Questions" />
          <StatCard value={outcomes.filter(o => o.resolved).length} label="Scored" />
        </div>

        {analytics && (
          <>
            {analytics.peakActivity.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Submission Activity</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.peakActivity}>
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} width={30} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {analytics.wagerDist.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Wager Distribution</h3>
                <div className="space-y-3">
                  {analytics.wagerDist.map(w => (
                    <div key={w.question} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-8">{w.question}</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 truncate mb-1">{w.label}</p>
                        <div className="flex gap-2">
                          {w.triple > 0 && <span className="text-[10px] font-bold bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full">3× ({w.triple})</span>}
                          {w.double > 0 && <span className="text-[10px] font-bold bg-accent-100 text-accent-500 px-2 py-0.5 rounded-full">2× ({w.double})</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.mostContested.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Most Contested Questions</h3>
                <p className="text-xs text-gray-400 mb-3">Highest answer variance — the hardest to predict.</p>
                <div className="space-y-3">
                  {analytics.mostContested.map(c => (
                    <div key={c.question.question_key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Q{c.question.number}. {c.question.label}</p>
                        <p className="text-xs text-gray-400">Only {Math.round(c.correctPct * 100)}% got it right</p>
                      </div>
                      <span className="text-xs font-bold bg-danger-100 text-danger-600 px-2.5 py-1 rounded-full">
                        {Math.round(c.maxAgreement * 100)}% agreement
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.mostUnanimous.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Most Unanimous Questions</h3>
                <p className="text-xs text-gray-400 mb-3">Highest agreement — everyone thought the same thing.</p>
                <div className="space-y-3">
                  {analytics.mostUnanimous.map(c => (
                    <div key={c.question.question_key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Q{c.question.number}. {c.question.label}</p>
                        <p className="text-xs text-gray-400">{Math.round(c.correctPct * 100)}% got it right</p>
                      </div>
                      <span className="text-xs font-bold bg-success-100 text-success-600 px-2.5 py-1 rounded-full">
                        {Math.round(c.maxAgreement * 100)}% agreement
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ConsensusVsReality scoredQuestions={scoredQuestions} outcomes={outcomes} submissions={submissions} />
            <ScoreProgressionChart scoredQuestions={scoredQuestions} outcomes={outcomes} submissions={submissions} />

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Answer Distribution</h3>
              <div className="space-y-6">
                {scoredQuestions.map(q => (
                  <AnswerDistributionChart key={q.question_key} question={q} submissions={submissions} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-4 text-center">
      <p className="text-2xl font-extrabold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
