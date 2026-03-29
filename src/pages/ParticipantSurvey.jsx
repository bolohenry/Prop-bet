import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getEventByInvite, submitAnswers } from '../lib/api';
import { QUESTIONS } from '../../shared/questions.js';

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

export default function ParticipantSurvey() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(location.state?.event || null);
  const [displayName] = useState(location.state?.displayName || sessionStorage.getItem(`wpb_name_${event?.id}`) || '');
  const [answers, setAnswers] = useState(() => {
    const initial = {};
    for (const q of QUESTIONS) initial[q.id] = '';
    if (location.state?.displayName) initial.q2 = location.state.displayName;
    return initial;
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!event) {
      getEventByInvite(inviteCode).then(e => {
        setEvent(e);
        if (!displayName) navigate(`/i/${inviteCode}`);
      }).catch(() => navigate(`/i/${inviteCode}`));
    }
  }, [inviteCode, event, displayName, navigate]);

  function setAnswer(qId, value) {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    setErrors(prev => ({ ...prev, [qId]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    const newErrors = {};
    for (const q of QUESTIONS) {
      if (!answers[q.id] || !answers[q.id].trim()) {
        newErrors[q.id] = 'Required';
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorQ = QUESTIONS.find(q => newErrors[q.id]);
      document.getElementById(firstErrorQ.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      await submitAnswers(event.id, answers);
      sessionStorage.setItem(`wpb_name_${event.id}`, answers.q2.trim());
      navigate(`/i/${inviteCode}/dashboard`);
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  }

  if (!event) return <div className="flex items-center justify-center min-h-screen bg-surface"><p className="text-gray-400">Loading...</p></div>;

  if (event.status !== 'open') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-4 sm:p-8 flex items-center justify-center">
        <div className="text-center">
          <span className="text-3xl block mb-3">🔒</span>
          <h1 className="text-2xl font-bold text-white mb-2">{event.name}</h1>
          <p className="text-warn-500 font-semibold">Submissions are currently closed for this event.</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-surface pb-8">
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-4 py-8 sm:py-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 tracking-tight">{event.name}</h1>
        <p className="text-brand-300 text-sm">{formattedDate}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 -mt-5 space-y-4">
        {QUESTIONS.map(q => (
          <div key={q.id} id={q.id} className={`bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 transition-all duration-200 ${errors[q.id] ? 'border-danger-400 shadow-danger-100' : 'border-transparent shadow-gray-900/[0.04]'}`}>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold mr-2">{q.number}</span>
              {q.text}
              {q.hint && <span className="text-gray-400 text-xs font-normal ml-1">({q.hint})</span>}
            </label>

            {q.type === 'text' && (
              <input
                type="text"
                value={answers[q.id]}
                onChange={e => setAnswer(q.id, e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200"
                placeholder={q.hint || 'Type your answer...'}
                readOnly={q.id === 'q2'}
              />
            )}

            {q.type === 'yesno' && (
              <div className="flex gap-3">
                {['Yes', 'No'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(q.id, opt)}
                    className={`flex-1 py-3.5 rounded-xl border-2 text-base font-semibold transition-all duration-200 ${
                      answers[q.id] === opt
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 active:scale-[0.98]'
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
                    onClick={() => setAnswer(q.id, opt)}
                    className={`flex-1 py-3.5 rounded-xl border-2 text-base font-semibold transition-all duration-200 ${
                      answers[q.id] === opt
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 active:scale-[0.98]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'choice' && (
              <div className="grid grid-cols-2 gap-2.5">
                {q.options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(q.id, opt)}
                    className={`py-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                      answers[q.id] === opt
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 active:scale-[0.98]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'time' && (
              <select
                value={answers[q.id]}
                onChange={e => setAnswer(q.id, e.target.value)}
                className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200 appearance-none bg-white ${!answers[q.id] ? 'text-gray-400' : 'text-gray-800'}`}
              >
                <option value="">Select a time...</option>
                {TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}

            {errors[q.id] && <p className="text-danger-500 text-xs mt-2 font-medium">{errors[q.id]}</p>}
          </div>
        ))}

        {submitError && (
          <div className="bg-danger-50 border border-danger-400/30 rounded-2xl p-4">
            <p className="text-danger-600 text-sm font-medium">{submitError}</p>
          </div>
        )}

        <div className="sticky bottom-4 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white py-4 rounded-2xl text-lg font-bold transition-all duration-200 disabled:opacity-50 shadow-xl shadow-brand-600/25 active:scale-[0.98]"
          >
            {submitting ? 'Submitting...' : 'Submit my answers'}
          </button>
        </div>
      </form>
    </div>
  );
}
