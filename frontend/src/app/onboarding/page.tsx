'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

function OnboardingForm() {
  const { getToken, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hasInvite, setHasInvite] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'STUDENT',
    grade: '',
    linkedinUrl: '',
    inviteToken: '',
  });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    let token = searchParams.get('invite') || '';
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('teacherInviteToken') || '';
    }
    if (token) {
      setHasInvite(true);
      setForm(prev => ({ ...prev, role: 'TEACHER', inviteToken: token }));
    }
  }, [searchParams]);

  // Check if user is already onboarded
  useEffect(() => {
    if (!isLoaded) return;

    async function check() {
      try {
        const token = await getToken();
        const user = await api.get('/api/users/me', token);
        if (user && (user.onboardingComplete || user.role === 'ADMIN')) {
          // Already onboarded — go to dashboard
          redirectByRole(user.role);
          return;
        }
      } catch {
        // Not onboarded yet — that's fine
      }
      setChecking(false);
    }
    check();
  }, [isLoaded, getToken]);

  function redirectByRole(role: string) {
    if (role === 'STUDENT' && typeof window !== 'undefined' && localStorage.getItem('pendingDemoRedirect')) {
      localStorage.removeItem('pendingDemoRedirect');
      router.push('/dashboard/student/demo-class');
      return;
    }
    switch (role) {
      case 'ADMIN': router.push('/dashboard/admin'); break;
      case 'TEACHER': router.push('/dashboard/teacher'); break;
      case 'STUDENT': router.push('/dashboard/student'); break;
      case 'PARENT': router.push('/dashboard/parent'); break;
      default: router.push('/dashboard');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!consentGiven) {
        setError('You must accept the Privacy Policy to continue.');
        return;
      }
      const token = await getToken();
      const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      const user = await api.post('/api/users/onboard', { ...form, fullName, email, consentGiven }, token);
      localStorage.removeItem('teacherInviteToken');
      redirectByRole(user.role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface)',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', margin: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
          Complete your profile
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          {hasInvite ? 'You were invited as a teacher.' : 'Fill in your details to get started.'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="input-label">First Name</label>
              <input
                className="input"
                required
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="input-label">Last Name</label>
              <input
                className="input"
                required
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Phone Number</label>
            <input
              className="input"
              required
              value={form.phoneNumber}
              onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
            />
          </div>

          {!hasInvite && (
            <div className="form-group">
              <label className="input-label">I am a</label>
              <select
                className="input"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
              </select>
            </div>
          )}

          {form.role === 'STUDENT' && (
            <div className="form-group">
              <label className="input-label">Grade</label>
              <select
                className="input"
                required
                value={form.grade}
                onChange={e => setForm({ ...form, grade: e.target.value })}
              >
                <option value="">Select grade</option>
                <option value="9">9th</option>
                <option value="10">10th</option>
                <option value="11">11th</option>
                <option value="12">12th</option>
              </select>
            </div>
          )}

          {form.role === 'TEACHER' && (
            <div className="form-group">
              <label className="input-label">LinkedIn (optional)</label>
              <input
                className="input"
                value={form.linkedinUrl}
                onChange={e => setForm({ ...form, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          )}

          <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              id="consent"
              checked={consentGiven}
              onChange={e => setConsentGiven(e.target.checked)}
              style={{ marginTop: '3px', flexShrink: 0, cursor: 'pointer' }}
            />
            <label htmlFor="consent" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', cursor: 'pointer' }}>
              I have read and agree to the{' '}
              <Link href="/privacy" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                Terms of Service
              </Link>
              . I consent to EDUSHA collecting and processing my personal data as described therein.
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || !consentGiven} style={{ width: '100%' }}>
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
      <OnboardingForm />
    </Suspense>
  );
}
