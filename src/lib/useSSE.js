import { useEffect, useRef, useState, useCallback } from 'react';

export function useSSE(eventId) {
  const [dashboard, setDashboard] = useState(null);
  const esRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!eventId) return;

    function connect() {
      if (!mountedRef.current) return;

      const es = new EventSource(`/sse/events/${eventId}`);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'dashboard' && mountedRef.current) {
            setDashboard(data);
          }
        } catch {}
      };

      es.onerror = () => {
        es.close();
        if (mountedRef.current) {
          setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [eventId]);

  return dashboard;
}
