'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface StudentQuery {
  id: number;
  subject: string;
  message: string;
  response: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentQueriesPage() {
  const { getToken } = useAuth();
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQueries();
  }, []);

  async function loadQueries() {
    try {
      const token = await getToken();
      const data = await api.get('/api/queries/my', token);
      setQueries(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load queries');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await getToken();
      await api.post('/api/queries', { subject, message }, token);
      setSubject('');
      setMessage('');
      setShowCreate(false);
      await loadQueries();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to submit query');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Help & Queries</h1>
          <p className="page-subtitle">Submit questions to the administration</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Ask a Question</button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="card modal" onClick={e => e.stopPropagation()} style={{ width: '500px', maxWidth: '95vw' }}>
            <h2 className="modal-title">New Query</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="input-label">Subject</label>
                <input 
                  className="input" 
                  placeholder="e.g. Issue with Fee Payment" 
                  required 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="input-label">Message</label>
                <textarea 
                  className="input" 
                  placeholder="Describe your issue or question in detail..." 
                  required 
                  rows={5}
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                />
              </div>
              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowCreate(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {queries.length === 0 ? (
        <div className="card empty-state">
          <p>You haven't submitted any queries yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {queries.map(q => (
            <div key={q.id} className="card" style={{ borderLeft: `4px solid ${q.status === 'RESOLVED' ? 'var(--success)' : 'var(--warning)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{q.subject}</h3>
                <span className={`badge ${q.status === 'RESOLVED' ? 'badge-success' : 'badge-accent'}`}>
                  {q.status}
                </span>
              </div>
              
              <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                {q.message}
              </div>

              {q.status === 'RESOLVED' && q.response && (
                <div style={{ background: '#EDF7F0', border: '1px solid #C8E6C9', padding: '12px', borderRadius: '6px', fontSize: '14px' }}>
                  <strong style={{ display: 'block', color: 'var(--success-hover)', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase' }}>Admin Response:</strong>
                  <span style={{ whiteSpace: 'pre-wrap' }}>{q.response}</span>
                </div>
              )}

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Submitted on {new Date(q.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
