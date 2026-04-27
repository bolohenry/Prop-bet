import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { getEventByInvite, submitAnswers, getQuestions, deriveSurveyQuestions, deriveScoredQuestions, deriveNameQuestion } from '../lib/api';
import PageTitle from '../components/PageTitle';
import WagerPicker from '../components/WagerPicker';
import { LoadingPage } from '../components/Skeleton';

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

function ChevronDown() {
  return (
    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function ParticipantSurvey() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(location.state?.event || null);
  const [questions, setQuestions] = useState([]);
  const [displayName] = useState(location.state?.displayName || sessionStorage.getItem(`wpb_name_${event?.id}`) || '');
  const [avatar] = useState(location.state?.avatar || sessionStorage.getItem(`wpb_avatar_${event?.id}`) || '');
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [wagers, setWagers] = useState({});
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    async function load() {
      let ev = event;
      if (!ev) {
        try {
          ev = await getEventByInvite(inviteCode);
          setEvent(ev);
        } catch {
          navigate(`/i/${inviteCode}`);
          return;
        }
      }
      if (!displayName && !location.state?.displayName) {
        navigate(`/i/${inviteCode}`);
        return;
      }

      const qs = await getQuestions(ev.id);
      setQuestions(qs);

      const initial = {};
      for (const q of qs) initial[q.question_key] = '';
      const nameQ = qs.find(q => q.is_name);
      if (nameQ) initial[nameQ.question_key] = displayName || location.state?.displayName || '';

      try {
        const draft = JSON.parse(sessionStorage.getItem(`wpb_draft_${ev.id}`) || '{}');
        for (const key of Object.keys(draft)) {
          if (draft[key]) initial[key] = draft[key];
        }
      } catch {}
      if (nameQ) initial[nameQ.question_key] = displayName || location.state?.displayName || '';

      setAnswers(initial);
    }
    load();
  }, [inviteCode, event, displayName, navigate, location.state]);

  useEffect(() => {
    if (event?.id && Object.keys(answers).length > 0) {
      sessionStorage.setItem(`wpb_draft_${event.id}`, JSON.stringify(answers));
    }
  }, [answers, event?.id]);

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 80) setShowScrollHint(false);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const surveyQuestions = useMemo(() => deriveSurveyQuestions([...questions]), [questions]);
  const scoredQuestions = useMemo(() => deriveScoredQuestions(questions), [questions]);
  const nameQuestion = useMemo(() => deriveNameQuestion(questions), [questions]);

  const progress = useMemo(() => {
    if (surveyQuestions.length === 0) return 0;
    const answered = surveyQuestions.filter(q => answers[q.question_key]?.trim()).length;
    return Math.round((answered / surveyQuestions.length) * 100);
  }, [answers, surveyQuestions]);

  const answeredCount = useMemo(() => {
    return surveyQuestions.filter(q => answers[q.question_key]?.trim()).length;
  }, [answers, surveyQuestions]);

  function setAnswer(qKey, value) {
    setAnswers(prev => ({ ...prev, [qKey]: value }));
    setErrors(prev => ({ ...prev, [qKey]: '' }));
  }

  function handleNextStep(e) {
    e.preventDefault();
    setSubmitError('');

    const newErrors = {};
    for (const q of questions) {
      if (!answers[q.question_key] || !answers[q.question_key].trim()) {
        newErrors[q.question_key] = 'Required';
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorQ = surveyQuestions.find(q => newErrors[q.question_key]);
      if (firstErrorQ) {
        document.getElementById(firstErrorQ.question_key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleWagerChange(qKey, value) {
    setWagers(prev => {
      const next = { ...prev };
      if (value === 1) {
        delete next[qKey];
      } else {
        next[qKey] = value;
      }
      return next;
    });
  }

  async function handleFinalSubmit() {
    setSubmitError('');
    setSubmitting(true);
    try {
      const tripleQ = Object.entries(wagers).find(([, v]) => v === 3)?.[0] || null;
      const doubleQ = Object.entries(wagers).find(([, v]) => v === 2)?.[0] || null;
      const nameKey = nameQuestion?.question_key || 'q2';
      await submitAnswers(event.id, answers, tripleQ, doubleQ, avatar);
      sessionStorage.setItem(`wpb_name_${event.id}`, answers[nameKey].trim());
      sessionStorage.removeItem(`wpb_draft_${event.id}`);
      toast.success('Bets submitted! 🎲');
      navigate(`/i/${inviteCode}/dashboard`);
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  }

  if (!event || questions.length === 0) return <LoadingPage />;

  if (event.status !== 'open') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-8">
        <div className="text-center">
          <span className="text-3xl block mb-3">🔒</span>
          <h1 className="text-2xl font-bold text-white mb-0.5">{event.name}</h1>
          <p className="text-brand-400 text-sm font-medium mb-2">wedding prop bets</p>
          <p className="text-warn-500 font-semibold">Submissions are currently closed for this event.</p>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <>
        <PageTitle title={`${event.name} — wagers`} />
        {submitError && (
          <div className="max-w-lg mx-auto px-4 mt-4">
            <div className="bg-danger-50 border border-danger-400/30 rounded-2xl p-4">
              <p className="text-danger-600 text-sm font-medium">{submitError}</p>
            </div>
          </div>
        )}
        <WagerPicker
          answers={answers}
          wagers={wagers}
          scoredQuestions={scoredQuestions.map((q, i) => ({ ...q, number: i + 1 }))}
          onWagerChange={handleWagerChange}
          onBack={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onSubmit={handleFinalSubmit}
          submitting={submitting}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-8 relative">
      <PageTitle title={`${event.name} — survey`} />

      <div className="sticky top-0 z-50">
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-brand-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="bg-surface/90 backdrop-blur-sm border-b border-gray-100 px-4 py-1.5 text-center">
          <p className="text-xs text-gray-400 font-medium">
            <span className="text-brand-600 font-bold">{answeredCount}</span> of {surveyQuestions.length} answered
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-4 py-5 sm:py-6 text-center">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-0.5 tracking-tight">{event.name}</h1>
        <p className="text-brand-400/70 text-xs">Playing as {avatar && <span className="mr-1">{avatar}</span>}<span className="text-brand-200 font-semibold">{displayName}</span></p>
      </div>

      <form onSubmit={handleNextStep} className="max-w-lg mx-auto px-4 -mt-3 space-y-3">

      {showScrollHint && (
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-brand-600/90 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
            Scroll for more questions
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      )}
        {surveyQuestions.map(q => {
          const isTiebreaker = q.is_tiebreaker;
          const qKey = q.question_key;
          const cardBase = isTiebreaker
            ? `bg-accent-50 rounded-2xl p-4 sm:p-5 pt-7 shadow-sm border-2 transition-all duration-200 relative ${errors[qKey] ? 'border-danger-400' : 'border-accent-200'}`
            : `bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 transition-all duration-200 ${errors[qKey] ? 'border-danger-400 shadow-danger-100' : 'border-transparent shadow-gray-900/[0.04]'}`;
          const numCircle = isTiebreaker
            ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-100 text-accent-500 text-xs font-bold mr-2'
            : 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold mr-2';

          const options = q.type === 'choice' ? (q.options || []) : [];

          return (
          <div key={qKey} id={qKey} className={cardBase}>
            {isTiebreaker && (
              <span className="absolute -top-3 left-5 bg-accent-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                Tiebreaker
              </span>
            )}
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              <span className={numCircle}>{isTiebreaker ? 'TB' : q.number}</span>
              {q.label}
            </label>

            {q.type === 'text' && (
              <input
                type="text"
                value={answers[qKey] || ''}
                onChange={e => setAnswer(qKey, e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200"
                placeholder="Type your answer..."
              />
            )}

            {q.type === 'yesno' && (
              <div className="flex gap-3">
                {['Yes', 'No'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(qKey, opt)}
                    className={`flex-1 py-3.5 rounded-xl border-2 text-base font-semibold transition-all duration-200 ${
                      answers[qKey] === opt
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-accent-300 hover:text-accent-500 active:scale-[0.98]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'overunder' && (
              <div className="flex gap-3">
                {['Over', 'Under'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(qKey, opt)}
                    className={`flex-1 py-3.5 rounded-xl border-2 text-base font-semibold transition-all duration-200 ${
                      answers[qKey] === opt
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-accent-300 hover:text-accent-500 active:scale-[0.98]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'choice' && (
              <div className="grid grid-cols-2 gap-2.5">
                {options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(qKey, opt)}
                    className={`py-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                      answers[qKey] === opt
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-accent-300 hover:text-accent-500 active:scale-[0.98]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'time' && (
              <div className="relative">
                <select
                  value={answers[qKey] || ''}
                  onChange={e => setAnswer(qKey, e.target.value)}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200 appearance-none bg-white ${!answers[qKey] ? 'text-gray-400' : 'text-gray-800'}`}
                >
                  <option value="">Select a time...</option>
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            )}

            {errors[qKey] && <p className="text-danger-500 text-xs mt-2 font-medium">{errors[qKey]}</p>}
          </div>
          );
        })}

        {submitError && (
          <div className="bg-danger-50 border border-danger-400/30 rounded-2xl p-4">
            <p className="text-danger-600 text-sm font-medium">{submitError}</p>
          </div>
        )}

        <div className="sticky bottom-4 pt-2">
          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-accent-500 text-white py-4 rounded-2xl text-lg font-bold transition-all duration-200 shadow-xl shadow-brand-600/25 hover:shadow-accent-500/30 active:scale-[0.98]"
          >
            Next: Place Your Wagers →
          </button>
        </div>
      </form>
    </div>
  );
}
