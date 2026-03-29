import { useEffect, useRef, useState } from 'react';

export function useSSE(eventId) {
  const [dashboard, setDashboard] = useState(null);
  const esRef = useRef(null);

  useEffect(() => {
    if (!eventId) return;

    const es = new EventSource(`/sse/events/${eventId}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'dashboard') {
          setDashboard(data);
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      setTimeout(() => {
        if (esRef.current === es) {
          esRef.current = new EventSource(`/sse/events/${eventId}`);
          esRef.current.onmessage = es.onmessage;
        }
      }, 3000);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [eventId]);

  return dashboard;
}
