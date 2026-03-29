import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getEventByInvite, submitAnswers } from '../lib/api';
import { QUESTIONS } from '../../shared/questions.js';

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
        if (!displayName) {
          navigate(`/i/${inviteCode}`);
        }
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
        newErrors[q.id] = 'This field is required';
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

  if (!event) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">Loading...</p></div>;

  if (event.status !== 'open') {
    return (
      <div className="max-w-lg mx-auto p-6 pt-12">
        <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">Submissions are currently closed for this event.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 pb-12">
      <h1 className="text-2xl font-bold mb-1">{event.name}</h1>
      <p className="text-gray-500 mb-6">{new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {QUESTIONS.map(q => (
          <div key={q.id} id={q.id} className="bg-white border rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">
              <span className="text-gray-400 mr-1">Q{q.number}.</span>
              {q.text}
              {q.hint && <span className="text-gray-400 text-xs ml-1">({q.hint})</span>}
            </label>

            {q.type === 'text' && (
              <input
                type="text"
                value={answers[q.id]}
                onChange={e => setAnswer(q.id, e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base"
                placeholder={q.hint || ''}
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
                    className={`flex-1 py-3 rounded-lg border text-base font-medium transition-colors ${
                      answers[q.id] === opt
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
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
                    className={`flex-1 py-3 rounded-lg border text-base font-medium transition-colors ${
                      answers[q.id] === opt
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'choice' && (
              <div className="grid grid-cols-2 gap-2">
                {q.options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(q.id, opt)}
                    className={`py-3 rounded-lg border text-base font-medium transition-colors ${
                      answers[q.id] === opt
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {errors[q.id] && <p className="text-red-600 text-xs mt-1">{errors[q.id]}</p>}
          </div>
        ))}

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{submitError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black text-white py-4 rounded-lg text-lg font-medium hover:bg-gray-800 disabled:opacity-50 sticky bottom-4"
        >
          {submitting ? 'Submitting...' : 'Submit My Answers'}
        </button>
      </form>
    </div>
  );
}
