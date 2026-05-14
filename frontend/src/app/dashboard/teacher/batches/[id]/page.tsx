'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

interface Session {
  id: number;
  topic: string;
  scheduledAt: string;
  status: string;
  googleMeetLink: string;
}

interface JoinLog {
  studentId: number;
  studentName: string;
  joinedAt: string;
}

export default function BatchDetailPage() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [joinLogs, setJoinLogs] = useState<Record<number, JoinLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const data = await api.get(`/api/batches/${id}/sessions`, token);
      setSessions(data);
      setLoading(false);
    }
    load();
  }, [id]);

  async function loadJoinLogs(sessionId: number) {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }
    const token = await getToken();
    const logs = await api.get(`/api/sessions/${sessionId}/join-logs`, token);
    setJoinLogs(prev => ({ ...prev, [sessionId]: logs }));
    setExpandedSession(sessionId);
  }

  async function markAttendance(sessionId: number, studentId: number, present: boolean) {
    const token = await getToken();
    await api.post(`/api/sessions/${sessionId}/attendance`, {
      records: [{ studentId, present }],
    }, token);
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Batch Sessions</h1>
        <p className="page-subtitle">View sessions and track who joined</p>
      </div>

      {sessions.length === 0 ? (
        <div className="card empty-state"><p>No sessions for this batch yet</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map(s => (
            <div key={s.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 500 }}>{s.topic || 'Untitled Session'}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(s.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge ${s.status === 'COMPLETED' ? 'badge-success' : s.status === 'CANCELLED' ? 'badge-danger' : 'badge-accent'}`}>
                    {s.status}
                  </span>
                  <button className="btn btn-sm" onClick={() => loadJoinLogs(s.id)}>
                    {expandedSession === s.id ? 'Hide Joins' : 'View Joins'}
                  </button>
                </div>
              </div>

              {expandedSession === s.id && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Students who clicked Join
                  </h4>
                  {(!joinLogs[s.id] || joinLogs[s.id].length === 0) ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No one has joined yet</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Joined At</th>
                          <th>Mark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {joinLogs[s.id].map(log => (
                          <tr key={log.studentId}>
                            <td>{log.studentName}</td>
                            <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              {new Date(log.joinedAt).toLocaleTimeString()}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  className="btn btn-sm"
                                  style={{ color: 'var(--success)' }}
                                  onClick={() => markAttendance(s.id, log.studentId, true)}
                                >
                                  Present
                                </button>
                                <button
                                  className="btn btn-sm"
                                  style={{ color: 'var(--danger)' }}
                                  onClick={() => markAttendance(s.id, log.studentId, false)}
                                >
                                  Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
