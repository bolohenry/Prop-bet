/**
 * Convert a time string like "11:30 PM" to minutes-since-9PM.
 * 9:00 PM = 0, 10:00 PM = 60, 12:00 AM = 180, 4:00 AM = 420.
 * This normalizes the overnight wrap so all times sort correctly.
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  // Convert to 24-hour
  if (period === 'AM' && hour === 12) hour = 0;
  else if (period === 'PM' && hour !== 12) hour += 12;

  // Normalize to minutes-since-9PM (21:00)
  // 21:00 = 0, 22:00 = 60, ..., 23:00 = 120, 0:00 = 180, ..., 4:00 = 420
  let minutes = (hour * 60 + min) - (21 * 60);
  if (minutes < 0) minutes += 24 * 60;

  return minutes;
}

/**
 * Price Is Right rules: closest guess that is AT or AFTER the correct answer.
 * "Going over" means guessing BEFORE the actual time (too early).
 * If nobody guessed at or after, fall back to closest overall.
 *
 * Returns the display_name of the winner, or null.
 */
export function computeTieBreakerWinner(correctTime, submissions) {
  if (!correctTime || !submissions || submissions.length === 0) return null;

  const correctMin = timeToMinutes(correctTime);
  if (correctMin === null) return null;

  const candidates = submissions
    .map(s => ({
      name: s.display_name,
      minutes: timeToMinutes(s.q15 || s.answers?.q15),
    }))
    .filter(c => c.minutes !== null);

  if (candidates.length === 0) return null;

  // "At or after" means guess >= correct (they guessed the same time or later)
  const atOrAfter = candidates
    .filter(c => c.minutes >= correctMin)
    .sort((a, b) => a.minutes - b.minutes);

  if (atOrAfter.length > 0) {
    return atOrAfter[0].name;
  }

  // Fallback: everyone guessed too early, pick closest overall
  const sorted = [...candidates].sort(
    (a, b) => Math.abs(a.minutes - correctMin) - Math.abs(b.minutes - correctMin)
  );
  return sorted[0].name;
}
