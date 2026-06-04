'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';

interface PublicDemoClass {
  id: number;
  title: string;
  grade: string;
  scheduledAt: string;
  capacity: number;
  enrolledCount: number;
}

const FEATURES = [
  {
    icon: '◈',
    title: 'Live Interactive Sessions',
    desc: 'Real-time classes with direct educator access for doubt resolution and personalised guidance — no recordings, no delays.',
  },
  {
    icon: '◎',
    title: 'Exam-Focused Preparation',
    desc: 'Structured coverage for CBSE board exams, CUET, and IELTS — with targeted writing practice and conceptual clarity.',
  },
  {
    icon: '◇',
    title: 'Personalised Feedback',
    desc: 'Every student receives individual feedback on their writing, comprehension, and improvement areas every session.',
  },
];

const HOME_EDUCATORS = [
  {
    credentials: ['PGT English', 'CBSE Certified Trainer (ToT)', 'Head of Department', 'Delhi University PG'],
    subject: 'English · CBSE · IELTS · CUET',
    stats: [
      { value: '25+', label: 'Years Teaching' },
      { value: 'CBSE', label: '10 & 12 Board' },
      { value: 'IELTS', label: '& CUET' },
    ],
    excerpt: 'A student-centred approach combining conceptual clarity, structured writing practice, and personalised feedback — delivering consistent results across board, competitive, and international examinations.',
    href: '/teachers#educator-0',
  },
  {
    credentials: ['PG English', 'PG Political Science', 'NCERT Diploma', 'Content Developer'],
    subject: 'English · Literature · Language Development',
    stats: [
      { value: '3+', label: 'Years Teaching' },
      { value: 'NCERT', label: 'Content Dev.' },
      { value: '6–12', label: 'School Levels' },
    ],
    excerpt: 'A passionate educator with postgraduate qualifications in English and Political Science, contributing to educational content development and digital learning initiatives through NCERT.',
    href: '/teachers#educator-1',
  },
  {
    credentials: ['M.Sc. Chemistry', 'B.Ed. (RIE, NCERT)', 'Science Educator', 'Resource Designer'],
    subject: 'Science · Chemistry · Middle & Secondary',
    stats: [
      { value: '4+', label: 'Years Teaching' },
      { value: 'NCERT', label: 'RIE Trained' },
      { value: '6–10', label: 'School Levels' },
    ],
    excerpt: 'A passionate Science educator focused on developing conceptual understanding, scientific temperament, and problem-solving skills through engaging, interactive, and student-centred learning experiences.',
    href: '/teachers#educator-2',
  },
  {
    credentials: ["Master's in English", 'Advanced Diploma in German', 'B.Ed.', 'Content Developer'],
    subject: 'English · German · IELTS · CUET',
    stats: [
      { value: '10+', label: 'Years Teaching' },
      { value: 'German', label: 'Advanced Diploma' },
      { value: 'IELTS', label: '& CUET Prep' },
    ],
    excerpt: 'A seasoned English and German language educator with over 10 years of experience, specialising in IELTS, CUET preparation, and German language — combining conceptual clarity with personalised guidance.',
    href: '/teachers#educator-3',
  },
];


