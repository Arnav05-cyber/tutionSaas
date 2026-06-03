import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px' }}>EDUSHA</span>
          <Link href="/" className="btn" style={{ fontSize: '13px' }}>← Back to Home</Link>
        </div>
      </header>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <SignIn fallbackRedirectUrl="/onboarding" />
      </div>
    </div>
  );
}
