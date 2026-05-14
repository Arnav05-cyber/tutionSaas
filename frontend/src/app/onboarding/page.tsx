'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import api from '@/lib/api';

function OnboardingForm() {
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteToken = searchParams.get('invite') || '';
  const hasInvite = inviteToken.length > 0;

  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    role: hasInvite ? 'TEACHER' : 'STUDENT',
    grade: '',
    linkedinUrl: '',
    inviteToken: inviteToken,
  });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already onboarded
  useEffect(() => {
    async function check() {
      try {
        const token = await getToken();
        const user = await api.get('/api/users/me', token);
        if (user && user.onboardingComplete) {
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
  }, []);

  function redirectByRole(role: string) {
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
      const token = await getToken();
      const user = await api.post('/api/users/onboard', form, token);
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
          <div className="form-group">
            <label className="input-label">Full Name</label>
            <input
              className="input"
              required
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
            />
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

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
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
