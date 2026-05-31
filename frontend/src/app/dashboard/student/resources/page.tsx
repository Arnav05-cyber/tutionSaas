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

export default function StudentResourcesPage() {
  const { getToken } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const batchData = await api.get('/api/batches/my', token);
      setBatches(batchData);
      if (batchData.length > 0) {
        setSelectedBatchId(batchData[0].id);
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

  const filteredResources = filterType === 'ALL'
    ? resources
    : resources.filter(r => r.type === filterType);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Resources</h1>
        <p className="page-subtitle">Notes, practice problems, and tests shared by your teachers</p>
      </div>

      {batches.length === 0 ? (
        <div className="card empty-state"><p>You are not enrolled in any batches yet. Join a batch to access resources.</p></div>
      ) : (
        <>
          {/* ─── Batch Tabs ─── */}
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
            <div className="card empty-state"><p>No resources available{filterType !== 'ALL' ? ' for this type' : ''} in this batch yet.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredResources.map(r => (
                <div key={r.id} className="card card-flex">
                  <div>
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
                      By {r.teacherName} · {r.fileName} · {formatFileSize(r.fileSizeBytes)} · {formatDate(r.uploadedAt)}
                    </p>
                  </div>
                  <a href={r.downloadUrl.startsWith('http') ? r.downloadUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${r.downloadUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
