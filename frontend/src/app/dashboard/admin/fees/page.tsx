'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface FeeStatus {
  studentId: number;
  studentName: string;
  email: string;
  grade: string;
  feesPaid: boolean;
  blocked: boolean;
  batchNames: string[];
}

export default function FeesPage() {
  const { getToken } = useAuth();
  const [students, setStudents] = useState<FeeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => { loadFees(); }, []);

  async function loadFees() {
    const token = await getToken();
    const data = await api.get('/api/admin/fees', token);
    setStudents(data);
    setLoading(false);
  }

  async function toggleBlock(studentId: number, isBlocked: boolean) {
    setActionLoading(studentId);
    try {
      const token = await getToken();
      const endpoint = isBlocked
        ? `/api/admin/students/${studentId}/unblock`
        : `/api/admin/students/${studentId}/block`;
      await api.put(endpoint, {}, token);
      await loadFees();
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Fee Status</h1>
        <p className="page-subtitle">Track which students have paid their fees</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Grade</th>
                <th>Batches</th>
                <th>Fees</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr><td colSpan={7} className="empty-state"><p>No students found</p></td></tr>
              )}
              {students.map(s => (
                <tr key={s.studentId}>
                  <td style={{ fontWeight: 500 }}>{s.studentName}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{s.email}</td>
                  <td>{s.grade || '—'}</td>
                  <td style={{ fontSize: '13px' }}>{s.batchNames.join(', ') || '—'}</td>
                  <td>
                    <span className={`badge ${s.feesPaid ? 'badge-success' : 'badge-danger'}`}>
                      {s.feesPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td>
                    {s.blocked && <span className="badge badge-danger">Blocked</span>}
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${s.blocked ? '' : 'btn-danger'}`}
                      onClick={() => toggleBlock(s.studentId, s.blocked)}
                      disabled={actionLoading === s.studentId}
                    >
                      {actionLoading === s.studentId ? '...' : s.blocked ? 'Unblock' : 'Block'}
                    </button>
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
