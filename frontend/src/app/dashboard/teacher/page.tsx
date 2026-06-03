'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatTeacherCode } from '@/lib/teacherCode';

interface Batch {
  id: number;
  name: string;
  subject: string;
  grade: string;
  studentCount: number;
  active: boolean;
}

interface UserData {
  teacherCode: string | null;
}

interface DemoClass {
  id: number;
  title: string;
  grade: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  enrolledCount: number;
  capacity: number;
  platform: string;
  internalRoomId: string | null;
  googleMeetLink: string | null;
}

export default function TeacherDashboard() {
  const { getToken } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [democlasses, setDemoClasses] = useState<DemoClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const [batchData, userData, demoData] = await Promise.all([
        api.get('/api/batches/my', token),
        api.get('/api/users/me', token),
        api.get('/api/teacher/demo-classes', token).catch(() => []),
      ]);
      setBatches(batchData);
      setUser(userData);
      setDemoClasses(demoData);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          {user?.teacherCode
            ? `Welcome ${formatTeacherCode(user.teacherCode)}!`
            : 'Teacher Dashboard'}
        </h1>
        <p className="page-subtitle">Your batches and sessions</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Batches</div>
          <div className="stat-value">{batches.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{batches.reduce((sum, b) => sum + (b.studentCount || 0), 0)}</div>
        </div>
      </div>

      {/* ─── Demo Classes ─── */}
      {democlasses.filter(d => d.status === 'SCHEDULED').length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Upcoming Demo Classes</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Grade</th>
                  <th>Date & Time</th>
                  <th>Enrolled</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {democlasses.filter(d => d.status === 'SCHEDULED').map(dc => (
                  <tr key={dc.id}>
                    <td style={{ fontWeight: 500 }}>{dc.title}</td>
                    <td>{dc.grade}th</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(dc.scheduledAt).toLocaleString()}</td>
                    <td>{dc.enrolledCount} / {dc.capacity}</td>
                    <td>
                      {dc.platform === 'INTERNAL' && dc.internalRoomId ? (
                        <Link href={`/dashboard/live/demo/${dc.id}`} className="btn btn-sm btn-primary">Join</Link>
                      ) : dc.googleMeetLink ? (
                        <a href={dc.googleMeetLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">Join</a>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No link yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>My Batches</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Subject</th>
                <th>Grade</th>
                <th>Students</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 && (
                <tr><td colSpan={5} className="empty-state"><p>No batches yet</p></td></tr>
              )}
              {batches.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.name}</td>
                  <td>{b.subject}</td>
                  <td>{b.grade}</td>
                  <td>{b.studentCount}</td>
                  <td>
                    <Link href={`/dashboard/teacher/batches/${b.id}`} className="btn btn-sm">
                      View
                    </Link>
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
