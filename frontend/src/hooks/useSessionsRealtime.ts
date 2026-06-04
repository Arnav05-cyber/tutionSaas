'use client';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

function toEndTime(scheduledAt: string, durationMinutes: number): string {
  const end = new Date(scheduledAt);
  end.setMinutes(end.getMinutes() + durationMinutes);
  return end.toISOString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySetter = (updater: any) => void;

/**
 * Subscribes to Supabase Realtime changes on the ClassSession table.
 *
 * For batch-specific pages: pass batchId + batchName → INSERT events add the
 * new session directly to state (deduped against loadData() results).
 *
 * For overview pages: pass onInsert → INSERT events trigger a full data refetch,
 * UPDATE/DELETE are applied in-place.
 */
export function useSessionsRealtime(
  setSessions: AnySetter,
  opts: {
    batchId?: number;
    batchName?: string;
    onInsert?: () => void;
  } = {}
) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const batchId = optsRef.current.batchId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelFilter: Record<string, any> = {
      event: '*',
      schema: 'public',
      table: 'ClassSession',
    };
    if (batchId != null) {
      channelFilter['filter'] = `batchId=eq.${batchId}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = supabase
      .channel(`class-sessions-${batchId ?? 'global'}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes', channelFilter as any, (payload: any) => {
        const { batchName = '', onInsert } = optsRef.current;

        if (payload.eventType === 'INSERT') {
          if (onInsert) { onInsert(); return; }
          const r = payload.new;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSessions((prev: any[]) => {
            if (prev.some((s: any) => s.id === r.id)) return prev;
            return [{
              id: r.id,
              batchId: r.batchId,
              title: r.title,
              scheduledAt: r.scheduledAt,
              endTime: toEndTime(r.scheduledAt, r.durationMinutes ?? 60),
              durationMinutes: r.durationMinutes,
              status: r.status,
              googleMeetLink: r.googleMeetLink,
              platform: r.platform,
              internalRoomId: r.internalRoomId,
              batchName,
            }, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const r = payload.new;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSessions((prev: any[]) =>
            prev.map((s: any) =>
              s.id === r.id
                ? {
                    ...s,
                    title: r.title,
                    scheduledAt: r.scheduledAt,
                    endTime: toEndTime(r.scheduledAt, r.durationMinutes ?? 60),
                    durationMinutes: r.durationMinutes,
                    status: r.status,
                    googleMeetLink: r.googleMeetLink,
                    platform: r.platform,
                    internalRoomId: r.internalRoomId,
                  }
                : s
            )
          );
        } else if (payload.eventType === 'DELETE') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSessions((prev: any[]) => prev.filter((s: any) => s.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // Re-subscribe only when batchId changes (e.g. client-side navigation between batches)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.batchId]);
}
