'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface ScheduleSlot {
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
}

interface Batch {
  id: number;
  name: string;
  grade: string;
  teacherName: string;
  monthlyFee: number;
  schedule: ScheduleSlot[];
}

interface Session {
  id: number;
  topic: string;
  scheduledAt: string;
  status: string;
  googleMeetLink: string;
}

const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function StudentDashboard() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const [sessionsData, batchesData] = await Promise.all([
        api.get('/api/sessions/upcoming', token),
        api.get('/api/batches/my', token),
      ]);
      setSessions(sessionsData);
      setBatches(batchesData);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Student Dashboard</h1>
        <p className="page-subtitle">Your classes and upcoming sessions</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Upcoming Sessions</div>
          <div className="stat-value">{sessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Enrolled Batches</div>
          <div className="stat-value">{batches.length}</div>
        </div>
      </div>

      {/* ─── My Batches ─── */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>My Batches</h2>
      {batches.length === 0 ? (
        <div className="card empty-state" style={{ marginBottom: '24px' }}><p>Not enrolled in any batches yet</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {batches.map(b => (
            <div key={b.id} className="card">
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{b.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Teacher: {b.teacherName}
              </p>
              {b.schedule && b.schedule.length > 0 ? (
                <div style={{ marginBottom: '8px' }}>
                  {b.schedule.map((s, i) => (
                    <span key={i} className="badge" style={{ marginRight: '4px', marginBottom: '4px' }}>
                      {DAY_SHORT[s.dayOfWeek]} {formatTime(s.startTime)}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No schedule</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Upcoming Sessions ─── */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Upcoming Sessions</h2>
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
