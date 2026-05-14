'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import api from '@/lib/api';

export default function LinkCodePage() {
  const { getToken } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateCode() {
    setLoading(true);
    try {
      const token = await getToken();
      const result = await api.post('/api/users/generate-link-code', {}, token);
      setCode(result.linkCode);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Parent Link Code</h1>
        <p className="page-subtitle">Generate a code and share it with your parent so they can track your attendance and fees</p>
      </div>

      <div className="card" style={{ maxWidth: '440px' }}>
        {code ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Share this code with your parent
            </p>
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '4px',
              fontFamily: 'monospace',
              padding: '16px',
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              marginBottom: '16px',
            }}>
              {code}
            </div>
            <button className="btn" onClick={copyCode}>
              {copied ? 'Copied' : 'Copy Code'}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Generate a 6-character code that your parent can use to link their account to yours.
              They will be able to see your attendance and fee status.
            </p>
            <button className="btn btn-primary" onClick={generateCode} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Code'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
