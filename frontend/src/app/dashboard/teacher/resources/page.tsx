'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Batch {
  id: number;
  name: string;
  grade: string;
}

interface Resource {
  id: number;
  title: string;
  description: string;
  type: string;
  fileName: string;
  fileSizeBytes: number;
  downloadUrl: string;
  uploadedAt: string;
  batchName: string;
  teacherName: string;
}

const TYPE_LABELS: Record<string, string> = {
  NOTES: 'Notes',
  WPP: 'Practice Problems',
  TEST: 'Test',
};

const TYPE_COLORS: Record<string, string> = {
  NOTES: '#3b82f6',
  WPP: '#f59e0b',
  TEST: '#ef4444',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function TeacherResourcesPage() {
  const { getToken } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  // Upload form
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadType, setUploadType] = useState('NOTES');
  const [uploadBatchId, setUploadBatchId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const batchData = await api.get('/api/batches/my', token);
      setBatches(batchData);
      if (batchData.length > 0) {
        setSelectedBatchId(batchData[0].id);
        setUploadBatchId(String(batchData[0].id));
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (selectedBatchId !== null) {
      loadResources(selectedBatchId);
    }
  }, [selectedBatchId]);

  async function loadResources(batchId: number) {
    const token = await getToken();
    const data = await api.get(`/api/batches/${batchId}/resources`, token);
    setResources(data);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !uploadBatchId) return;
    setUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDesc);
      formData.append('type', uploadType);

      await api.upload(`/api/batches/${uploadBatchId}/resources`, formData, token);
      alert('Resource uploaded successfully!');
      setShowUpload(false);
      resetUploadForm();
      if (selectedBatchId === Number(uploadBatchId)) {
        await loadResources(selectedBatchId);
      } else {
        setSelectedBatchId(Number(uploadBatchId));
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(resourceId: number) {
    if (!confirm('Delete this resource? This cannot be undone.')) return;
    try {
      const token = await getToken();
      await api.delete(`/api/resources/${resourceId}`, token);
      if (selectedBatchId) await loadResources(selectedBatchId);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  function resetUploadForm() {
    setUploadTitle('');
    setUploadDesc('');
    setUploadType('NOTES');
    setUploadFile(null);
  }

  const filteredResources = filterType === 'ALL'
    ? resources
    : resources.filter(r => r.type === filterType);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Resources</h1>
          <p className="page-subtitle">Upload notes, tests, and practice problems for your batches</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>Upload Resource</button>
      </div>

      {/* ─── Upload Modal ─── */}
      {showUpload && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '500px', maxWidth: '95%' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Upload Resource</h2>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="input-label">Title</label>
                <input className="input" required placeholder="e.g. Chapter 3 - Integration Notes" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="input-label">Description (optional)</label>
                <textarea className="input" rows={2} placeholder="Brief description of this resource" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="input-label">Batch</label>
                  <select className="input" required value={uploadBatchId} onChange={e => setUploadBatchId(e.target.value)}>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="input-label">Type</label>
                  <select className="input" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                    <option value="NOTES">Notes</option>
                    <option value="WPP">Practice Problems</option>
                    <option value="TEST">Test</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="input-label">File</label>
                <input
                  type="file"
                  required
                  className="input"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  style={{ padding: '8px' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Max 10MB. All file formats supported (PDF, Word, PPT, images, etc.)
                </p>
              </div>
              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn" onClick={() => { setShowUpload(false); resetUploadForm(); }} disabled={uploading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading || !uploadFile}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Batch Tabs ─── */}
      {batches.length === 0 ? (
        <div className="card empty-state"><p>You are not assigned to any batches yet.</p></div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {batches.map(b => (
              <button
                key={b.id}
                className={`btn btn-sm ${selectedBatchId === b.id ? 'btn-primary' : ''}`}
                onClick={() => setSelectedBatchId(b.id)}
              >
                {b.name}
              </button>
            ))}
          </div>

          {/* ─── Type Filter ─── */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {['ALL', 'NOTES', 'WPP', 'TEST'].map(t => (
              <button
                key={t}
                className={`btn btn-sm ${filterType === t ? 'btn-primary' : ''}`}
                onClick={() => setFilterType(t)}
                style={{ fontSize: '12px' }}
              >
                {t === 'ALL' ? 'All' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* ─── Resource List ─── */}
          {filteredResources.length === 0 ? (
            <div className="card empty-state"><p>No resources uploaded yet{filterType !== 'ALL' ? ' for this type' : ''}. Click &quot;Upload Resource&quot; to add one.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredResources.map(r => (
                <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: TYPE_COLORS[r.type] + '18', color: TYPE_COLORS[r.type], fontWeight: 600 }}>
                        {TYPE_LABELS[r.type] || r.type}
                      </span>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{r.title}</h3>
                    </div>
                    {r.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{r.description}</p>
                    )}
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {r.fileName} · {formatFileSize(r.fileSizeBytes)} · {formatDate(r.uploadedAt)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <a href={r.downloadUrl.startsWith('http') ? r.downloadUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${r.downloadUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                      Download
                    </a>
                    <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(r.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
