'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface PublicDemoClass {
  id: number;
  grade: string;
  capacity: number;
  enrolledCount: number;
}

const EDUCATOR = {
  tagline: 'English Educator | CBSE Classes 10 & 12 | IELTS & CUET | 25+ Years Experience',
  credentials: [
    { label: 'PGT English', note: 'Post Graduate Teacher' },
    { label: 'CBSE Certified Trainer', note: 'Training of Trainers (ToT)' },
    { label: 'Head of Department', note: 'Senior Secondary Level' },
    { label: 'Post Graduate in English', note: 'Delhi University' },
    { label: 'Content Developer', note: 'CBSE Classes 10 & 12' },
  ],
  stats: [
    { value: '25+', label: 'Years of Experience' },
    { value: '10 & 12', label: 'CBSE Board Classes' },
    { value: 'IELTS', label: 'International English' },
    { value: 'CUET', label: 'University Entrance' },
  ],
  bio: 'An accomplished PGT English educator and CBSE Certified Trainer (ToT) with over 25 years of senior secondary teaching experience. A Post Graduate in English from Delhi University, she has served as Head of Department and brings valuable expertise in content creation and development for CBSE Classes 10 and 12, alongside specialised coaching for IELTS and CUET.',
  approach:
    'Her student-centred approach combines conceptual clarity, structured writing practice, and personalised feedback to deliver consistent results across board, competitive, and international examinations. Committed to building language confidence and long-term proficiency, she helps every student achieve their highest potential.',
  specialisations: [
    'CBSE Class 10 English (Board Examination)',
    'CBSE Class 12 English (Board Examination)',
    'IELTS Preparation (All Bands)',
    'CUET English Language Module',
    'Writing Skills & Formal Composition',
    'Reading Comprehension & Literary Analysis',
    'Grammar, Vocabulary & Language Mechanics',
    'Content Creation & Curriculum Development',
  ],
  examsCovered: ['CBSE Board Exams', 'IELTS', 'CUET', 'School Internal Assessments'],
};

