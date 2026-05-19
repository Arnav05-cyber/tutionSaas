'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface SessionInfo {
  id: number;
  title: string;
  batchName: string;
  internalRoomId: string;
  platform: string;
  status: string;
}

export default function LiveClassPage() {
  const params = useParams<{ sessionId: string }>();
  const id = params?.sessionId;
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const data = await api.get(`/api/sessions/${id}`, token);
        
        if (data.platform !== 'INTERNAL') {
          alert('This session is not hosted internally.');
          router.push('/dashboard');
          return;
        }

        setSessionInfo(data);
      } catch (err) {
        console.error(err);
        alert('Failed to load session details.');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      load();
    }
  }, [id, getToken, router]);

  function joinJitsiRoom() {
    if (!sessionInfo?.internalRoomId || !user) return;
    setRedirecting(true);

    const displayName = encodeURIComponent(user.fullName || user.username || 'Participant');
    const roomId = sessionInfo.internalRoomId.replace(/[^a-zA-Z0-9-_]/g, '');
    const jitsiUrl = `https://meet.jit.si/${roomId}#userInfo.displayName="${displayName}"&config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.prejoinConfig.enabled=false`;
    
    window.location.href = jitsiUrl;
  }

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div className="spinner" style={{ marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Preparing live classroom...</p>
      </div>
    );
  }

  if (!sessionInfo || !sessionInfo.internalRoomId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Session Not Found</h2>
        <button className="btn" onClick={() => router.back()}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)', padding: '24px' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>{sessionInfo.title || 'Live Class'}</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>{sessionInfo.batchName}</p>

        <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Your class will open in a new Jitsi Meet window.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            <strong>Teachers:</strong> Log in with Google when prompted to become the moderator. Students can join once the teacher is in.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 600 }}
          onClick={joinJitsiRoom}
          disabled={redirecting}
        >
          {redirecting ? 'Opening Jitsi...' : '🎥 Join Live Class'}
        </button>

        <button 
          className="btn" 
          style={{ width: '100%', marginTop: '12px' }}
          onClick={() => router.back()}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}