export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [demoClass, setDemoClass] = useState<PublicDemoClass | null>(null);
  const [stackOpen, setStackOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSignedIn) router.push('/dashboard');
  }, [isSignedIn, router]);

  useEffect(() => {
    api.get('/api/public/demo-class').then(setDemoClass).catch(() => null);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible'); }),
      { threshold: 0.1 },
    );
    document.querySelectorAll('.lp-animate').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [demoClass]);

  function handleBannerClick() {
    if (isSignedIn) {
      router.push('/dashboard/student/demo-class');
    } else {
      if (typeof window !== 'undefined') localStorage.setItem('pendingDemoRedirect', '1');
      router.push('/sign-up');
    }
  }

  const spotsLeft = demoClass ? demoClass.capacity - demoClass.enrolledCount : 0;
  const bannerText = demoClass
    ? `FREE DEMO CLASS  •  Grade ${demoClass.grade}th  •  "${demoClass.title}"  •  ${new Date(demoClass.scheduledAt).toLocaleDateString()} at ${new Date(demoClass.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  •  Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left  •  Click to register       `
    : '';

  return (
    <>
      <style>{`
        @keyframes lpTicker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .lp-ticker { display: inline-block; white-space: nowrap; animation: lpTicker 24s linear infinite; }

        .lp-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .lp-animate.lp-visible { opacity: 1; transform: translateY(0); }
        .lp-animate:nth-child(2) { transition-delay: 0.1s; }
        .lp-animate:nth-child(3) { transition-delay: 0.2s; }
        .lp-animate:nth-child(4) { transition-delay: 0.3s; }

        @keyframes lpHeroGlow {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.32; }
        }
        .lp-hero-glow {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, #ffffff22 0%, transparent 70%);
          animation: lpHeroGlow 6s ease-in-out infinite;
          pointer-events: none;
        }

        .lp-card-hover { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .lp-card-hover:hover { transform: translateY(-5px); box-shadow: 0 12px 32px rgba(0,0,0,0.10); }

        .lp-cred {
          display: inline-flex; align-items: center;
          padding: 4px 12px; font-size: 12px; font-weight: 600;
          border-radius: 99px; background: #09090B; color: #fff; letter-spacing: 0.2px;
        }

        .lp-icon {
          width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
          font-size: 20px; background: #09090B; color: #fff; border-radius: 12px;
          margin-bottom: 16px; flex-shrink: 0;
        }

        /* Stats strip */
        .lp-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .lp-stat-cell {
          text-align: center;
          padding: 28px 16px;
          border-right: 1px solid #E4E4E7;
        }
        .lp-stat-cell:last-child { border-right: none; }
        .lp-stat-value { font-size: 30px; font-weight: 800; letter-spacing: -1px; line-height: 1; }
        .lp-stat-label { font-size: 13px; color: #71717A; margin-top: 5px; font-weight: 500; }

        /* Section labels */
        .lp-section-label {
          font-size: 12px; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; color: #71717A; margin-bottom: 12px;
        }
        .lp-section-title {
          font-size: clamp(20px, 4vw, 32px); font-weight: 800;
          letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 16px;
        }

        .lp-cta-strip { background: #09090B; color: #fff; }

        /* Features grid */
        .lp-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

        /* Educator 2×2 grid */
        .lp-educator-deck { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 960px; margin: 0 auto; }
        .lp-educator-card {
          position: relative;
          display: flex; flex-direction: column; overflow: hidden;
          background: #fff; border: 1px solid #E4E4E7; border-top: 4px solid #09090B;
          border-radius: 16px; padding: 28px; cursor: pointer;
        }
        .lp-educator-inner { display: flex; flex-direction: column; height: 100%; }
        .lp-educator-stats {
          display: flex; flex-direction: row;
          background: #F4F4F5; border-radius: 10px; overflow: hidden;
        }
        .lp-educator-stat-item { flex: 1; padding: 12px 10px; text-align: center; }
        .lp-educator-stat-item + .lp-educator-stat-item { border-left: 1px solid #E4E4E7; }
        .lp-educator-stat-value { font-size: 15px; font-weight: 800; letter-spacing: -0.5px; }
        .lp-educator-stat-label { font-size: 10px; color: #71717A; margin-top: 2px; font-weight: 500; }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          /* Stats: 2×2 grid */
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-stat-cell { border-right: none; border-bottom: 1px solid #E4E4E7; padding: 20px 12px; }
          .lp-stat-cell:nth-child(odd) { border-right: 1px solid #E4E4E7; }
          .lp-stat-cell:nth-last-child(-n+2) { border-bottom: none; }
          .lp-stat-value { font-size: 24px; }

          /* Features: single column */
          .lp-features-grid { grid-template-columns: 1fr; }

          /* Educator deck: single column on mobile */
          .lp-educator-deck { grid-template-columns: 1fr; gap: 16px; }
          .lp-educator-card { height: auto; }

          /* Section padding */
          .lp-features-section { padding: 48px 0 !important; }
          .lp-educator-section { padding: 0 0 48px !important; }
          .lp-cta-section { padding: 48px 0 !important; }
        }

        @media (max-width: 480px) {
          /* Hide Sign In button — only show Join Free */
          .lp-nav-signin { display: none !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F4F4F5' }}>

        {/* ── Nav ── */}
        <header style={{ background: '#fff', borderBottom: '1px solid #E4E4E7', padding: '16px 0', position: 'sticky', top: 0, zIndex: 40 }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px' }}>EDUSHA</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/sign-in" className="btn lp-nav-signin">Sign In</Link>
              <Link href="/sign-up" className="btn btn-primary">Join Free</Link>
            </div>
          </div>
        </header>

        {/* ── Demo ticker ── */}
        {demoClass && spotsLeft > 0 && (
          <div onClick={handleBannerClick} style={{ background: '#09090B', color: '#fff', height: '36px', overflow: 'hidden', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: 500, letterSpacing: '0.3px' }}>
            <span className="lp-ticker">{bannerText}</span>
          </div>
        )}

        {/* ── Hero ── */}
        <section style={{ background: '#09090B', color: '#fff', padding: 'clamp(48px, 10vw, 96px) 0 clamp(40px, 8vw, 80px)', position: 'relative', overflow: 'hidden' }}>
          <div className="lp-hero-glow" style={{ top: '-200px', right: '-100px' }} />
          <div className="lp-hero-glow" style={{ bottom: '-200px', left: '-100px', animationDelay: '3s' }} />

          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: '680px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: '#ffffff14', border: '1px solid #ffffff22', borderRadius: '99px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#ffffffaa', marginBottom: '24px' }}>
                CBSE · IELTS · CUET
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 7vw, 56px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '16px' }}>
                Excellence<br />in Education.
              </h1>
              <p style={{ fontSize: 'clamp(14px, 2.5vw, 17px)', color: '#ffffffbb', lineHeight: 1.7, marginBottom: '32px', maxWidth: '520px' }}>
                Expert-led classes for CBSE, IELTS, and CUET. Live sessions, personalised feedback, and results you can count on.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/sign-up" className="btn" style={{ background: '#fff', color: '#09090B', border: 'none', padding: '12px 24px', fontSize: '15px', fontWeight: 700 }}>
                  Get Started Free
                </Link>
                <Link href="/teachers" className="btn" style={{ background: 'transparent', color: '#fff', border: '1px solid #ffffff44', padding: '12px 24px', fontSize: '15px' }}>
                  Meet Our Educators
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section style={{ background: '#fff', borderBottom: '1px solid #E4E4E7' }}>
          <div className="container">
            <div className="lp-stats-grid">
              {[
                { value: '4', label: 'Expert Educators' },
                { value: 'CBSE', label: 'Classes 10 & 12' },
                { value: 'IELTS', label: '& CUET Coaching' },
                { value: 'Live', label: 'Interactive Classes' },
              ].map((s, i) => (
                <div key={i} className="lp-stat-cell lp-animate">
                  <div className="lp-stat-value">{s.value}</div>
                  <div className="lp-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="lp-features-section" style={{ padding: '72px 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '40px' }} className="lp-animate">
              <div className="lp-section-label">Why EDUSHA</div>
              <div className="lp-section-title">Everything you need to excel</div>
              <p style={{ fontSize: '15px', color: '#71717A', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
                A complete academic environment built around your success in board exams and beyond.
              </p>
            </div>
            <div className="lp-features-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="lp-card-hover lp-animate" style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div className="lp-icon">{f.icon}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.2px' }}>{f.title}</h3>
                  <p style={{ fontSize: '14px', color: '#71717A', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Educator stack ── */}
        <section className="lp-educator-section" style={{ padding: '0 0 72px' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '32px' }} className="lp-animate">
              <div className="lp-section-label">Our Educators</div>
              <div className="lp-section-title">Expert guidance, proven results</div>
              <p style={{ fontSize: '14px', color: '#71717A', marginTop: '8px' }}>Click any card to view full profile</p>
            </div>

            <div className="lp-animate lp-educator-deck">
              {HOME_EDUCATORS.map((edu, idx) => (
                <div
                  key={idx}
                  className="lp-educator-card"
                  onClick={() => router.push(edu.href)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    boxShadow: hoveredIdx === idx
                      ? '0 16px 40px rgba(0,0,0,0.13)'
                      : '0 2px 12px rgba(0,0,0,0.08)',
                    transform: hoveredIdx === idx ? 'translateY(-8px)' : 'none',
                    transition: 'transform 0.28s ease, box-shadow 0.28s ease',
                  }}
                >
                  <div className="lp-educator-inner">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {edu.credentials.map((c, i) => (
                        <span key={i} className="lp-cred">{c}</span>
                      ))}
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                      {edu.subject}
                    </p>
                    <p style={{ fontSize: '13px', color: '#3F3F46', lineHeight: 1.65, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                      {edu.excerpt}
                    </p>
                    <div className="lp-educator-stats" style={{ marginTop: '16px' }}>
                      {edu.stats.map((s, i) => (
                        <div key={i} className="lp-educator-stat-item">
                          <div className="lp-educator-stat-value">{s.value}</div>
                          <div className="lp-educator-stat-label">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
                      <Link
                        href={edu.href}
                        className="btn btn-primary"
                        style={{ fontSize: '13px', padding: '8px 16px' }}
                        onClick={e => e.stopPropagation()}
                      >
                        View Full Profile
                      </Link>
                      {idx === 0 && demoClass && spotsLeft > 0 && (
                        <button className="btn" onClick={e => { e.stopPropagation(); handleBannerClick(); }} style={{ fontSize: '13px', padding: '8px 16px' }}>
                          Book a Demo Class
                        </button>
                      )}
                      {idx === 0 && !(demoClass && spotsLeft > 0) && (
                        <Link href="/sign-up" className="btn" style={{ fontSize: '13px', padding: '8px 16px' }} onClick={e => e.stopPropagation()}>
                          Join a Batch
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA dark strip ── */}
        <section className="lp-cta-strip lp-cta-section" style={{ padding: '64px 0' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="lp-animate">
              <div style={{ fontSize: 'clamp(20px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', marginBottom: '12px' }}>
                Ready to achieve your best results?
              </div>
              <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: '#ffffffbb', marginBottom: '32px', maxWidth: '440px', margin: '0 auto 32px', lineHeight: 1.6 }}>
                Join EDUSHA today and get access to live sessions, study resources, and expert feedback.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/sign-up" className="btn" style={{ background: '#fff', color: '#09090B', border: 'none', padding: '12px 28px', fontSize: '15px', fontWeight: 700 }}>
                  Sign Up for Free
                </Link>
                {demoClass && spotsLeft > 0 && (
                  <button className="btn" onClick={handleBannerClick} style={{ background: 'transparent', color: '#fff', border: '1px solid #ffffff44', padding: '12px 28px', fontSize: '15px' }}>
                    Try a Demo Class
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ background: '#09090B', borderTop: '1px solid #27272A', padding: '28px 0' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '1px', color: '#fff' }}>EDUSHA</span>
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
              <Link href="/teachers" style={{ color: '#71717A' }}>Our Educators</Link>
              <Link href="/privacy" style={{ color: '#71717A' }}>Privacy</Link>
              <Link href="/terms" style={{ color: '#71717A' }}>Terms</Link>
            </div>
            <span style={{ fontSize: '13px', color: '#52525B' }}>
              &copy; {new Date().getFullYear()} EDUSHA. All rights reserved.
            </span>
          </div>
        </footer>

      </div>
    </>
  );
}
