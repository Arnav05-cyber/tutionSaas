'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Session {
  id: number;
  topic: string;
  scheduledAt: string;
  status: string;
  googleMeetLink: string;
}

export default function StudentDashboard() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const data = await api.get('/api/sessions/upcoming', token);
      setSessions(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Student Dashboard</h1>
        <p className="page-subtitle">Your upcoming sessions</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Upcoming Sessions</div>
          <div className="stat-value">{sessions.length}</div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="card empty-state"><p>No upcoming sessions</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.topic || 'Untitled'}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(s.scheduledAt).toLocaleString()}
                    </td>
                    <td>
                      <Link href={`/dashboard/student/sessions`} className="btn btn-sm btn-primary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
