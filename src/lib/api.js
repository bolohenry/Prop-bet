import { supabase } from './supabase';
import { DEFAULT_QUESTIONS } from '../../shared/questions.js';
import { computeTieBreakerWinner } from '../../shared/tiebreaker.js';

function nanoid(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const arr = crypto.getRandomValues(new Uint8Array(len));
  for (const byte of arr) result += chars[byte % chars.length];
  return result;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

// ─── Questions ───

export async function getQuestions(eventId) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createQuestion(eventId, questionData) {
  const { data: existing } = await supabase
    .from('questions')
    .select('sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = existing?.length ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('questions')
    .insert({
      event_id: eventId,
      question_key: questionData.key || `q_${nanoid(6)}`,
      label: questionData.label,
      type: questionData.type,
      options: questionData.options || null,
      scored: questionData.scored ?? true,
      is_name: questionData.isName ?? false,
      is_tiebreaker: questionData.isTiebreaker ?? false,
      sort_order: questionData.sort_order ?? nextOrder,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateQuestion(questionId, updates) {
  const row = {};
  if (updates.label !== undefined) row.label = updates.label;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.options !== undefined) row.options = updates.options;
  if (updates.scored !== undefined) row.scored = updates.scored;
  if (updates.is_name !== undefined) row.is_name = updates.is_name;
  if (updates.is_tiebreaker !== undefined) row.is_tiebreaker = updates.is_tiebreaker;
  if (updates.sort_order !== undefined) row.sort_order = updates.sort_order;

  const { data, error } = await supabase
    .from('questions')
    .update(row)
    .eq('id', questionId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteQuestion(questionId) {
  const { error } = await supabase.from('questions').delete().eq('id', questionId);
  if (error) throw new Error(error.message);
}

export async function reorderQuestions(eventId, orderedIds) {
  const updates = orderedIds.map((id, i) => ({ id, sort_order: i }));
  for (const u of updates) {
    await supabase.from('questions').update({ sort_order: u.sort_order }).eq('id', u.id);
  }
}

// ─── Helpers derived from questions ───

export function deriveSurveyQuestions(questions) {
  const survey = questions.filter(q => !q.is_name);
  survey.forEach((q, i) => { q.number = i + 1; });
  return survey;
}

export function deriveScoredQuestions(questions) {
  return questions.filter(q => q.scored);
}

export function deriveNameQuestion(questions) {
  return questions.find(q => q.is_name) || null;
}

export function deriveTiebreakerQuestion(questions) {
  return questions.find(q => q.is_tiebreaker) || null;
}

// ─── Events ───

export async function createEvent(name, templateQuestions = null) {
  const slug = slugify(name) + '-' + nanoid(6);
  const adminCode = nanoid(12);
  const inviteCode = nanoid(8);

  const { data: event, error } = await supabase
    .from('events')
    .insert({ slug, name, date: '', admin_code: adminCode, invite_code: inviteCode })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const qTemplate = templateQuestions || DEFAULT_QUESTIONS;
  const questionRows = qTemplate.map((q, i) => ({
    event_id: event.id,
    question_key: q.key,
    label: q.label,
    type: q.type,
    options: q.options || null,
    scored: q.scored ?? true,
    is_name: q.isName ?? false,
    is_tiebreaker: q.isTiebreaker ?? false,
    sort_order: i,
  }));
  const { error: qErr } = await supabase.from('questions').insert(questionRows);
  if (qErr) throw new Error(qErr.message);

  const scored = qTemplate.filter(q => q.scored);
  const outcomeRows = scored.map(q => ({
    event_id: event.id,
    question_id: q.key,
  }));
  if (outcomeRows.length > 0) {
    const { error: oErr } = await supabase.from('outcomes').insert(outcomeRows);
    if (oErr) throw new Error(oErr.message);
  }

  return { id: event.id, slug, adminCode, inviteCode };
}

export async function getEventByInvite(inviteCode) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();
  if (error) throw new Error('Event not found');
  return data;
}

export async function getEventByAdmin(adminCode) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('admin_code', adminCode)
    .single();
  if (error) throw new Error('Event not found');
  return data;
}

// ─── Submissions ───

export async function checkName(eventId, name) {
  const { data } = await supabase
    .from('submissions')
    .select('id')
    .eq('event_id', eventId)
    .ilike('display_name', name.trim())
    .limit(1);
  return { taken: data && data.length > 0 };
}

export async function submitAnswers(eventId, answers, wager3x = null, wager2x = null, avatar = null, email = null) {
  const { data: event } = await supabase
    .from('events')
    .select('status')
    .eq('id', eventId)
    .single();
  if (!event || event.status !== 'open') throw new Error('Submissions are closed for this event.');

  const questions = await getQuestions(eventId);
  const nameQ = deriveNameQuestion(questions);
  const nameKey = nameQ?.question_key || 'q2';
  const displayName = (answers[nameKey] || '').trim();
  if (!displayName) throw new Error('Name is required.');

  const { taken } = await checkName(eventId, displayName);
  if (taken) throw new Error('That name is already taken for this event.');

  const { data: sub, error } = await supabase
    .from('submissions')
    .insert({
      event_id: eventId,
      display_name: displayName,
      avatar: avatar || null,
      email: email || null,
      answers,
      wager_3x: wager3x,
      wager_2x: wager2x,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  return { submission: sub };
}

export async function getSubmission(eventId, name) {
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('event_id', eventId)
    .ilike('display_name', name.trim())
    .single();
  return data || null;
}

export async function getSubmissions(eventId) {
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('event_id', eventId)
    .order('total_points', { ascending: false })
    .order('submitted_at', { ascending: true });
  return data || [];
}

export async function getOutcomes(eventId) {
  const { data } = await supabase
    .from('outcomes')
    .select('question_id, answer, resolved')
    .eq('event_id', eventId);
  return data || [];
}

// ─── Admin actions ───

export async function updateEventStatus(adminCode, status) {
  const event = await getEventByAdmin(adminCode);
  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', event.id);
  if (error) throw new Error(error.message);
  return { status };
}

export async function updateEvent(adminCode, updates) {
  const event = await getEventByAdmin(adminCode);
  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', event.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function scoreQuestion(adminCode, questionId, answer, resolved) {
  const event = await getEventByAdmin(adminCode);

  const { error } = await supabase
    .from('outcomes')
    .update({ answer: answer || null, resolved })
    .eq('event_id', event.id)
    .eq('question_id', questionId);
  if (error) throw new Error(error.message);

  const { error: rpcErr } = await supabase.rpc('recalc_scores', { p_event_id: event.id });
  if (rpcErr) throw new Error(rpcErr.message);

  return { ok: true };
}

export async function setTieBreakerAnswer(adminCode, correctTime) {
  const event = await getEventByAdmin(adminCode);
  const submissions = await getSubmissions(event.id);
  const questions = await getQuestions(event.id);
  const tbQ = deriveTiebreakerQuestion(questions);
  const tbKey = tbQ?.question_key || 'q15';

  let winnerName = null;
  if (correctTime && submissions.length >= 2) {
    const sorted = [...submissions].sort((a, b) => b.total_points - a.total_points);
    const topScore = sorted[0].total_points;
    const tiedForFirst = sorted.filter(s => s.total_points === topScore);

    if (tiedForFirst.length > 1) {
      const candidates = tiedForFirst.map(s => ({
        display_name: s.display_name,
        q15: s.answers?.[tbKey] || s.q15,
      }));
      winnerName = computeTieBreakerWinner(correctTime, candidates);
    }
  }

  const { error } = await supabase
    .from('events')
    .update({
      tie_breaker_answer: correctTime || null,
      tie_winner_name: winnerName,
    })
    .eq('id', event.id);
  if (error) throw new Error(error.message);
  return { winnerName };
}

export async function setTieWinnerOverride(adminCode, winnerName) {
  const event = await getEventByAdmin(adminCode);
  const { error } = await supabase
    .from('events')
    .update({ tie_winner_name: winnerName || null })
    .eq('id', event.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ─── Teams ───

export async function createTeam(eventId, name) {
  const code = nanoid(6).toUpperCase();
  const { data, error } = await supabase
    .from('teams')
    .insert({ event_id: eventId, name: name.trim(), code })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function joinTeam(eventId, teamCode) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', eventId)
    .eq('code', teamCode.toUpperCase())
    .single();
  if (error || !data) throw new Error('Team not found. Check the code and try again.');
  return data;
}

export async function getTeams(eventId) {
  const { data } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  return data || [];
}

// ─── Guests ───

export async function getGuests(eventId) {
  const { data } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function addGuests(eventId, guests) {
  const rows = guests.map(g => ({
    event_id: eventId,
    name: g.name.trim(),
    email: g.email?.trim() || null,
  }));
  const { data, error } = await supabase.from('guests').insert(rows).select();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateGuestStatus(guestId, status, submissionId = null) {
  const update = { status };
  if (submissionId) update.submission_id = submissionId;
  const { error } = await supabase.from('guests').update(update).eq('id', guestId);
  if (error) throw new Error(error.message);
}

export async function deleteGuest(guestId) {
  const { error } = await supabase.from('guests').delete().eq('id', guestId);
  if (error) throw new Error(error.message);
}

export async function importGuestsCsv(eventId, csvText) {
  const lines = csvText.trim().split('\n').filter(l => l.trim());
  if (lines.length === 0) throw new Error('CSV is empty');

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('name') || header.includes('email');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const guests = dataLines.map(line => {
    const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    return { name: parts[0], email: parts[1] || null };
  }).filter(g => g.name);

  return addGuests(eventId, guests);
}

// ─── Templates ───

export async function getTemplates() {
  const { data } = await supabase
    .from('templates')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name', { ascending: true });
  return data || [];
}

export async function cloneEvent(adminCode) {
  const event = await getEventByAdmin(adminCode);
  const questions = await getQuestions(event.id);
  const template = questions.map(q => ({
    key: q.question_key,
    label: q.label,
    type: q.type,
    options: q.options,
    scored: q.scored,
    isName: q.is_name,
    isTiebreaker: q.is_tiebreaker,
  }));
  return createEvent(`${event.name} (copy)`, template);
}

// ─── Reveal ───

export async function setRevealMode(adminCode, enabled, revealOrder = null) {
  const event = await getEventByAdmin(adminCode);
  const updates = { reveal_mode: enabled };
  if (revealOrder) updates.reveal_order = revealOrder;
  if (enabled) updates.current_reveal_index = -1;
  const { error } = await supabase.from('events').update(updates).eq('id', event.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function revealNext(adminCode) {
  const event = await getEventByAdmin(adminCode);
  if (!event.reveal_order || !event.reveal_mode) throw new Error('Reveal mode not active');
  const nextIndex = (event.current_reveal_index ?? -1) + 1;
  if (nextIndex >= event.reveal_order.length) throw new Error('All questions revealed');

  const questionKey = event.reveal_order[nextIndex];
  const outcome = await supabase
    .from('outcomes')
    .select('answer, resolved')
    .eq('event_id', event.id)
    .eq('question_id', questionKey)
    .single();

  if (!outcome.data?.resolved) throw new Error(`Question ${questionKey} has not been scored yet`);

  const { error } = await supabase
    .from('events')
    .update({ current_reveal_index: nextIndex })
    .eq('id', event.id);
  if (error) throw new Error(error.message);

  return { index: nextIndex, questionKey, answer: outcome.data.answer };
}

// ─── CSV export (client-side) ───

export function downloadCsv(event, submissions, questions) {
  const scoredQs = questions ? questions.filter(q => q.scored) : [];
  const allQs = questions || [];

  const headers = [
    'event_name', 'display_name', 'submitted_at',
    ...allQs.map(q => q.question_key),
    'total_points', 'winner'
  ];

  const rows = submissions.map(s => [
    event.name, s.display_name, s.submitted_at,
    ...allQs.map(q => s.answers?.[q.question_key] || ''),
    s.total_points,
    event.tie_winner_name === s.display_name ? 'YES' : ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(event.name)}-results.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
