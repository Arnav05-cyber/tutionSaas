'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface UserData {
  id: number;
  role: string;
  fullName: string;
  blocked: boolean;
  onboardingComplete: boolean;
}

const NAV: Record<string, { label: string; href: string }[]> = {
  ADMIN: [
    { label: 'Dashboard', href: '/dashboard/admin' },
    { label: 'Invites', href: '/dashboard/admin/invites' },
    { label: 'Fee Status', href: '/dashboard/admin/fees' },
    { label: 'Batches', href: '/dashboard/admin/batches' },
  ],
  TEACHER: [
    { label: 'Dashboard', href: '/dashboard/teacher' },
    { label: 'My Batches', href: '/dashboard/teacher/batches' },
    { label: 'Sessions', href: '/dashboard/teacher/sessions' },
  ],
  STUDENT: [
    { label: 'Dashboard', href: '/dashboard/student' },
    { label: 'Sessions', href: '/dashboard/student/sessions' },
    { label: 'Attendance', href: '/dashboard/student/attendance' },
    { label: 'Parent Link', href: '/dashboard/student/link-code' },
  ],
  PARENT: [
    { label: 'Dashboard', href: '/dashboard/parent' },
    { label: 'Link Student', href: '/dashboard/parent/link' },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const data = await api.get('/api/users/me', token);
        if (!data.onboardingComplete) {
          router.push('/onboarding');
          return;
        }
        setUser(data);
      } catch {
        router.push('/onboarding');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  if (!user) return null;

  // Blocked account
  if (user.blocked) {
    return (
      <div className="blocked-banner">
        <h2>Account Blocked</h2>
        <p>
          Your account has been blocked due to pending fees.
          Please contact the administration to resolve this.
        </p>
      </div>
    );
  }

  const links = NAV[user.role] || [];

  return (
    <div className="layout-wrap">
      <aside className="sidebar">
        <div className="sidebar-brand">TutionSAAS</div>
        <nav className="sidebar-nav">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserButton />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.fullName}</span>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
