const BASE = '/api';

async function json(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function createEvent(name, date) {
  const res = await fetch(`${BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, date }),
  });
  return json(res);
}

export async function getEventByInvite(inviteCode) {
  const res = await fetch(`${BASE}/events/invite/${inviteCode}`);
  return json(res);
}

export async function getAdminDashboard(adminCode) {
  const res = await fetch(`${BASE}/events/admin/${adminCode}`);
  return json(res);
}

export async function checkName(eventId, name) {
  const res = await fetch(`${BASE}/events/${eventId}/check-name?name=${encodeURIComponent(name)}`);
  return json(res);
}

export async function submitAnswers(eventId, answers) {
  const res = await fetch(`${BASE}/events/${eventId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  return json(res);
}

export async function getSubmission(eventId, name) {
  const res = await fetch(`${BASE}/events/${eventId}/submission?name=${encodeURIComponent(name)}`);
  if (res.status === 404) return null;
  return json(res);
}

export async function updateEventStatus(adminCode, status) {
  const res = await fetch(`${BASE}/events/admin/${adminCode}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return json(res);
}

export async function scoreQuestion(adminCode, questionId, answer, resolved) {
  const res = await fetch(`${BASE}/events/admin/${adminCode}/score`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, answer, resolved }),
  });
  return json(res);
}

export async function setTieWinner(adminCode, winnerName) {
  const res = await fetch(`${BASE}/events/admin/${adminCode}/winner`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winnerName }),
  });
  return json(res);
}

export function getCsvUrl(adminCode) {
  return `${BASE}/events/admin/${adminCode}/csv`;
}
