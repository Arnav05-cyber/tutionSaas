'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';

interface SessionInfo {
  id: number;
  title: string;
  batchName: string;
  platform: string;
  status: string;
  scheduledAt: string;
  endTime: string;
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

        // Check if session is within the joinable window (15 min before start → end)
        const now = new Date();
        const start = new Date(data.scheduledAt);
        const end = new Date(data.endTime);
        const earlyStart = new Date(start.getTime() - 15 * 60000);

        if (now < earlyStart) {
          setError(`This class hasn't started yet. You can join from ${earlyStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
          setLoading(false);
          return;
        }

        if (now > end) {
          setError('This class session has already ended.');
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', background: '#111' }}>
        <div className="spinner" style={{ marginBottom: '16px', borderColor: '#333', borderTopColor: '#fff' }} />
        <p style={{ color: '#aaa' }}>Preparing live classroom...</p>
      </div>
    );
  }

  if (error || !sessionInfo || !credentials) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', background: '#111', color: '#fff' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📹</div>
          <h2 style={{ marginBottom: '12px', fontSize: '20px', fontWeight: 600 }}>{error || 'Session Not Found'}</h2>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
            {error?.includes('started yet')
              ? 'Please come back when the class is about to begin.'
              : 'Please check with your teacher or try again later.'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '10px 24px', background: '#fff', color: '#111',
              border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: 'pointer', fontSize: '14px',
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Scoped style reset: undo globals inside LiveKit */}
      <style>{`
        .lk-room-container,
        .lk-room-container * {
          all: revert;
          box-sizing: border-box;
        }
        .lk-room-container {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 9999 !important;
          background: #111 !important;
        }
      `}</style>
      <div className="lk-room-container">
        <LiveKitRoom
          video={true}
          audio={true}
          token={credentials.token}
          serverUrl={credentials.url}
          data-lk-theme="default"
          style={{ height: '100dvh', width: '100vw' }}
          onDisconnected={() => router.push('/dashboard')}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </>
  );
}
