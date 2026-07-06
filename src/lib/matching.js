export function isSimilarName(candidateName, typedName) {
  const a = (candidateName || '').trim().toLowerCase();
  const b = (typedName || '').trim().toLowerCase();
  if (!a || !b) return false;
  if (a === b) return false;
  return a.includes(b) || b.includes(a);
}
