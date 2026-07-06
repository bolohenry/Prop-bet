import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeWinner } from './winner.js';

test('returns null for empty or missing submissions', () => {
  assert.equal(computeWinner([], null), null);
  assert.equal(computeWinner(null, null), null);
});

test('returns the single submission when there is only one', () => {
  const subs = [{ display_name: 'Bob', total_points: 5, submitted_at: '2026-01-01T00:00:00Z' }];
  assert.equal(computeWinner(subs, null), subs[0]);
});

test('returns the highest scorer when there is no tie', () => {
  const subs = [
    { display_name: 'Bob', total_points: 5, submitted_at: '2026-01-01T00:00:00Z' },
    { display_name: 'Alice', total_points: 9, submitted_at: '2026-01-01T00:00:01Z' },
  ];
  assert.equal(computeWinner(subs, null).display_name, 'Alice');
});

test('breaks ties by earliest submitted_at when no tieWinnerName is given', () => {
  const subs = [
    { display_name: 'Bob', total_points: 9, submitted_at: '2026-01-01T00:00:05Z' },
    { display_name: 'Alice', total_points: 9, submitted_at: '2026-01-01T00:00:01Z' },
  ];
  assert.equal(computeWinner(subs, null).display_name, 'Alice');
});

test('prefers the explicit tieWinnerName over score/date sorting', () => {
  const subs = [
    { display_name: 'Bob', total_points: 9, submitted_at: '2026-01-01T00:00:05Z' },
    { display_name: 'Alice', total_points: 9, submitted_at: '2026-01-01T00:00:01Z' },
  ];
  assert.equal(computeWinner(subs, 'Bob').display_name, 'Bob');
});

test('falls back to score/date sorting if tieWinnerName does not match any submission', () => {
  const subs = [
    { display_name: 'Bob', total_points: 9, submitted_at: '2026-01-01T00:00:05Z' },
    { display_name: 'Alice', total_points: 9, submitted_at: '2026-01-01T00:00:01Z' },
  ];
  assert.equal(computeWinner(subs, 'Someone Else').display_name, 'Alice');
});
