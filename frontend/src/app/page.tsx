'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/onboarding');
    }
  }, [isSignedIn, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '16px 0',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>TutionSAAS</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/sign-in" className="btn">Sign In</Link>
            <Link href="/sign-up" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '560px', padding: '48px 24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.3, marginBottom: '12px' }}>
            Manage your tuition center, effortlessly.
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
            Batches, sessions, attendance, fees, and parent communication — all in one place.
            Built for teachers and tuition owners who value simplicity.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Link href="/sign-up" className="btn btn-primary" style={{ padding: '10px 24px' }}>
              Start for free
            </Link>
            <Link href="/sign-in" className="btn" style={{ padding: '10px 24px' }}>
              Sign in
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 0',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--text-muted)',
      }}>
        TutionSAAS
      </footer>
    </div>
  );
}
