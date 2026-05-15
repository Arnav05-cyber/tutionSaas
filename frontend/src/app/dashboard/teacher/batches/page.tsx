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
        <p className="page-subtitle">Manage your batches and sessions</p>
      </div>

      {batches.length === 0 ? (
        <div className="card empty-state"><p>No batches yet. Ask the admin to create one.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {batches.map(b => (
            <Link key={b.id} href={`/dashboard/teacher/batches/${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{b.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {b.subject} — Grade {b.grade}
                </p>
                <span className="badge">{b.studentCount} students</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
