'use client';

import { SignUp } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function SignUpForm() {
  const searchParams = useSearchParams();
  const invite = searchParams.get('invite');
  const redirectUrl = invite ? `/onboarding?invite=${invite}` : '/onboarding';

  useEffect(() => {
    if (invite) {
      localStorage.setItem('teacherInviteToken', invite);
    }
  }, [invite]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface)',
      gap: '24px'
    }}>
      {invite && (
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--primary)', marginBottom: '8px' }}>
            Teacher Invitation
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
            You have been invited to join as a Teacher! Please create your account below to accept the invitation and set up your profile.
          </p>
        </div>
      )}
      <SignUp fallbackRedirectUrl={redirectUrl} />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
