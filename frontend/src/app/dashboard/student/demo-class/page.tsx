'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface DemoClass {
  id: number;
  title: string;
  grade: string;
  teacherName: string;
  scheduledAt: string;
  endTime: string;
  durationMinutes: number;
  platform: string;
  capacity: number;
  enrolledCount: number;
}

export default function StudentDemoClassPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<{
    available: boolean;
    reason: string | null;
    demoClass: DemoClass | null;
  } | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const data = await api.get('/api/demo-classes/available', token);
        setState(data);
      } catch {
        setState({ available: false, reason: 'ERROR', demoClass: null });
      }
    }
    load();
  }, []);

  async function handleJoin() {
    if (!state?.demoClass) return;
    setJoining(true);
    try {
      const token = await getToken();
      const data = await api.post(`/api/demo-classes/${state.demoClass.id}/join`, {}, token);
      if (data.platform === 'INTERNAL') {
        router.push(`/dashboard/live/demo/${state.demoClass.id}`);
      } else {
        window.open(data.googleMeetLink, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to join demo class');
      setJoining(false);
    }
  }

  function isJoinable() {
    if (!state?.demoClass) return false;
    const now = new Date();
    const start = new Date(state.demoClass.scheduledAt);
    const end = new Date(state.demoClass.endTime);
    const fifteenMinsBefore = new Date(start.getTime() - 15 * 60 * 1000);
    return now >= fifteenMinsBefore && now <= end;
  }

  if (!state) return <div className="loading-page"><div className="spinner" /></div>;

  if (!state.available) {
    const messages: Record<string, { title: string; body: string }> = {
      ALREADY_USED: {
        title: 'Demo Class Complete',
        body: 'You have already attended your free demo class. Join a batch to continue learning!',
      },
      FEATURE_DISABLED: {
        title: 'Demo Classes Unavailable',
        body: 'Demo classes are not available at the moment. Please check back later.',
      },
      NONE_SCHEDULED: {
        title: 'No Demo Class Scheduled',
        body: 'There are no upcoming demo classes for your grade right now. Check back soon!',
      },
      NO_GRADE: {
        title: 'Grade Not Set',
        body: 'Please complete your profile to see demo classes for your grade.',
      },
    };
    const msg = messages[state.reason || ''] ?? { title: 'Not Available', body: 'Demo class is not available.' };

    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Free Demo Class</h1>
        </div>
        <div className="card" style={{ maxWidth: '480px', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>
            {state.reason === 'ALREADY_USED' ? '' : ''}
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{msg.title}</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{msg.body}</p>
          <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => router.push('/dashboard/student')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const dc = state.demoClass!;
  const joinable = isJoinable();
  const start = new Date(dc.scheduledAt);
  const spotsLeft = dc.capacity - dc.enrolledCount;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Free Demo Class</h1>
        <p className="page-subtitle">Your free trial session — available once per student</p>
      </div>

      <div className="card" style={{ maxWidth: '520px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{dc.title}</h2>
          <span className="badge">Grade {dc.grade}th</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Teacher</span>
            <span style={{ fontWeight: 500 }}>{dc.teacherName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Date & Time</span>
            <span style={{ fontWeight: 500 }}>{start.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Duration</span>
            <span style={{ fontWeight: 500 }}>{dc.durationMinutes} minutes</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Platform</span>
            <span style={{ fontWeight: 500 }}>{dc.platform === 'INTERNAL' ? 'Jitsi (online)' : 'Google Meet'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Spots Left</span>
            <span style={{ fontWeight: 500, color: spotsLeft <= 1 ? 'var(--danger)' : 'inherit' }}>
              {spotsLeft} of {dc.capacity}
            </span>
          </div>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          This is a one-time free demo. Once you join, you won't be able to join another demo class.
        </div>

        {joinable ? (
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 600 }}
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? 'Joining...' : 'Join Demo Class Now'}
          </button>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              The "Join" button will activate 15 minutes before the class starts.
            </p>
            <button className="btn" style={{ width: '100%' }} disabled>
              Join opens at {new Date(start.getTime() - 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          </div>
        )}

        <button className="btn" style={{ width: '100%', marginTop: '12px' }} onClick={() => router.push('/dashboard/student')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
