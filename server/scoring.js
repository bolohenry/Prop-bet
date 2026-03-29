import db from './db.js';
import { SCORED_QUESTIONS } from '../shared/questions.js';

export function recalcScores(eventId) {
  const outcomes = db.prepare(
    'SELECT question_id, answer FROM outcomes WHERE event_id = ? AND resolved = 1'
  ).all(eventId);

  const outcomeMap = Object.fromEntries(outcomes.map(o => [o.question_id, o.answer]));

  const submissions = db.prepare(
    'SELECT id, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14 FROM submissions WHERE event_id = ?'
  ).all(eventId);

  const updateStmt = db.prepare('UPDATE submissions SET total_points = ? WHERE id = ?');

  const tx = db.transaction(() => {
    for (const sub of submissions) {
      let points = 0;
      for (const q of SCORED_QUESTIONS) {
        const correct = outcomeMap[q.id];
        if (correct !== undefined && sub[q.id] === correct) {
          points++;
        }
      }
      updateStmt.run(points, sub.id);
    }
  });

  tx();
}
