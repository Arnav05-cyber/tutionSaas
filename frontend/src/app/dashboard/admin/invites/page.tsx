'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Invite {
  id: number;
  token: string;
  teacherName: string | null;
  inviteUrl: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
}

export default function InvitesPage() {
  const { getToken } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    const token = await getToken();
    const data = await api.get('/api/admin/invites', token);
    setInvites(data);
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      await api.post('/api/admin/invites', { teacherName: teacherName.trim() || undefined }, token);
      setTeacherName('');
      setShowModal(false);
      await loadInvites();
    } finally {
      setLoading(false);
    }
  }

  async function deleteInvite(invite: Invite) {
    if (!confirm(`Delete invite${invite.teacherName ? ` for ${invite.teacherName}` : ''}? This cannot be undone.`)) return;
    setDeletingId(invite.id);
    try {
      const token = await getToken();
      await api.delete(`/api/admin/invites/${invite.id}`, token);
      setInvites(prev => prev.filter(i => i.id !== invite.id));
    } finally {
      setDeletingId(null);
    }
  }

  function copyLink(invite: Invite) {
    navigator.clipboard.writeText(invite.inviteUrl);
    setCopied(invite.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Teacher Invites</h1>
          <p className="page-subtitle">Generate invite links for teachers to sign up</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Generate Invite Link
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="card modal" onClick={e => e.stopPropagation()} style={{ width: '400px', maxWidth: '95vw' }}>
            <h2 className="modal-title">Generate Invite Link</h2>
            <form onSubmit={generate}>
              <div className="form-group">
                <label className="input-label">Teacher Name</label>
                <input
                  className="input"
                  placeholder="e.g. Akshika Vyas"
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  autoFocus
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  For tracking only — does not affect the invite link.
                </p>
              </div>
              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Status</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Link</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 && (
                <tr><td colSpan={6} className="empty-state"><p>No invites yet</p></td></tr>
              )}
              {invites.map(invite => (
                <tr key={invite.id}>
                  <td style={{ fontWeight: 500 }}>
                    {invite.teacherName || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td>
                    <span className={`badge ${invite.used ? 'badge-success' : 'badge-accent'}`}>
                      {invite.used ? 'Used' : 'Active'}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(invite.createdAt).toLocaleDateString()}
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
                      {copied === invite.id ? 'Copied!' : 'Copy Link'}
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteInvite(invite)}
                      disabled={deletingId === invite.id}
                    >
                      {deletingId === invite.id ? 'Deleting...' : 'Delete'}
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
