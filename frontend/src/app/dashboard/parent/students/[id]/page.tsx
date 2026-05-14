'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

interface FeeStatus {
  studentId: number;
  feesPaidForCurrentMonth: boolean;
}

interface AttendanceSummary {
  totalSessions: number;
  attendedSessions: number;
  percentage: number;
}

interface Batch {
  id: number;
  name: string;
  subject: string;
}

export default function ParentStudentDetailPage() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [feeStatus, setFeeStatus] = useState<FeeStatus | null>(null);
  const [batches, setBatches] = useState<(Batch & { attendance?: AttendanceSummary })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken();

      // Get fee status
      const fees = await api.get(`/api/parent/students/${id}/fees`, token);
      setFeeStatus(fees);

      // We don't have a direct endpoint for parent to list student batches
      // So we'll show fee status for now; attendance can be added per batch
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Student Details</h1>
        <p className="page-subtitle">Fee and attendance information</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Current Month Fees</div>
          <div className="stat-value" style={{
            color: feeStatus?.feesPaidForCurrentMonth ? 'var(--success)' : 'var(--danger)',
          }}>
            {feeStatus?.feesPaidForCurrentMonth ? 'Paid' : 'Unpaid'}
          </div>
        </div>
      </div>

      <div className="card">
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Detailed attendance per batch will be available once the student is enrolled in batches.
          Contact the administration for more details.
        </p>
      </div>
    </div>
  );
}
