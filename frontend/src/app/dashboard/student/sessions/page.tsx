'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Session {
  id: number;
  title: string;
  scheduledAt: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  googleMeetLink: string;
  platform: string;
  batchName: string;
}

function isSessionActive(session: Session, now: Date) {
  const start = new Date(session.scheduledAt);
  const end = new Date(session.endTime);
  const earlyStart = new Date(start.getTime() - 15 * 60000); // 15 mins early
  return now >= earlyStart && now <= end;
}

function getTimeUntil(session: Session, now: Date) {
  const start = new Date(session.scheduledAt);
  const earlyStart = new Date(start.getTime() - 15 * 60000);
  const diff = earlyStart.getTime() - now.getTime();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `Opens in ${hours}h ${minutes}m`;
  return `Opens in ${minutes}m`;
}

export default function StudentSessionsPage() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const data = await api.get('/api/sessions/upcoming', token);
      setSessions(data);
      setLoading(false);
    }
    load();
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  async function joinSession(session: Session) {
    if (session.platform === 'LIVEKIT') {
      window.open(`/dashboard/live/${session.id}`, '_blank');
      return;
    }

    setJoining(session.id);
    try {
      const token = await getToken();
      const result = await api.post(`/api/sessions/${session.id}/join`, {}, token);
      if (result.googleMeetLink) {
        window.open(result.googleMeetLink, '_blank');
      } else {
        alert('Meeting link not available yet');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setJoining(null);
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Sessions</h1>
        <p className="page-subtitle">Click Join Class to open the meeting link</p>
      </div>

      {sessions.length === 0 ? (
        <div className="card empty-state"><p>No upcoming sessions</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map(s => {
            const active = isSessionActive(s, now);
            const timeUntil = getTimeUntil(s, now);

            return (
              <div key={s.id} className="card card-flex" style={active ? { borderLeft: '3px solid var(--success)' } : {}}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 500 }}>{s.title || 'Untitled Session'}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {s.batchName && <span>{s.batchName} · </span>}
                    {new Date(s.scheduledAt).toLocaleString()} — {s.durationMinutes} min
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {active && (
                    <>
                      <span className="badge badge-success">● LIVE</span>
                      <button
                        className="btn btn-primary"
                        onClick={() => joinSession(s)}
                        disabled={joining === s.id}
                      >
                        {joining === s.id ? 'Joining...' : 'Join Class'}
                      </button>
                    </>
                  )}
                  {!active && timeUntil && (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {timeUntil}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