export default function TeachersPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [demoClass, setDemoClass] = useState<PublicDemoClass | null>(null);

  useEffect(() => {
    api.get('/api/public/demo-class').then(setDemoClass).catch(() => null);
  }, []);

  function handleDemoClick() {
    if (isSignedIn) {
      router.push('/dashboard/student/demo-class');
    } else {
      if (typeof window !== 'undefined') localStorage.setItem('pendingDemoRedirect', '1');
      router.push('/sign-up');
    }
  }

  const spotsLeft = demoClass ? demoClass.capacity - demoClass.enrolledCount : 0;

  return (
    <>
      <style>{`
        .tp-cred-card {
          background: #fff;
          border: 1px solid #E4E4E7;
          border-radius: 10px;
          padding: 14px 18px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .tp-cred-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }
        .tp-spec-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #F4F4F5;
          font-size: 14px;
          color: #3F3F46;
          line-height: 1.5;
        }
        .tp-spec-item:last-child { border-bottom: none; }
        .tp-spec-dot {
          width: 6px; height: 6px;
          background: #09090B;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 6px;
        }
        @media (max-width: 768px) {
          .tp-main-grid { grid-template-columns: 1fr !important; }
          .tp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tp-creds-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F4F4F5' }}>

        {/* ── Nav ── */}
        <header style={{ background: '#fff', borderBottom: '1px solid #E4E4E7', padding: '16px 0', position: 'sticky', top: 0, zIndex: 40 }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px', color: '#09090B' }}>EDUSHA</Link>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/sign-in" className="btn">Sign In</Link>
              <Link href="/sign-up" className="btn btn-primary">Join Free</Link>
            </div>
          </div>
        </header>

        {/* ── Hero strip ── */}
        <div style={{ background: '#09090B', color: '#fff', padding: '48px 0 40px' }}>
          <div className="container">
            <Link href="/" style={{ fontSize: '13px', color: '#71717A', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
              ← Back to Home
            </Link>
            <div style={{ display: 'inline-block', background: '#ffffff14', border: '1px solid #ffffff22', borderRadius: '99px', padding: '5px 14px', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#ffffffaa', marginBottom: '16px' }}>
              Our Educator
            </div>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.15, marginBottom: '12px' }}>
              English Educator
            </h1>
            <p style={{ fontSize: '15px', color: '#ffffffbb', maxWidth: '560px', lineHeight: 1.6 }}>
              {EDUCATOR.tagline}
            </p>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="container" style={{ padding: '40px 24px' }}>
          <div className="tp-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '28px', alignItems: 'start' }}>

            {/* ── Left column ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* About */}
              <div style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: '12px', padding: '28px', borderLeft: '4px solid #09090B' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>About</h2>
                <p style={{ fontSize: '15px', color: '#3F3F46', lineHeight: 1.8, marginBottom: '16px' }}>{EDUCATOR.bio}</p>
                <p style={{ fontSize: '15px', color: '#3F3F46', lineHeight: 1.8 }}>{EDUCATOR.approach}</p>
              </div>

              {/* Credentials */}
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Credentials & Qualifications</h2>
                <div className="tp-creds-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {EDUCATOR.credentials.map((c, i) => (
                    <div key={i} className="tp-cred-card">
                      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '3px' }}>{c.label}</div>
                      <div style={{ fontSize: '12px', color: '#71717A' }}>{c.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialisations */}
              <div style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: '12px', padding: '28px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Areas of Specialisation</h2>
                <div>
                  {EDUCATOR.specialisations.map((s, i) => (
                    <div key={i} className="tp-spec-item">
                      <div className="tp-spec-dot" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ── Right column ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Stats */}
              <div style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: '12px', overflow: 'hidden' }}>
                <div className="tp-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {EDUCATOR.stats.map((s, i) => (
                    <div key={i} style={{ padding: '20px', borderRight: i % 2 === 0 ? '1px solid #E4E4E7' : 'none', borderBottom: i < 2 ? '1px solid #E4E4E7' : 'none' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: '12px', color: '#71717A', marginTop: '4px', fontWeight: 500 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exams covered */}
              <div style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#71717A', marginBottom: '14px' }}>Exams Covered</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {EDUCATOR.examsCovered.map((e, i) => (
                    <span key={i} className="badge" style={{ fontSize: '13px' }}>{e}</span>
                  ))}
                </div>
              </div>

              {/* CTA card */}
              <div style={{ background: '#09090B', borderRadius: '12px', padding: '24px', color: '#fff' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Ready to get started?</h3>
                <p style={{ fontSize: '13px', color: '#ffffffbb', lineHeight: 1.6, marginBottom: '20px' }}>
                  {demoClass && spotsLeft > 0
                    ? `A free demo class is available for Grade ${demoClass.grade}th. ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining.`
                    : 'Join a batch and start your learning journey with expert guidance.'}
                </p>
                {demoClass && spotsLeft > 0 ? (
                  <button onClick={handleDemoClick} className="btn" style={{ width: '100%', background: '#fff', color: '#09090B', border: 'none', fontWeight: 700, marginBottom: '10px' }}>
                    Book Free Demo Class
                  </button>
                ) : null}
                <Link href="/sign-up" className="btn" style={{ width: '100%', display: 'block', textAlign: 'center', background: 'transparent', color: '#fff', border: '1px solid #ffffff33' }}>
                  {demoClass && spotsLeft > 0 ? 'Or Sign Up for a Batch' : 'Sign Up for Free'}
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer style={{ background: '#09090B', borderTop: '1px solid #27272A', padding: '28px 0', marginTop: '48px' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '1px', color: '#fff' }}>EDUSHA</span>
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
              <Link href="/" style={{ color: '#71717A' }}>Home</Link>
              <Link href="/privacy" style={{ color: '#71717A' }}>Privacy</Link>
              <Link href="/terms" style={{ color: '#71717A' }}>Terms</Link>
            </div>
            <span style={{ fontSize: '13px', color: '#52525B' }}>&copy; {new Date().getFullYear()} EDUSHA</span>
          </div>
        </footer>

      </div>
    </>
  );
}
