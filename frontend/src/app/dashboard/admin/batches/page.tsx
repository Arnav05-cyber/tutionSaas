'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface ScheduleSlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
}

interface StudentInfo {
  id: number;
  fullName: string;
  email: string;
  grade: string;
}

interface Batch {
  id: number;
  name: string;
  grade: string;
  teacherId: number;
  teacherName: string;
  monthlyFee: number;
  active: boolean;
  studentCount: number;
  schedule: ScheduleSlot[];
  students: StudentInfo[];
}

interface UserOption {
  id: number;
  fullName: string;
  email: string;
  grade: string;
}

interface DaySlot {
  enabled: boolean;
  startTime: string;
  durationMinutes: number;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function AdminBatchesPage() {
  const { getToken } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<UserOption[]>([]);
  const [students, setStudents] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Create batch modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchGrade, setBatchGrade] = useState('10');
  const [batchTeacherId, setBatchTeacherId] = useState('');
  const [daySlots, setDaySlots] = useState<Record<string, DaySlot>>(
    Object.fromEntries(DAYS.map(d => [d, { enabled: false, startTime: '16:00', durationMinutes: 60 }]))
  );

  // Manage students modal
  const [manageBatchId, setManageBatchId] = useState<number | null>(null);
  const [addStudentId, setAddStudentId] = useState('');

  // Fee edit
  const [editFeeId, setEditFeeId] = useState<number | null>(null);
  const [feeValue, setFeeValue] = useState('');

