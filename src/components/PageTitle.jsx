import { useEffect } from 'react';

export default function PageTitle({ title }) {
  useEffect(() => {
    const base = 'Wedding prop bets';
    document.title = title ? `${title} — ${base}` : base;
    return () => { document.title = base; };
  }, [title]);

  return null;
}
