'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Batch {
  id: number;
  name: string;
  subject: string;
}

export default function StudentAttendancePage() {
  const { getToken } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const data = await api.get('/api/batches/student', token);
      setBatches(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle">Attendance per batch</p>
      </div>

      {batches.length === 0 ? (
        <div className="card empty-state"><p>You are not enrolled in any batches yet</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {batches.map(b => (
            <AttendanceCard key={b.id} batch={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function AttendanceCard({ batch }: { batch: Batch }) {
  const { getToken } = useAuth();
  const [summary, setSummary] = useState<{ totalSessions: number; attendedSessions: number; percentage: number } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const me = await api.get('/api/users/me', token);
        const data = await api.get(`/api/batches/${batch.id}/students/${me.id}/attendance`, token);
        setSummary(data);
      } catch {
        // Teacher may need to check this — student might not have access
      }
    }
    load();
  }, [batch.id]);

  return (
    <div className="card">
      <h3 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>{batch.name}</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>{batch.subject}</p>
      {summary ? (
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sessions</span>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>{summary.totalSessions}</div>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Attended</span>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>{summary.attendedSessions}</div>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Percentage</span>
            <div style={{ fontSize: '20px', fontWeight: 600, color: summary.percentage >= 75 ? 'var(--success)' : 'var(--danger)' }}>
              {summary.percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading...</p>
      )}
    </div>
  );
}
