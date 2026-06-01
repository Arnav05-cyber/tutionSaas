'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Batch {
  id: number;
  name: string;
  grade: string;
}

interface BatchDoubt {
  id: number;
  subject: string;
  message: string;
  response: string | null;
  status: string;
  batchId: number;
  batchName: string;
  teacherName: string;
  createdAt: string;
}

export default function StudentBatchDoubtsPage() {
  const { getToken } = useAuth();
  const [doubts, setDoubts] = useState<BatchDoubt[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const token = await getToken();
      const [doubtsData, batchesData] = await Promise.all([
        api.get('/api/batch-doubts/my', token),
        api.get('/api/batches/my', token),
      ]);
      setDoubts(doubtsData);
      setBatches(batchesData);
    } catch (err) {
      console.error(err);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await getToken();
      await api.post('/api/batch-doubts', { batchId: Number(batchId), subject, message }, token);
      setBatchId('');
      setSubject('');
      setMessage('');
      setShowCreate(false);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to submit doubt');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Batch Doubts</h1>
          <p className="page-subtitle">Ask doubts directly to your batch teacher</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
          disabled={batches.length === 0}
        >
          Ask a Doubt
        </button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="card modal" onClick={e => e.stopPropagation()} style={{ width: '500px', maxWidth: '95vw' }}>
            <h2 className="modal-title">New Doubt</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="input-label">Select Batch</label>
                <select
                  className="input"
                  required
                  value={batchId}
                  onChange={e => setBatchId(e.target.value)}
                >
                  <option value="">-- Select a batch --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} (Grade {b.grade})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Subject</label>
                <input
                  className="input"
                  placeholder="e.g. Doubt in Chapter 5 question 3"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Message</label>
                <textarea
                  className="input"
                  placeholder="Describe your doubt in detail..."
                  required
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>
              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowCreate(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Doubt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {doubts.length === 0 ? (
        <div className="card empty-state">
          <p>
            {batches.length === 0
              ? 'You are not enrolled in any batch yet.'
              : "You haven't asked any doubts yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {doubts.map(d => (
            <div key={d.id} className="card" style={{ borderLeft: `4px solid ${d.status === 'RESOLVED' ? 'var(--success)' : 'var(--warning)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{d.subject}</h3>
                <span className={`badge ${d.status === 'RESOLVED' ? 'badge-success' : 'badge-accent'}`}>
                  {d.status}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                {d.batchName} &bull; Teacher: {d.teacherName}
              </div>

              <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                {d.message}
              </div>

              {d.status === 'RESOLVED' && d.response && (
                <div style={{ background: '#EDF7F0', border: '1px solid #C8E6C9', padding: '12px', borderRadius: '6px', fontSize: '14px' }}>
                  <strong style={{ display: 'block', color: 'var(--success-hover)', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase' }}>Teacher Response:</strong>
                  <span style={{ whiteSpace: 'pre-wrap' }}>{d.response}</span>
                </div>
              )}

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Submitted on {new Date(d.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
