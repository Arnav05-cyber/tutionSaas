'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

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

function formatTeacherCode(code: string): string {
  // "edusha_av" → "Edusha_AV"
  const parts = code.split('_');
  if (parts.length < 2) return code;
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + '_' + parts[1].toUpperCase();
}

export default function TeacherDashboard() {
  const { getToken } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const [batchData, userData] = await Promise.all([
        api.get('/api/batches/my', token),
        api.get('/api/users/me', token),
      ]);
      setBatches(batchData);
      setUser(userData);
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
