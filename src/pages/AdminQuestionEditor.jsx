import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getEventByAdmin, getQuestions, createQuestion, updateQuestion, deleteQuestion, reorderQuestions } from '../lib/api';
import PageTitle from '../components/PageTitle';
import ConfirmDialog from '../components/ConfirmDialog';
import { LoadingPage } from '../components/Skeleton';

const QUESTION_TYPES = [
  { value: 'yesno', label: 'Yes / No' },
  { value: 'overunder', label: 'Over / Under' },
  { value: 'choice', label: 'Multiple Choice' },
  { value: 'text', label: 'Free Text' },
  { value: 'time', label: 'Time Picker' },
];

export default function AdminQuestionEditor() {
  const { adminCode } = useParams();
  const [event, setEvent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const ev = await getEventByAdmin(adminCode);
        setEvent(ev);
        const qs = await getQuestions(ev.id);
        setQuestions(qs);
      } catch {}
      setLoading(false);
    }
    load();
  }, [adminCode]);

  async function handleAdd() {
    if (!event) return;
    try {
      const q = await createQuestion(event.id, {
        label: 'New question',
        type: 'yesno',
        scored: true,
      });
      setQuestions(prev => [...prev, q]);
      setEditing(q.id);
      toast.success('Question added');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSave(questionId, updates) {
    try {
      const updated = await updateQuestion(questionId, updates);
      setQuestions(prev => prev.map(q => q.id === questionId ? updated : q));
      toast.success('Saved');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete(questionId) {
    try {
      await deleteQuestion(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      setDeleteTarget(null);
      toast.success('Question removed');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleMove(index, direction) {
    const newList = [...questions];
    const target = index + direction;
    if (target < 0 || target >= newList.length) return;
    [newList[index], newList[target]] = [newList[target], newList[index]];
    setQuestions(newList);
    try {
      await reorderQuestions(event.id, newList.map(q => q.id));
    } catch {}
  }

  if (loading) return <LoadingPage />;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-surface pb-12">
      <PageTitle title={`${event.name} — questions`} />
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link to={`/admin/${adminCode}`} className="text-brand-400 text-xs font-semibold hover:text-brand-300 transition-colors">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">Question Editor</h1>
          <p className="text-brand-400 text-sm mt-1">{event.name} · {questions.length} questions</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-4 space-y-3">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            isEditing={editing === q.id}
            onToggleEdit={() => setEditing(editing === q.id ? null : q.id)}
            onSave={(updates) => handleSave(q.id, updates)}
            onDelete={() => setDeleteTarget(q.id)}
            onMove={(dir) => handleMove(i, dir)}
          />
        ))}

        <button
          onClick={handleAdd}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-brand-400 hover:text-brand-500 text-sm font-bold transition-all duration-200"
        >
          + Add Question
        </button>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this question?"
        description="This cannot be undone. Any existing answers for this question will be lost."
        confirmLabel="Delete"
        destructive
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function QuestionCard({ question, index, total, isEditing, onToggleEdit, onSave, onDelete, onMove }) {
  const [label, setLabel] = useState(question.label);
  const [type, setType] = useState(question.type);
  const [scored, setScored] = useState(question.scored);
  const [isName, setIsName] = useState(question.is_name);
  const [isTiebreaker, setIsTiebreaker] = useState(question.is_tiebreaker);
  const [options, setOptions] = useState(question.options || []);
  const [newOption, setNewOption] = useState('');

  function handleSave() {
    onSave({
      label,
      type,
      scored,
      is_name: isName,
      is_tiebreaker: isTiebreaker,
      options: type === 'choice' ? options : null,
    });
    onToggleEdit();
  }

  const badges = [];
  if (isName) badges.push({ text: 'Name', cls: 'bg-blue-100 text-blue-600' });
  if (isTiebreaker) badges.push({ text: 'Tiebreaker', cls: 'bg-accent-100 text-accent-500' });
  if (scored) badges.push({ text: 'Scored', cls: 'bg-success-100 text-success-600' });
  if (!scored && !isName && !isTiebreaker) badges.push({ text: 'Unscored', cls: 'bg-gray-100 text-gray-400' });

  if (!isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-5 flex items-start gap-3">
        <div className="flex flex-col gap-1 items-center">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-30 text-xs">▲</button>
          <span className="text-xs font-mono text-gray-400">{index + 1}</span>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-30 text-xs">▼</button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{question.label}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-gray-400">{QUESTION_TYPES.find(t => t.value === question.type)?.label || question.type}</span>
            {badges.map(b => <span key={b.text} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.cls}`}>{b.text}</span>)}
          </div>
        </div>
        <button onClick={onToggleEdit} className="text-xs text-brand-500 hover:text-brand-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-brand-200 p-5 space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Question text</label>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white">
            {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-2 pt-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={scored} onChange={e => { setScored(e.target.checked); if (e.target.checked) { setIsName(false); setIsTiebreaker(false); } }} className="rounded" />
            Scored
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isName} onChange={e => { setIsName(e.target.checked); if (e.target.checked) setScored(false); }} className="rounded" />
            Name field
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isTiebreaker} onChange={e => { setIsTiebreaker(e.target.checked); if (e.target.checked) setScored(false); }} className="rounded" />
            Tiebreaker
          </label>
        </div>
      </div>

      {type === 'choice' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Options</label>
          <div className="space-y-1.5">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={e => { const next = [...options]; next[i] = e.target.value; setOptions(next); }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-danger-400 hover:text-danger-600 text-xs font-bold px-2">✕</button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newOption}
                onChange={e => setNewOption(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newOption.trim()) { e.preventDefault(); setOptions([...options, newOption.trim()]); setNewOption(''); } }}
                placeholder="Add option..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={() => { if (newOption.trim()) { setOptions([...options, newOption.trim()]); setNewOption(''); } }} className="text-brand-500 font-bold text-sm px-2">+</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <button onClick={onDelete} className="text-xs text-danger-500 hover:text-danger-700 font-semibold">Delete question</button>
        <div className="flex gap-2">
          <button onClick={onToggleEdit} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-semibold">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}
