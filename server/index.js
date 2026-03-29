import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import db from './db.js';
import { addClient, broadcast } from './sse.js';
import { recalcScores } from './scoring.js';
import { QUESTIONS, SCORED_QUESTIONS } from '../shared/questions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Helpers ---

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

function getEventDashboard(eventId) {
  const submissions = db.prepare(
    'SELECT display_name, submitted_at, q1,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13,q14,q15, total_points FROM submissions WHERE event_id = ? ORDER BY total_points DESC, submitted_at ASC'
  ).all(eventId);

  const outcomes = db.prepare(
    'SELECT question_id, answer, resolved FROM outcomes WHERE event_id = ?'
  ).all(eventId);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);

  return { event, submissions, outcomes };
}

// --- SSE endpoint ---

app.get('/sse/events/:eventId', (req, res) => {
  const { eventId } = req.params;
  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');

  const dashboard = getEventDashboard(eventId);
  res.write(`data: ${JSON.stringify({ type: 'dashboard', ...dashboard })}\n\n`);

  addClient(eventId, res);
});

// --- Event creation ---

app.post('/api/events', (req, res) => {
  const { name, date } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'Name and date are required' });

  const id = uuidv4();
  const slug = slugify(name) + '-' + nanoid(6);
  const adminCode = nanoid(12);
  const inviteCode = nanoid(8);

  db.prepare(
    'INSERT INTO events (id, slug, name, date, admin_code, invite_code) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, slug, name, date, adminCode, inviteCode);

  // Seed outcome rows for scored questions
  const insertOutcome = db.prepare(
    'INSERT INTO outcomes (id, event_id, question_id) VALUES (?, ?, ?)'
  );
  for (const q of SCORED_QUESTIONS) {
    insertOutcome.run(uuidv4(), id, q.id);
  }

  res.json({ id, slug, adminCode, inviteCode });
});

// --- Get event by invite code ---

app.get('/api/events/invite/:inviteCode', (req, res) => {
  const event = db.prepare(
    'SELECT id, slug, name, date, status, invite_code, tie_winner_name FROM events WHERE invite_code = ?'
  ).get(req.params.inviteCode);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// --- Get event by admin code ---

app.get('/api/events/admin/:adminCode', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE admin_code = ?').get(req.params.adminCode);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const dashboard = getEventDashboard(event.id);
  res.json({ ...dashboard });
});

// --- Check if display_name is taken ---

app.get('/api/events/:eventId/check-name', (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const existing = db.prepare(
    'SELECT id FROM submissions WHERE event_id = ? AND LOWER(display_name) = LOWER(?)'
  ).get(req.params.eventId, name.trim());

  res.json({ taken: !!existing });
});

// --- Submit answers ---

app.post('/api/events/:eventId/submit', (req, res) => {
  const { eventId } = req.params;
  const event = db.prepare('SELECT id, status FROM events WHERE id = ?').get(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.status !== 'open') return res.status(400).json({ error: 'Submissions are closed for this event.' });

  const { answers } = req.body;
  if (!answers) return res.status(400).json({ error: 'Answers are required' });

  // Validate all questions answered
  for (const q of QUESTIONS) {
    if (!answers[q.id] || !answers[q.id].trim()) {
      return res.status(400).json({ error: `Question ${q.number} is required` });
    }
  }

  const displayName = answers.q2.trim();

  // Check uniqueness
  const existing = db.prepare(
    'SELECT id FROM submissions WHERE event_id = ? AND LOWER(display_name) = LOWER(?)'
  ).get(eventId, displayName);
  if (existing) return res.status(409).json({ error: 'That name is already taken for this event.' });

  const id = uuidv4();

  db.prepare(`
    INSERT INTO submissions (id, event_id, display_name, q1,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13,q14,q15)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, eventId, displayName,
    answers.q1?.trim(), answers.q2?.trim(), answers.q3, answers.q4, answers.q5,
    answers.q6, answers.q7, answers.q8, answers.q9, answers.q10,
    answers.q11, answers.q12, answers.q13, answers.q14, answers.q15?.trim()
  );

  // Recalc scores in case outcomes are already set
  recalcScores(eventId);

  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);

  // Broadcast updated dashboard
  broadcast(eventId, { type: 'dashboard', ...getEventDashboard(eventId) });

  res.json({ submission });
});

// --- Get submission by display name (for dashboard gating) ---

app.get('/api/events/:eventId/submission', (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const submission = db.prepare(
    'SELECT * FROM submissions WHERE event_id = ? AND LOWER(display_name) = LOWER(?)'
  ).get(req.params.eventId, name.trim());

  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  res.json(submission);
});

// --- Admin: update event status ---

app.patch('/api/events/admin/:adminCode/status', (req, res) => {
  const { status } = req.body;
  const valid = ['open', 'locked', 'scoring', 'finalized'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const event = db.prepare('SELECT * FROM events WHERE admin_code = ?').get(req.params.adminCode);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  db.prepare('UPDATE events SET status = ? WHERE id = ?').run(status, event.id);

  broadcast(event.id, { type: 'dashboard', ...getEventDashboard(event.id) });
  res.json({ status });
});

// --- Admin: score a question ---

app.patch('/api/events/admin/:adminCode/score', (req, res) => {
  const { questionId, answer, resolved } = req.body;
  const event = db.prepare('SELECT * FROM events WHERE admin_code = ?').get(req.params.adminCode);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const validQ = SCORED_QUESTIONS.find(q => q.id === questionId);
  if (!validQ) return res.status(400).json({ error: 'Invalid question' });

  db.prepare(
    'UPDATE outcomes SET answer = ?, resolved = ? WHERE event_id = ? AND question_id = ?'
  ).run(answer || null, resolved ? 1 : 0, event.id, questionId);

  recalcScores(event.id);

  broadcast(event.id, { type: 'dashboard', ...getEventDashboard(event.id) });
  res.json({ ok: true });
});

// --- Admin: set tie winner ---

app.patch('/api/events/admin/:adminCode/winner', (req, res) => {
  const { winnerName } = req.body;
  const event = db.prepare('SELECT * FROM events WHERE admin_code = ?').get(req.params.adminCode);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  db.prepare('UPDATE events SET tie_winner_name = ? WHERE id = ?').run(winnerName || null, event.id);

  broadcast(event.id, { type: 'dashboard', ...getEventDashboard(event.id) });
  res.json({ ok: true });
});

// --- Admin: CSV export ---

app.get('/api/events/admin/:adminCode/csv', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE admin_code = ?').get(req.params.adminCode);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const submissions = db.prepare(
    'SELECT * FROM submissions WHERE event_id = ? ORDER BY total_points DESC, submitted_at ASC'
  ).all(event.id);

  const headers = [
    'event_name', 'event_date', 'display_name', 'submitted_at',
    ...QUESTIONS.map(q => q.id),
    'total_points', 'winner'
  ];

  const rows = submissions.map(s => [
    event.name, event.date, s.display_name, s.submitted_at,
    ...QUESTIONS.map(q => s[q.id] || ''),
    s.total_points,
    event.tie_winner_name === s.display_name ? 'YES' : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${slugify(event.name)}-results.csv"`);
  res.send(csvContent);
});

// --- Serve static in production ---

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
