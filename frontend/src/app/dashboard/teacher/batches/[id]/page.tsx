'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

interface ScheduleSlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
}

interface BatchDetail {
  id: number;
  name: string;
  grade: string;
  schedule: ScheduleSlot[];
}

interface Session {
  id: number;
  title: string;
  scheduledAt: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  googleMeetLink: string;
  batchName: string;
}

interface JoinLog {
  studentId: number;
  studentName: string;
  joinedAt: string;
}

const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
};

const DAY_INDEX: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getNextDateForDay(dayOfWeek: string): string {
  const target = DAY_INDEX[dayOfWeek];
  const today = new Date();
  const todayDay = today.getDay();
  let diff = target - todayDay;
  if (diff <= 0) diff += 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + diff);
  const yyyy = nextDate.getFullYear();
  const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
  const dd = String(nextDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function BatchDetailPage() {
  const { id } = useParams();
  const { getToken } = useAuth();

  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [joinLogs, setJoinLogs] = useState<Record<number, JoinLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [now, setNow] = useState(new Date());

  // Create session form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionLink, setSessionLink] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, [id]);

  async function loadData() {
    const token = await getToken();
    const [batchData, sessionData] = await Promise.all([
      api.get(`/api/batches/${id}`, token),
      api.get(`/api/batches/${id}/sessions`, token),
    ]);
    setBatch(batchData);
    setSessions(sessionData);
    setLoading(false);
  }

  function openCreateForSlot(slot: ScheduleSlot) {
    setSelectedSlot(slot);
    setSessionDate(getNextDateForDay(slot.dayOfWeek));
    setSessionTitle('');
    setSessionLink('');
    setShowCreate(true);
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setCreating(true);
    try {
      const token = await getToken();
      // Time and duration come from the admin-defined schedule slot
      const time = selectedSlot.startTime.substring(0, 5);
      const scheduledAt = `${sessionDate}T${time}:00`;
      await api.post(`/api/batches/${id}/sessions`, {
        title: sessionTitle,
        scheduledAt,
        durationMinutes: selectedSlot.durationMinutes,
        googleMeetLink: sessionLink,
      }, token);
      setShowCreate(false);
      setSelectedSlot(null);
      await loadData();
    } catch (err) {
      alert('Failed to create session');
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

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

  function isSessionActive(session: Session) {
    const start = new Date(session.scheduledAt);
    const end = new Date(session.endTime);
    return now >= start && now <= end;
  }

  function isSessionPast(session: Session) {
    const end = new Date(session.endTime);
    return now > end;
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{batch?.name || 'Batch'}</h1>
        <p className="page-subtitle">
          Grade {batch?.grade}
          {batch?.schedule && batch.schedule.length > 0 && (
            <> — {batch.schedule.map(s => `${DAY_SHORT[s.dayOfWeek]} ${formatTime(s.startTime)} (${s.durationMinutes}min)`).join(', ')}</>
          )}
        </p>
      </div>

      {/* ─── Create Session from Schedule Slots ─── */}
      {batch?.schedule && batch.schedule.length > 0 && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '10px' }}>Create a session for an upcoming class:</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {batch.schedule.map((s, i) => (
              <button key={i} className="btn btn-primary" onClick={() => openCreateForSlot(s)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px', lineHeight: 1.3 }}>
                <span style={{ fontWeight: 600 }}>{DAY_SHORT[s.dayOfWeek]}</span>
                <span style={{ fontSize: '12px', opacity: 0.85 }}>{formatTime(s.startTime)} · {s.durationMinutes}min</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Create Session Modal ─── */}
      {showCreate && selectedSlot && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '440px', maxWidth: '95%' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Create Session</h2>

            {/* Show locked schedule info */}
            <div style={{ background: 'var(--surface-hover)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Day</span>
                <span style={{ fontWeight: 500 }}>{DAY_SHORT[selectedSlot.dayOfWeek]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Time</span>
                <span style={{ fontWeight: 500 }}>{formatTime(selectedSlot.startTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Duration</span>
                <span style={{ fontWeight: 500 }}>{selectedSlot.durationMinutes} min</span>
              </div>
            </div>

            <form onSubmit={handleCreateSession}>
              <div className="form-group">
                <label className="input-label">Topic / Title</label>
                <input className="input" required placeholder="e.g. Hamlet Act 3 Discussion" value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="input-label">Date ({DAY_SHORT[selectedSlot.dayOfWeek]})</label>
                <input type="date" className="input" required value={sessionDate} onChange={e => {
                  // Validate that selected date falls on the correct day of week
                  const selected = new Date(e.target.value + 'T00:00:00');
                  if (selected.getDay() !== DAY_INDEX[selectedSlot.dayOfWeek]) {
                    alert(`Please select a ${DAY_SHORT[selectedSlot.dayOfWeek]} date. The batch schedule is set for ${DAY_SHORT[selectedSlot.dayOfWeek]}s.`);
                    return;
                  }
                  setSessionDate(e.target.value);
                }} />
              </div>
              <div className="form-group">
                <label className="input-label">Meeting Link (Google Meet, Zoom, etc.)</label>
                <input className="input" required placeholder="https://meet.google.com/..." value={sessionLink} onChange={e => setSessionLink(e.target.value)} />
              </div>
              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn" onClick={() => { setShowCreate(false); setSelectedSlot(null); }} disabled={creating}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Sessions List ─── */}
      {sessions.length === 0 ? (
        <div className="card empty-state"><p>No sessions yet. Use the buttons above to create one.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map(s => {
            const active = isSessionActive(s);
            const past = isSessionPast(s);

            return (
              <div key={s.id} className="card" style={active ? { borderLeft: '3px solid var(--success)' } : {}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 500 }}>{s.title || 'Untitled Session'}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(s.scheduledAt).toLocaleString()} — {s.durationMinutes} min
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {active && (
                      <span className="badge badge-success">● LIVE</span>
                    )}
                    {active && s.googleMeetLink && (
                      <a href={s.googleMeetLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                        Join Meet
                      </a>
                    )}
                    {past && !active && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Session ended</span>
                    )}
                    {!active && !past && s.googleMeetLink && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Link active at start time</span>
                    )}
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
                                  <button className="btn btn-sm" style={{ color: 'var(--success)' }}
                                    onClick={() => markAttendance(s.id, log.studentId, true)}>Present</button>
                                  <button className="btn btn-sm" style={{ color: 'var(--danger)' }}
                                    onClick={() => markAttendance(s.id, log.studentId, false)}>Absent</button>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
