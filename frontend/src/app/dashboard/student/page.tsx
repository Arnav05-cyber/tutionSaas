'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatTeacherCode } from '@/lib/teacherCode';

interface ScheduleSlot {
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
}

interface Batch {
  id: number;
  name: string;
  grade: string;
  teacherCode: string | null;
  monthlyFee: number;
  schedule: ScheduleSlot[];
}

interface Session {
  id: number;
  title: string;
  scheduledAt: string;
  status: string;
  googleMeetLink: string;
}

interface DemoClassState {
  available: boolean;
  reason: string | null;
  demoClass: { id: number; title: string; grade: string; scheduledAt: string } | null;
}

const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
};

const DAY_INDEX: Record<string, number> = {
  MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function StudentDashboard() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [demoState, setDemoState] = useState<DemoClassState | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  async function requestJoin(batchId: number) {
    if (joiningId !== null) return; // Prevent double clicks
    setJoiningId(batchId);
    try {
      const token = await getToken();
      await api.post(`/api/batches/${batchId}/join`, {}, token);
      alert('Join request sent successfully!');
      const availableData = await api.get('/api/batches/available', token);
      setAvailableBatches(availableData);
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to send join request'}`);
      // Refresh available batches anyway, just in case they were already enrolled or pending
      try {
        const token = await getToken();
        const availableData = await api.get('/api/batches/available', token);
        setAvailableBatches(availableData);
      } catch (e) {}
    } finally {
      setJoiningId(null);
    }
  }

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const [sessionsData, batchesData, availableData, demoData] = await Promise.all([
        api.get('/api/sessions/upcoming', token),
        api.get('/api/batches/my', token),
        api.get('/api/batches/available', token),
        api.get('/api/demo-classes/available', token).catch(() => null),
      ]);
      setSessions(sessionsData);
      setBatches(batchesData);
      setAvailableBatches(availableData);
      if (demoData) setDemoState(demoData);
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

      {/* ─── Demo Class Banner ─── */}
      {demoState?.available && demoState.demoClass && (
        <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', marginBottom: '2px' }}>FREE DEMO CLASS AVAILABLE</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{demoState.demoClass.title}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {new Date(demoState.demoClass.scheduledAt).toLocaleString()} &mdash; Grade {demoState.demoClass.grade}th
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard/student/demo-class')}>
            View Demo Class
          </button>
        </div>
      )}

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
                Teacher: {formatTeacherCode(b.teacherCode)}
              </p>
              {b.schedule && b.schedule.length > 0 ? (
                <div style={{ marginBottom: '8px' }}>
                  {[...b.schedule].sort((a, b) => DAY_INDEX[a.dayOfWeek] - DAY_INDEX[b.dayOfWeek]).map((s, i) => (
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

      {/* ─── Available Batches ─── */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', marginTop: '32px' }}>Available Batches</h2>
      {availableBatches.length === 0 ? (
        <div className="card empty-state" style={{ marginBottom: '24px' }}><p>No new available batches for your grade right now.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {availableBatches.map(b => (
            <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{b.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Teacher: {formatTeacherCode(b.teacherCode)}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Fee: ₹{b.monthlyFee}/month
                </p>
                {b.schedule && b.schedule.length > 0 ? (
                  <div style={{ marginBottom: '16px' }}>
                    {[...b.schedule].sort((a, b) => DAY_INDEX[a.dayOfWeek] - DAY_INDEX[b.dayOfWeek]).map((s, i) => (
                      <span key={i} className="badge" style={{ marginRight: '4px', marginBottom: '4px' }}>
                        {DAY_SHORT[s.dayOfWeek]} {formatTime(s.startTime)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>No schedule</p>
                )}
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => requestJoin(b.id)}
                disabled={joiningId === b.id}
              >
                {joiningId === b.id ? 'Requesting...' : 'Request to Join'}
              </button>
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
                    <td style={{ fontWeight: 500 }}>{s.title || 'Untitled'}</td>
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
