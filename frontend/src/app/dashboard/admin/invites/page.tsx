'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Invite {
  id: number;
  token: string;
  inviteUrl: string;
  email: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
}

export default function InvitesPage() {
  const { getToken } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    const token = await getToken();
    const data = await api.get('/api/admin/invites', token);
    setInvites(data);
  }

  async function generate() {
    setLoading(true);
    try {
      const token = await getToken();
      await api.post('/api/admin/invites', email ? { email } : {}, token);
      setEmail('');
      await loadInvites();
    } finally {
      setLoading(false);
    }
  }

  function copyLink(invite: Invite) {
    navigator.clipboard.writeText(invite.inviteUrl);
    setCopied(invite.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Teacher Invites</h1>
        <p className="page-subtitle">Generate invite links for teachers to sign up</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Email (optional)</label>
            <input
              className="input"
              placeholder="teacher@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Invite'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 && (
                <tr><td colSpan={4} className="empty-state"><p>No invites yet</p></td></tr>
              )}
              {invites.map(invite => (
                <tr key={invite.id}>
                  <td>{invite.email || '—'}</td>
                  <td>
                    <span className={`badge ${invite.used ? 'badge-success' : 'badge-accent'}`}>
                      {invite.used ? 'Used' : 'Active'}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm"
                      onClick={() => copyLink(invite)}
                      disabled={invite.used}
                    >
                      {copied === invite.id ? 'Copied' : 'Copy Link'}
                    </button>
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
