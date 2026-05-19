'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  activeBatches: number;
  unpaidFeesCount: number;
  blockedStudentsCount: number;
}

interface JoinRequest {
  id: number;
  studentId: number;
  studentName: string;
  studentGrade: string;
  batchId: number;
  batchName: string;
  batchGrade: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const [data, requestsData] = await Promise.all([
        api.get('/api/admin/dashboard', token),
        api.get('/api/admin/join-requests', token)
      ]);
      setStats(data);
      setJoinRequests(requestsData);
    }
    load();
  }, []);

  async function handleApprove(id: number) {
    try {
      const token = await getToken();
      await api.post(`/api/admin/join-requests/${id}/approve`, {}, token);
      setJoinRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert("Failed to approve request");
    }
  }

  async function handleReject(id: number) {
    try {
      const token = await getToken();
      await api.post(`/api/admin/join-requests/${id}/reject`, {}, token);
      setJoinRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert("Failed to reject request");
    }
  }

  if (!stats) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Overview of your tuition center</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Students</div>
          <div className="stat-value">{stats.totalStudents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Teachers</div>
          <div className="stat-value">{stats.totalTeachers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Parents</div>
          <div className="stat-value">{stats.totalParents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Batches</div>
          <div className="stat-value">{stats.activeBatches}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unpaid Fees</div>
          <div className="stat-value" style={{ color: stats.unpaidFeesCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {stats.unpaidFeesCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Blocked Students</div>
          <div className="stat-value" style={{ color: stats.blockedStudentsCount > 0 ? 'var(--danger)' : 'inherit' }}>
            {stats.blockedStudentsCount}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 600, marginTop: '32px', marginBottom: '16px' }}>Pending Join Requests</h2>
      {joinRequests.length === 0 ? (
        <div className="card empty-state"><p>No pending requests.</p></div>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Grade</th>
                <th>Batch Requested</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {joinRequests.map(req => (
                <tr key={req.id}>
                  <td>{req.studentName}</td>
                  <td>{req.studentGrade}</td>
                  <td>{req.batchName} (Grade {req.batchGrade})</td>
                  <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm btn-primary" onClick={() => handleApprove(req.id)}>Approve</button>
                      <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleReject(req.id)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── System Management (Force Delete) ─── */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginTop: '32px', marginBottom: '16px', color: 'var(--danger)' }}>System Management</h2>
      <div className="card">
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Use this tool to manually remove "ghost" users from the database if they were deleted from Clerk but not from here.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <UserDeleteSection role="TEACHER" title="Teachers" />
          <UserDeleteSection role="STUDENT" title="Students" />
          <UserDeleteSection role="PARENT" title="Parents" />
        </div>
      </div>
    </div>
  );
}

function UserDeleteSection({ role, title }: { role: string, title: string }) {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      const token = await getToken();
      const data = await api.get(`/api/admin/users?role=${role}`, token);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, [role]);

  async function forceDelete(id: number, name: string) {
    if (!confirm(`Are you sure you want to FORCE DELETE ${name}? This will permanently remove them and all their data from the database.`)) return;
    try {
      const token = await getToken();
      await api.delete(`/api/admin/users/${id}`, token);
      await loadUsers();
      alert('User deleted successfully');
    } catch (err) {
      alert('Failed to delete user');
      console.error(err);
    }
  }

  if (loading) return <div style={{ flex: 1, minWidth: '250px' }}><p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading {title}...</p></div>;

  return (
    <div style={{ flex: 1, minWidth: '250px', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>{title} ({users.length})</h3>
      {users.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No {title.toLowerCase()} found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--surface-hover)', borderRadius: '6px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500 }}>{u.fullName || u.email}</p>
                {u.grade && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Grade {u.grade}</p>}
              </div>
              <button className="btn btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '4px 8px' }} onClick={() => forceDelete(u.id, u.fullName || u.email)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
