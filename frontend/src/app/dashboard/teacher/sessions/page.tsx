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
  batchName: string;
}

export default function TeacherSessionsPage() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const batches = await api.get('/api/batches/my', token);
      const allSessions: Session[] = [];
      for (const batch of batches) {
        const batchSessions = await api.get(`/api/batches/${batch.id}/sessions`, token);
        allSessions.push(...batchSessions.map((s: Session) => ({ ...s, batchName: batch.name })));
      }
      allSessions.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
      setSessions(allSessions);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">All Sessions</h1>
        <p className="page-subtitle">Sessions across all your batches</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Topic</th>
                <th>Batch</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr><td colSpan={4} className="empty-state"><p>No sessions yet</p></td></tr>
              )}
              {sessions.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.topic || 'Untitled'}</td>
                  <td style={{ fontSize: '13px' }}>{s.batchName}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(s.scheduledAt).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${s.status === 'COMPLETED' ? 'badge-success' : s.status === 'CANCELLED' ? 'badge-danger' : 'badge-accent'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