  // Expanded batch
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function loadAll() {
    const token = await getToken();
    const [batchData, teacherData, studentData] = await Promise.all([
      api.get('/api/batches', token),
      api.get('/api/admin/users?role=TEACHER', token),
      api.get('/api/admin/users?role=STUDENT', token),
    ]);
    setBatches(batchData);
    setTeachers(teacherData);
    setStudents(studentData);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const token = await getToken();
      const schedule = DAYS.filter(d => daySlots[d].enabled).map(d => ({
        dayOfWeek: d,
        startTime: daySlots[d].startTime + ':00',
        durationMinutes: daySlots[d].durationMinutes,
      }));
      await api.post('/api/batches', {
        name: batchName,
        grade: batchGrade,
        teacherId: Number(batchTeacherId),
        schedule,
      }, token);
      setShowCreate(false);
      resetCreateForm();
      await loadAll();
    } catch (err) {
      alert('Failed to create batch');
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  function resetCreateForm() {
    setBatchName('');
    setBatchGrade('10');
    setBatchTeacherId('');
    setDaySlots(Object.fromEntries(DAYS.map(d => [d, { enabled: false, startTime: '16:00', durationMinutes: 60 }])));
  }

  async function handleAddStudent(batchId: number) {
    if (!addStudentId) return;
    const token = await getToken();
    await api.post(`/api/batches/${batchId}/students/${addStudentId}`, {}, token);
    setAddStudentId('');
    await loadAll();
  }

  async function handleRemoveStudent(batchId: number, studentId: number) {
    const token = await getToken();
    await api.delete(`/api/batches/${batchId}/students/${studentId}`, token);
    await loadAll();
  }

  async function saveFee(batchId: number) {
    const token = await getToken();
    await api.put(`/api/admin/batches/${batchId}/fee`, { monthlyFee: parseFloat(feeValue) || 0 }, token);
    setEditFeeId(null);
    setFeeValue('');
    await loadAll();
  }

  function updateDaySlot(day: string, field: string, value: string | number | boolean) {
    setDaySlots(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  }

  function getScheduleSummary(schedule: ScheduleSlot[]) {
    return schedule.map(s => `${DAY_SHORT[s.dayOfWeek]} ${formatTime(s.startTime)}`).join(', ');
  }

  const manageBatch = batches.find(b => b.id === manageBatchId);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Batches</h1>
          <p className="page-subtitle">Create and manage batches, assign teachers and students</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Batch</button>
      </div>

      {/* ─── Create Batch Modal ─── */}
      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '520px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Create New Batch</h2>
            <form onSubmit={handleCreateBatch}>
              <div className="form-group">
                <label className="input-label">Batch Name</label>
                <input className="input" required placeholder="e.g. Grade 10 - Batch A" value={batchName} onChange={e => setBatchName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="input-label">Grade</label>
                  <select className="input" value={batchGrade} onChange={e => setBatchGrade(e.target.value)}>
                    <option value="9">9th</option>
                    <option value="10">10th</option>
                    <option value="11">11th</option>
                    <option value="12">12th</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="input-label">Assign Teacher</label>
                  <select className="input" required value={batchTeacherId} onChange={e => setBatchTeacherId(e.target.value)}>
                    <option value="">Select teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName || t.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Weekly Schedule</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {DAYS.map(day => (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: daySlots[day].enabled ? 'var(--surface-hover)' : 'transparent', borderRadius: '8px', transition: 'background 0.15s' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '90px', cursor: 'pointer', fontSize: '14px' }}>
                        <input type="checkbox" checked={daySlots[day].enabled} onChange={e => updateDaySlot(day, 'enabled', e.target.checked)} />
                        {DAY_SHORT[day]}
                      </label>
                      {daySlots[day].enabled && (
                        <>
                          <input type="time" className="input" style={{ width: '120px' }} value={daySlots[day].startTime} onChange={e => updateDaySlot(day, 'startTime', e.target.value)} />
                          <select className="input" style={{ width: '100px' }} value={daySlots[day].durationMinutes} onChange={e => updateDaySlot(day, 'durationMinutes', Number(e.target.value))}>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                            <option value={90}>90 min</option>
                            <option value={120}>120 min</option>
                          </select>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn" onClick={() => { setShowCreate(false); resetCreateForm(); }} disabled={creating}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Manage Students Modal ─── */}
      {manageBatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '500px', maxWidth: '95%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>
              Manage Students — {manageBatch.name}
            </h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <select className="input" style={{ flex: 1 }} value={addStudentId} onChange={e => setAddStudentId(e.target.value)}>
                <option value="">Select student to add</option>
                {students
                  .filter(s => !manageBatch.students?.some(bs => bs.id === s.id))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.fullName || s.email} (Grade {s.grade})</option>
                  ))
                }
              </select>
              <button className="btn btn-primary" onClick={() => handleAddStudent(manageBatch.id)} disabled={!addStudentId}>Add</button>
            </div>

            {(!manageBatch.students || manageBatch.students.length === 0) ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No students assigned yet</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Grade</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manageBatch.students.map(s => (
                      <tr key={s.id}>
                        <td>{s.fullName}</td>
                        <td>{s.grade}</td>
                        <td>
                          <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleRemoveStudent(manageBatch.id, s.id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => { setManageBatchId(null); setAddStudentId(''); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Batch List ─── */}
      {batches.length === 0 ? (
        <div className="card empty-state"><p>No batches yet. Create one above.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {batches.map(b => (
            <div key={b.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{b.name}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Grade {b.grade} — Teacher: {b.teacherName}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {b.schedule && b.schedule.length > 0 ? getScheduleSummary(b.schedule) : 'No schedule'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="badge">{b.studentCount} students</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {b.monthlyFee > 0 ? `₹${b.monthlyFee}` : 'Fee not set'}
                  </span>
                </div>
              </div>

              {expandedId === b.id && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-sm btn-primary" onClick={e => { e.stopPropagation(); setManageBatchId(b.id); }}>
                    Manage Students
                  </button>
                  {editFeeId === b.id ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                      <input className="input" style={{ width: '100px' }} type="number" value={feeValue} onChange={e => setFeeValue(e.target.value)} autoFocus placeholder="Amount" />
                      <button className="btn btn-sm btn-primary" onClick={() => saveFee(b.id)}>Save</button>
                      <button className="btn btn-sm" onClick={() => setEditFeeId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setEditFeeId(b.id); setFeeValue(String(b.monthlyFee || '')); }}>
                      Set Fee
                    </button>
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
