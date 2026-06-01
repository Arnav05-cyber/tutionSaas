'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface BatchDoubt {
  id: number;
  subject: string;
  message: string;
  response: string | null;
  status: string;
  studentId: number;
  studentName: string;
  batchId: number;
  batchName: string;
  createdAt: string;
}

export default function TeacherDoubtsPage() {
  const { getToken } = useAuth();
  const [doubts, setDoubts] = useState<BatchDoubt[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDoubt, setSelectedDoubt] = useState<BatchDoubt | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDoubts();
  }, []);

  async function loadDoubts() {
    try {
      const token = await getToken();
      const data = await api.get('/api/batch-doubts/teacher', token);
      setDoubts(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load doubts');
    } finally {
      setLoading(false);
    }
  }

  function openRespondModal(doubt: BatchDoubt) {
    setSelectedDoubt(doubt);
    setResponseMessage(doubt.response || '');
  }

  async function handleRespond(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDoubt) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await api.patch(`/api/batch-doubts/${selectedDoubt.id}/respond`, { response: responseMessage }, token);
      setSelectedDoubt(null);
      setResponseMessage('');
      await loadDoubts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const openDoubts = doubts.filter(d => d.status === 'OPEN');
  const resolvedDoubts = doubts.filter(d => d.status === 'RESOLVED');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Student Doubts</h1>
        <p className="page-subtitle">Doubts from students in your batches</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Open Doubts</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{openDoubts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolved</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{resolvedDoubts.length}</div>
        </div>
      </div>

      {selectedDoubt && (
        <div className="modal-overlay" onClick={() => setSelectedDoubt(null)}>
          <div className="card modal" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '95vw' }}>
            <h2 className="modal-title">Respond to Doubt</h2>

            <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                From: <strong>{selectedDoubt.studentName}</strong> &bull; Batch: <strong>{selectedDoubt.batchName}</strong>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{selectedDoubt.subject}</h3>
              <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{selectedDoubt.message}</p>
            </div>

            <form onSubmit={handleRespond}>
              <div className="form-group">
                <label className="input-label">Your Response</label>
                <textarea
                  className="input"
                  placeholder="Type your answer here..."
                  required
                  rows={6}
                  value={responseMessage}
                  onChange={e => setResponseMessage(e.target.value)}
                />
              </div>
              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setSelectedDoubt(null)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Response & Resolve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {doubts.length === 0 ? (
        <div className="card empty-state">
          <p>No student doubts yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {doubts.map(d => (
            <div key={d.id} className="card" style={{ borderLeft: `4px solid ${d.status === 'RESOLVED' ? 'var(--success)' : 'var(--danger)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{d.subject}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    From {d.studentName} &bull; {d.batchName} &bull; {new Date(d.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${d.status === 'RESOLVED' ? 'badge-success' : 'badge-danger'}`}>
                    {d.status}
                  </span>
                  <button
                    className={`btn btn-sm ${d.status === 'OPEN' ? 'btn-primary' : ''}`}
                    onClick={() => openRespondModal(d)}
                  >
                    {d.status === 'OPEN' ? 'Respond' : 'View / Edit'}
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {d.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
