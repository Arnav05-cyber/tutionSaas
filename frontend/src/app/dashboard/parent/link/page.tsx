'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ParentLinkPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      await api.post('/api/parent/link', { linkCode: code.toUpperCase().trim() }, token);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/parent'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to link student');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Link a Student</h1>
        <p className="page-subtitle">Enter the 6-character code your child shared with you</p>
      </div>

      <div className="card" style={{ maxWidth: '440px' }}>
        {success ? (
          <div className="alert alert-success">Student linked successfully. Redirecting...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="input-label">Link Code</label>
              <input
                className="input"
                required
                maxLength={6}
                placeholder="e.g. A3X9K2"
                value={code}
                onChange={e => setCode(e.target.value)}
                style={{ fontSize: '18px', letterSpacing: '3px', textAlign: 'center', fontFamily: 'monospace' }}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading || code.trim().length !== 6} style={{ width: '100%' }}>
                {loading ? 'Linking...' : 'Link Student'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
