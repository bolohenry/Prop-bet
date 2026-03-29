import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { getSubmissions, getOutcomes } from './api';

export function useRealtimeDashboard(eventId) {
  const [submissions, setSubmissions] = useState(null);
  const [outcomes, setOutcomes] = useState(null);
  const [event, setEvent] = useState(null);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    const [subs, outs] = await Promise.all([
      getSubmissions(eventId),
      getOutcomes(eventId),
    ]);
    setSubmissions(subs);
    setOutcomes(outs);
  }, [eventId]);

  const refreshEvent = useCallback(async () => {
    if (!eventId) return;
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    if (data) setEvent(data);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    refresh();
    refreshEvent();

    const channel = supabase
      .channel(`dashboard-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: `event_id=eq.${eventId}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outcomes', filter: `event_id=eq.${eventId}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eventId}` }, () => {
        refresh();
        refreshEvent();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, refresh, refreshEvent]);

  return { submissions, outcomes, event };
}
