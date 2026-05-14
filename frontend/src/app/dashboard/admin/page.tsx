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

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const data = await api.get('/api/admin/dashboard', token);
      setStats(data);
    }
    load();
  }, []);

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
    </div>
  );
}
