export function computeWinner(submissions, tieWinnerName) {
  if (!submissions || submissions.length === 0) return null;

  if (tieWinnerName) {
    const found = submissions.find(s => s.display_name === tieWinnerName);
    if (found) return found;
  }

  const sorted = [...submissions].sort((a, b) =>
    b.total_points - a.total_points || new Date(a.submitted_at) - new Date(b.submitted_at)
  );
  return sorted[0];
}
