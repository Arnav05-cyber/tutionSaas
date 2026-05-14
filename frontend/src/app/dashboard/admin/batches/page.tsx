'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Batch {
  id: number;
  name: string;
  subject: string;
  grade: string;
  monthlyFee: number;
  active: boolean;
  studentCount: number;
}

export default function AdminBatchesPage() {
  const { getToken } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [feeValue, setFeeValue] = useState('');

  useEffect(() => { loadBatches(); }, []);

  async function loadBatches() {
    const token = await getToken();
    const data = await api.get('/api/batches', token);
    setBatches(data);
    setLoading(false);
  }

  async function saveFee(batchId: number) {
    const token = await getToken();
    await api.put(`/api/admin/batches/${batchId}/fee`, { monthlyFee: parseFloat(feeValue) || 0 }, token);
    setEditId(null);
    setFeeValue('');
    await loadBatches();
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Batches</h1>
        <p className="page-subtitle">View all batches and set monthly fees</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Subject</th>
                <th>Grade</th>
                <th>Students</th>
                <th>Monthly Fee</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 && (
                <tr><td colSpan={6} className="empty-state"><p>No batches found</p></td></tr>
              )}
              {batches.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.name}</td>
                  <td>{b.subject}</td>
                  <td>{b.grade}</td>
                  <td>{b.studentCount}</td>
                  <td>
                    {editId === b.id ? (
                      <input
                        className="input"
                        style={{ width: '100px' }}
                        type="number"
                        value={feeValue}
                        onChange={e => setFeeValue(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span>{b.monthlyFee > 0 ? `₹${b.monthlyFee}` : 'Not set'}</span>
                    )}
                  </td>
                  <td>
                    {editId === b.id ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => saveFee(b.id)}>Save</button>
                        <button className="btn btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm"
                        onClick={() => { setEditId(b.id); setFeeValue(String(b.monthlyFee || '')); }}
                      >
                        Set Fee
                      </button>
                    )}
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
