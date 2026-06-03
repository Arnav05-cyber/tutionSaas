'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Teacher {
  id: number;
  fullName: string;
  email: string;
}

interface DemoClass {
  id: number;
  title: string;
  grade: string;
  teacherId: number;
  teacherName: string;
  scheduledAt: string;
  durationMinutes: number;
  platform: string;
  googleMeetLink: string | null;
  status: string;
  capacity: number;
  enrolledCount: number;
}

const GRADES = [
  { value: '9', label: '9th' },
  { value: '10', label: '10th' },
  { value: '11', label: '11th' },
  { value: '12', label: '12th' },
];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'var(--primary)',
  COMPLETED: 'var(--success)',
  CANCELLED: 'var(--danger)',
};

const emptyForm = {
  title: '',
  grade: '10',
  teacherId: '',
  scheduledAt: '',
  durationMinutes: 60,
  platform: 'INTERNAL',
  googleMeetLink: '',
  capacity: 5,
};

export default function AdminDemoClassesPage() {
  const { getToken } = useAuth();
  const [classes, setClasses] = useState<DemoClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function load() {
    const token = await getToken();
    const [classesData, teachersData, featureData] = await Promise.all([
      api.get('/api/admin/demo-classes', token),
      api.get('/api/admin/users?role=TEACHER', token),
      api.get('/api/admin/demo-classes/feature', token),
    ]);
    setClasses(classesData);
    setTeachers(teachersData);
    setFeatureEnabled(featureData.enabled);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleFeature() {
    setToggling(true);
    try {
      const token = await getToken();
      const data = await api.patch('/api/admin/demo-classes/feature', { enabled: !featureEnabled }, token);
      setFeatureEnabled(data.enabled);
    } catch {
      alert('Failed to toggle feature');
    } finally {
      setToggling(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, teacherId: teachers[0]?.id?.toString() || '' });
    setShowForm(true);
  }

  function openEdit(dc: DemoClass) {
    setEditingId(dc.id);
    const localScheduledAt = new Date(dc.scheduledAt);
    const offset = localScheduledAt.getTimezoneOffset() * 60000;
    const localISO = new Date(localScheduledAt.getTime() - offset).toISOString().slice(0, 16);
    setForm({
      title: dc.title,
      grade: dc.grade,
      teacherId: dc.teacherId.toString(),
      scheduledAt: localISO,
      durationMinutes: dc.durationMinutes,
      platform: dc.platform,
      googleMeetLink: dc.googleMeetLink || '',
      capacity: dc.capacity,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.teacherId || !form.scheduledAt) {
      alert('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        ...form,
        teacherId: Number(form.teacherId),
        durationMinutes: Number(form.durationMinutes),
        capacity: Number(form.capacity),
        googleMeetLink: form.googleMeetLink.trim() || null,
      };
      if (editingId) {
        await api.put(`/api/admin/demo-classes/${editingId}`, payload, token);
      } else {
        await api.post('/api/admin/demo-classes', payload, token);
      }
      setShowForm(false);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to save demo class');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: number) {
    if (!confirm('Cancel this demo class? Students who enrolled will get their free demo slot back.')) return;
    try {
      const token = await getToken();
      await api.patch(`/api/admin/demo-classes/${id}/cancel`, {}, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    }
  }

  async function handleComplete(id: number) {
    if (!confirm('Mark this demo class as completed?')) return;
    try {
      const token = await getToken();
      await api.patch(`/api/admin/demo-classes/${id}/complete`, {}, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to complete');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this demo class permanently? This cannot be undone.')) return;
    try {
      const token = await getToken();
      await api.delete(`/api/admin/demo-classes/${id}`, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Demo Classes</h1>
        <p className="page-subtitle">Manage free trial classes for prospective students</p>
      </div>

      {/* Feature toggle */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Demo Class Feature</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {featureEnabled
              ? 'Students can see and join demo classes'
              : 'Demo class option is hidden from all students'}
          </div>
        </div>
        <button
          className={`btn ${featureEnabled ? '' : 'btn-primary'}`}
          style={featureEnabled ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : {}}
          onClick={toggleFeature}
          disabled={toggling}
        >
          {toggling ? 'Updating...' : featureEnabled ? 'Disable Feature' : 'Enable Feature'}
        </button>
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>All Demo Classes</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Demo Class</button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
            {editingId ? 'Edit Demo Class' : 'Create Demo Class'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="input-label">Title *</label>
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Free Demo — Math" />
            </div>
            <div className="form-group">
              <label className="input-label">Grade *</label>
              <select className="input" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
                {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Teacher *</label>
              <select className="input" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
                <option value="">Select teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName || t.email}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Date & Time *</label>
              <input className="input" type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="input-label">Duration (minutes)</label>
              <input className="input" type="number" min={15} value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="input-label">Capacity</label>
              <input className="input" type="number" min={1} max={50} value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="input-label">Platform</label>
              <select className="input" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                <option value="INTERNAL">Internal (Jitsi)</option>
                <option value="EXTERNAL">External (Google Meet)</option>
              </select>
            </div>
            {form.platform === 'EXTERNAL' && (
              <div className="form-group">
                <label className="input-label">Google Meet Link *</label>
                <input className="input" value={form.googleMeetLink} onChange={e => setForm({ ...form, googleMeetLink: e.target.value })} placeholder="https://meet.google.com/..." />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}
            </button>
            <button className="btn" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {classes.length === 0 ? (
        <div className="card empty-state"><p>No demo classes created yet</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Grade</th>
                  <th>Teacher</th>
                  <th>Scheduled</th>
                  <th>Enrolled</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(dc => (
                  <tr key={dc.id}>
                    <td style={{ fontWeight: 500 }}>{dc.title}</td>
                    <td>{dc.grade}th</td>
                    <td>{dc.teacherName}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(dc.scheduledAt).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>{dc.enrolledCount} / {dc.capacity}</span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: `${STATUS_COLORS[dc.status]}22`, color: STATUS_COLORS[dc.status] }}>
                        {dc.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {dc.status === 'SCHEDULED' && (
                          <>
                            <button className="btn btn-sm" onClick={() => openEdit(dc)}>Edit</button>
                            <button className="btn btn-sm" style={{ color: 'var(--success)' }} onClick={() => handleComplete(dc.id)}>Complete</button>
                            <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleCancel(dc.id)}>Cancel</button>
                          </>
                        )}
                        <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(dc.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
