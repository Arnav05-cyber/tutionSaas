'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface PublicDemoClass {
  id: number;
  title: string;
  grade: string;
  scheduledAt: string;
  capacity: number;
  enrolledCount: number;
}

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [demoClass, setDemoClass] = useState<PublicDemoClass | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    api.get('/api/public/demo-class').then(setDemoClass).catch(() => null);
  }, []);

  function handleBannerClick() {
    if (isSignedIn) {
      router.push('/dashboard/student/demo-class');
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingDemoRedirect', '1');
      }
      router.push('/sign-up');
    }
  }

  const spotsLeft = demoClass ? demoClass.capacity - demoClass.enrolledCount : 0;
  const bannerText = demoClass
    ? `FREE DEMO CLASS AVAILABLE • Grade ${demoClass.grade}th • "${demoClass.title}" • ${new Date(demoClass.scheduledAt).toLocaleDateString()} at ${new Date(demoClass.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left! • Click to register for free       `
    : '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes demoTicker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .demo-ticker-text {
          display: inline-block;
          white-space: nowrap;
          animation: demoTicker 22s linear infinite;
          cursor: pointer;
        }
        .demo-ticker-text:hover {
          text-decoration: underline;
        }
      `}</style>

      {/* Nav */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '1px' }}>EDUSHA</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/sign-in" className="btn">Sign In</Link>
            <Link href="/sign-up" className="btn btn-primary">Join Now</Link>
          </div>
        </div>
      </header>

      {/* Demo class ticker banner */}
      {demoClass && spotsLeft > 0 && (
        <div
          onClick={handleBannerClick}
          style={{
            background: 'var(--primary)',
            color: '#fff',
            height: '36px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.3px',
          }}
        >
          <span className="demo-ticker-text">{bannerText}</span>
        </div>
      )}

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', padding: '48px 24px' }}>
          <h1 className="hero-title">
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
