import { supabase } from './supabase';
import { SCORED_QUESTIONS } from '../../shared/questions.js';
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

// --- Events ---

export async function createEvent(name) {
  const slug = slugify(name) + '-' + nanoid(6);
  const adminCode = nanoid(12);
  const inviteCode = nanoid(8);

  const { data: event, error } = await supabase
    .from('events')
    .insert({ slug, name, admin_code: adminCode, invite_code: inviteCode })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const outcomeRows = SCORED_QUESTIONS.map(q => ({
    event_id: event.id,
    question_id: q.id,
  }));
  const { error: oErr } = await supabase.from('outcomes').insert(outcomeRows);
  if (oErr) throw new Error(oErr.message);

  return { id: event.id, slug, adminCode, inviteCode };
}

export async function getEventByInvite(inviteCode) {
  const { data, error } = await supabase
    .from('events')
    .select('id, slug, name, date, status, invite_code, tie_breaker_answer, tie_winner_name')
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

// --- Submissions ---

export async function checkName(eventId, name) {
  const { data } = await supabase
    .from('submissions')
    .select('id')
    .eq('event_id', eventId)
    .ilike('display_name', name.trim())
    .limit(1);
  return { taken: data && data.length > 0 };
}

export async function submitAnswers(eventId, answers) {
  const { data: event } = await supabase
    .from('events')
    .select('status')
    .eq('id', eventId)
    .single();
  if (!event || event.status !== 'open') throw new Error('Submissions are closed for this event.');

  const displayName = answers.q2.trim();

  const { taken } = await checkName(eventId, displayName);
  if (taken) throw new Error('That name is already taken for this event.');

  const { data: sub, error } = await supabase
    .from('submissions')
    .insert({
      event_id: eventId,
      display_name: displayName,
      q2: answers.q2?.trim(),
      q3: answers.q3, q4: answers.q4, q5: answers.q5, q6: answers.q6,
      q7: answers.q7, q8: answers.q8, q9: answers.q9, q10: answers.q10,
      q11: answers.q11, q12: answers.q12, q13: answers.q13, q14: answers.q14,
      q15: answers.q15?.trim(),
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

// --- Admin actions ---

export async function updateEventStatus(adminCode, status) {
  const event = await getEventByAdmin(adminCode);
  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', event.id);
  if (error) throw new Error(error.message);
  return { status };
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
  const winnerName = correctTime ? computeTieBreakerWinner(correctTime, submissions) : null;

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

// --- CSV export (client-side) ---

export function downloadCsv(event, submissions) {
  const headers = [
    'event_name', 'display_name', 'submitted_at',
    'q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12','q13','q14','q15',
    'total_points', 'winner'
  ];

  const rows = submissions.map(s => [
    event.name, s.display_name, s.submitted_at,
    s.q2||'', s.q3||'', s.q4||'', s.q5||'', s.q6||'', s.q7||'',
    s.q8||'', s.q9||'', s.q10||'', s.q11||'', s.q12||'', s.q13||'', s.q14||'', s.q15||'',
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
