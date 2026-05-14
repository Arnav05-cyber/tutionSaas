'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface LinkedStudent {
  studentId: number;
  studentName: string;
  email: string;
  grade: string;
  feesPaid: boolean;
  blocked: boolean;
}

export default function ParentDashboard() {
  const { getToken } = useAuth();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const data = await api.get('/api/parent/students', token);
      setStudents(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Parent Dashboard</h1>
        <p className="page-subtitle">Track your children&apos;s progress</p>
      </div>

      {students.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            No students linked yet. Ask your child for their 6-character link code.
          </p>
          <Link href="/dashboard/parent/link" className="btn btn-primary">
            Link a Student
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {students.map(s => (
            <Link key={s.studentId} href={`/dashboard/parent/students/${s.studentId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{s.studentName}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Grade {s.grade} — {s.email}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`badge ${s.feesPaid ? 'badge-success' : 'badge-danger'}`}>
                    {s.feesPaid ? 'Fees Paid' : 'Fees Unpaid'}
                  </span>
                  {s.blocked && <span className="badge badge-danger">Blocked</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
