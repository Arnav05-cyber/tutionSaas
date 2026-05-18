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
    </div>
  );
}
