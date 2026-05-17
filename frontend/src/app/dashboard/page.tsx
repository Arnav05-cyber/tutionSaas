'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import api from '@/lib/api';

export default function DashboardRedirect() {
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    async function redirect() {
      try {
        const token = await getToken();
        const user = await api.get('/api/users/me', token);
        switch (user.role) {
          case 'ADMIN': router.push('/dashboard/admin'); break;
          case 'TEACHER': router.push('/dashboard/teacher'); break;
          case 'STUDENT': router.push('/dashboard/student'); break;
          case 'PARENT': router.push('/dashboard/parent'); break;
          default: router.push('/onboarding');
        }
      } catch {
        router.push('/onboarding');
      }
    }
    redirect();
  }, [isLoaded, getToken, router]);

  return <div className="loading-page"><div className="spinner" /></div>;
}
