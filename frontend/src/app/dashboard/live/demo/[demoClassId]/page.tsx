'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface RoomInfo {
  title: string;
  grade: string;
  platform: string;
  internalRoomId: string | null;
  googleMeetLink: string | null;
}

export default function LiveDemoClassPage() {
  const params = useParams<{ demoClassId: string }>();
  const id = params?.demoClassId;
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const me = await api.get('/api/users/me', token);
        setRole(me.role);

        let data: RoomInfo;
        if (me.role === 'TEACHER' || me.role === 'ADMIN') {
          const dc = await api.get(`/api/teacher/demo-classes/${id}`, token);
          data = {
            title: dc.title,
            grade: dc.grade,
            platform: dc.platform,
            internalRoomId: dc.internalRoomId,
            googleMeetLink: dc.googleMeetLink,
          };
        } else {
          // Student: join creates enrollment and returns room info
          const joined = await api.post(`/api/demo-classes/${id}/join`, {}, token);
          data = {
            title: joined.title,
            grade: joined.grade,
            platform: joined.platform,
            internalRoomId: joined.internalRoomId,
            googleMeetLink: joined.googleMeetLink,
          };
        }

        if (data.platform === 'EXTERNAL' && data.googleMeetLink) {
          window.location.href = data.googleMeetLink;
          return;
        }

        setRoomInfo(data);
      } catch (err: any) {
        alert(err.message || 'Failed to load demo class');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id, getToken, router]);

  function joinJitsiRoom() {
    if (!roomInfo?.internalRoomId || !user) return;
    setRedirecting(true);
    const displayName = encodeURIComponent(user.fullName || user.username || 'Participant');
    const roomId = roomInfo.internalRoomId.replace(/[^a-zA-Z0-9-_]/g, '');
    const jitsiUrl = `https://meet.jit.si/${roomId}#userInfo.displayName="${displayName}"&config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.prejoinConfig.enabled=false`;
    window.location.href = jitsiUrl;
  }

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div className="spinner" style={{ marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Preparing demo class...</p>
      </div>
    );
  }

  if (!roomInfo?.internalRoomId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Demo Class Not Found</h2>
        <button className="btn" onClick={() => router.back()}>Go Back</button>
      </div>
    );
  }

  const backHref = role === 'TEACHER' || role === 'ADMIN'
    ? '/dashboard/teacher'
    : '/dashboard/student/demo-class';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)', padding: '24px' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        <div className="badge" style={{ marginBottom: '8px' }}>Free Demo Class</div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>{roomInfo.title || 'Demo Class'}</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>Grade {roomInfo.grade}th</p>

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
          {redirecting ? 'Opening Jitsi...' : 'Join Demo Class'}
        </button>

        <button className="btn" style={{ width: '100%', marginTop: '12px' }} onClick={() => router.push(backHref)}>
          Back
        </button>
      </div>
    </div>
  );
}
