'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface StudentQuery {
  id: number;
  studentId: number;
  studentName: string;
  subject: string;
  message: string;
  response: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminQueriesPage() {
  const { getToken } = useAuth();
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedQuery, setSelectedQuery] = useState<StudentQuery | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQueries();
  }, []);

  async function loadQueries() {
    try {
      const token = await getToken();
      const data = await api.get('/api/queries', token);
      setQueries(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load queries');
    } finally {
      setLoading(false);
    }
  }

  function openRespondModal(query: StudentQuery) {
    setSelectedQuery(query);
    setResponseMessage(query.response || '');
  }

  async function handleRespond(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedQuery) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await api.patch(`/api/queries/${selectedQuery.id}/respond`, { response: responseMessage }, token);
      setSelectedQuery(null);
      setResponseMessage('');
      await loadQueries();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const openQueries = queries.filter(q => q.status === 'OPEN');
  const resolvedQueries = queries.filter(q => q.status === 'RESOLVED');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Student Queries</h1>
        <p className="page-subtitle">Manage and respond to help requests from students</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Open Queries</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{openQueries.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolved</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{resolvedQueries.length}</div>
        </div>
      </div>

      {selectedQuery && (
        <div className="modal-overlay" onClick={() => setSelectedQuery(null)}>
          <div className="card modal" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '95vw' }}>
            <h2 className="modal-title">Respond to Query</h2>
            
            <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>From: <strong>{selectedQuery.studentName}</strong></div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{selectedQuery.subject}</h3>
              <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{selectedQuery.message}</p>
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
                <button type="button" className="btn" onClick={() => setSelectedQuery(null)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Response & Resolve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {queries.length === 0 ? (
        <div className="card empty-state">
          <p>No queries found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {queries.map(q => (
            <div key={q.id} className="card" style={{ borderLeft: `4px solid ${q.status === 'RESOLVED' ? 'var(--success)' : 'var(--danger)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{q.subject}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>From {q.studentName} • {new Date(q.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${q.status === 'RESOLVED' ? 'badge-success' : 'badge-danger'}`}>
                    {q.status}
                  </span>
                  <button className={`btn btn-sm ${q.status === 'OPEN' ? 'btn-primary' : ''}`} onClick={() => openRespondModal(q)}>
                    {q.status === 'OPEN' ? 'Respond' : 'View / Edit'}
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {q.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
