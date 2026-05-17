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
      router.push('/dashboard');
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
          <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '1px' }}>EDUSHA</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/sign-in" className="btn">Sign In</Link>
            <Link href="/sign-up" className="btn btn-primary">Join Now</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', padding: '48px 24px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Excellence in Education.
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
            Welcome to EDUSHA's official student portal. Access your enrolled batches, join live interactive sessions, track your attendance, and manage your academic progress—all in one seamless platform.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/sign-up" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
              Sign Up for Free
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 0',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--text-muted)',
      }}>
        &copy; {new Date().getFullYear()} EDUSHA. All rights reserved.
      </footer>
    </div>
  );
}
