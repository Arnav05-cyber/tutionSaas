'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { JitsiMeeting } from '@jitsi/react-sdk';
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

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        // Get the session details to get the internalRoomId
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', margin: 0, padding: 0 }}>
      <div style={{ background: 'var(--surface)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{sessionInfo.title || 'Live Class'}</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{sessionInfo.batchName}</p>
        </div>
        <button className="btn" onClick={() => router.back()}>
          Leave Class
        </button>
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={sessionInfo.internalRoomId}
          configOverwrite={{
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            disableModeratorIndicator: true,
            startScreenSharing: false,
            enableEmailInStats: false
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          }}
          userInfo={{
            displayName: user.fullName || user.username || 'Student'
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
        />
      </div>
    </div>
  );
}
