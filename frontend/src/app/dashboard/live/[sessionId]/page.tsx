'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

interface SessionInfo {
  id: number;
  title: string;
  batchName: string;
  platform: string;
  status: string;
}

interface LiveKitCredentials {
  token: string;
  url: string;
}

export default function LiveClassPage() {
  const params = useParams<{ sessionId: string }>();
  const id = params?.sessionId;
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [credentials, setCredentials] = useState<LiveKitCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const data = await api.get(`/api/sessions/${id}`, token);

        if (data.platform !== 'LIVEKIT') {
          setError('This session is not hosted on LiveKit.');
          setLoading(false);
          return;
        }

        setSessionInfo(data);

        // Fetching token also logs student join and auto-marks attendance
        const creds = await api.get(`/api/sessions/${id}/livekit-token`, token);
        setCredentials(creds);
      } catch (err) {
        console.error(err);
        setError('Failed to load session. Make sure you are enrolled and the session is active.');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id, getToken]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div className="spinner" style={{ marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Preparing live classroom...</p>
      </div>
    );
  }

  if (error || !sessionInfo || !credentials) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '12px' }}>{error || 'Session Not Found'}</h2>
        <button className="btn" onClick={() => router.push('/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, background: '#111' }}>
      <LiveKitRoom
        video={true}
        audio={true}
        token={credentials.token}
        serverUrl={credentials.url}
        style={{ height: '100%', width: '100%' }}
        onDisconnected={() => router.push('/dashboard')}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
