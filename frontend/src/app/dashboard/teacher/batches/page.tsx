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
  studentCount: number;
  schedule: ScheduleSlot[];
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

export default function TeacherBatchesPage() {
  const { getToken } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const data = await api.get('/api/batches/my', token);
      setBatches(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Batches</h1>
        <p className="page-subtitle">View your assigned batches and manage sessions</p>
      </div>

      {batches.length === 0 ? (
        <div className="card empty-state"><p>No batches assigned to you yet. The admin will assign batches.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {batches.map(b => (
            <Link key={b.id} href={`/dashboard/teacher/batches/${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{b.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Grade {b.grade}
                </p>
                {b.schedule && b.schedule.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    {b.schedule.map((s, i) => (
                      <span key={i} className="badge" style={{ marginRight: '4px', marginBottom: '4px' }}>
                        {DAY_SHORT[s.dayOfWeek]} {formatTime(s.startTime)}
                      </span>
                    ))}
                  </div>
                )}
                <span className="badge badge-accent">{b.studentCount} students</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
