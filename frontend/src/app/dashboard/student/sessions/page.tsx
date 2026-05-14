'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Session {
  id: number;
  topic: string;
  scheduledAt: string;
  status: string;
  googleMeetLink: string;
}

export default function StudentSessionsPage() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const data = await api.get('/api/sessions/upcoming', token);
      setSessions(data);
      setLoading(false);
    }
    load();
  }, []);

  async function joinSession(sessionId: number) {
    setJoining(sessionId);
    try {
      const token = await getToken();
      const result = await api.post(`/api/sessions/${sessionId}/join`, {}, token);
      // Open meet link in new tab
      if (result.meetLink) {
        window.open(result.meetLink, '_blank');
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
          {sessions.map(s => (
            <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 500 }}>{s.topic || 'Untitled Session'}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {new Date(s.scheduledAt).toLocaleString()}
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => joinSession(s.id)}
                disabled={joining === s.id}
              >
                {joining === s.id ? 'Joining...' : 'Join Class'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
