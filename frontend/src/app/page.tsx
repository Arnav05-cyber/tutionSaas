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

const EDUCATOR = {
  tagline: 'English Educator | CBSE Classes 10 & 12 | IELTS & CUET | 25+ Years Experience',
  credentials: ['PGT English', 'CBSE Certified Trainer (ToT)', 'Head of Department', 'Delhi University PG'],
  stats: [
    { value: '25+', label: 'Years Teaching' },
    { value: 'CBSE', label: '10 & 12 Board' },
    { value: 'IELTS', label: '& CUET Coaching' },
  ],
  excerpt:
    'A student-centred approach combining conceptual clarity, structured writing practice, and personalised feedback — delivering consistent results across board, competitive, and international examinations.',
};

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [demoClass, setDemoClass] = useState<PublicDemoClass | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSignedIn) router.push('/dashboard');
  }, [isSignedIn, router]);

  useEffect(() => {
    api.get('/api/public/demo-class').then(setDemoClass).catch(() => null);
  }, []);

  // Scroll-triggered fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible'); }),
      { threshold: 0.12 },
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
        /* ── Ticker ── */
        @keyframes lpTicker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .lp-ticker { display: inline-block; white-space: nowrap; animation: lpTicker 24s linear infinite; }

        /* ── Scroll fade-in ── */
        .lp-animate {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .lp-animate.lp-visible { opacity: 1; transform: translateY(0); }
        .lp-animate:nth-child(2) { transition-delay: 0.1s; }
        .lp-animate:nth-child(3) { transition-delay: 0.2s; }
        .lp-animate:nth-child(4) { transition-delay: 0.3s; }

        /* ── Hero grid bg ── */
        @keyframes lpHeroGlow {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.32; }
        }
        .lp-hero-glow {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, #ffffff22 0%, transparent 70%);
          animation: lpHeroGlow 6s ease-in-out infinite;
          pointer-events: none;
        }

        /* ── Hover lift ── */
        .lp-card-hover {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .lp-card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.10);
        }

        /* ── Educator card credential tag ── */
        .lp-cred {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 99px;
          background: #09090B;
          color: #fff;
          letter-spacing: 0.2px;
        }

        /* ── Feature icon ── */
        .lp-icon {
          width: 48px; height: 48px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          background: #09090B;
          color: #fff;
          border-radius: 12px;
          margin-bottom: 16px;
          flex-shrink: 0;
        }

        /* ── Stat pill ── */
        .lp-stat {
          text-align: center;
          padding: 24px 16px;
        }
        .lp-stat-value {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1;
        }
        .lp-stat-label {
          font-size: 13px;
          color: #71717A;
          margin-top: 4px;
          font-weight: 500;
        }

        /* ── Divider ── */
        .lp-divider {
          width: 1px;
          background: #E4E4E7;
          align-self: stretch;
          margin: 12px 0;
        }

        /* ── Section headings ── */
        .lp-section-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #71717A;
          margin-bottom: 12px;
        }
        .lp-section-title {
          font-size: clamp(22px, 4vw, 32px);
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.2;
          margin-bottom: 16px;
        }

        /* ── CTA dark strip ── */
        .lp-cta-strip {
          background: #09090B;
          color: #fff;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .lp-features-grid { grid-template-columns: 1fr !important; }
          .lp-stats-row { flex-direction: column !important; }
          .lp-divider { width: 100% !important; height: 1px !important; margin: 0 !important; }
          .lp-educator-inner { flex-direction: column !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F4F4F5' }}>

        {/* ── Nav ── */}
        <header style={{ background: '#fff', borderBottom: '1px solid #E4E4E7', padding: '16px 0', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(8px)' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px' }}>EDUSHA</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/sign-in" className="btn">Sign In</Link>
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
        <section style={{ background: '#09090B', color: '#fff', padding: '96px 0 80px', position: 'relative', overflow: 'hidden' }}>
          {/* Background glow */}
          <div className="lp-hero-glow" style={{ top: '-200px', right: '-100px' }} />
          <div className="lp-hero-glow" style={{ bottom: '-200px', left: '-100px', animationDelay: '3s' }} />

          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: '680px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ffffff14', border: '1px solid #ffffff22', borderRadius: '99px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#ffffffaa', marginBottom: '28px' }}>
                CBSE · IELTS · CUET
              </div>
              <h1 style={{ fontSize: 'clamp(32px, 7vw, 56px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '20px' }}>
                Excellence<br />in Education.
              </h1>
              <p style={{ fontSize: '17px', color: '#ffffffbb', lineHeight: 1.7, marginBottom: '36px', maxWidth: '520px' }}>
                Expert-led English classes for CBSE Classes 10 &amp; 12, IELTS, and CUET. Live sessions, personalised feedback, and results you can count on.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/sign-up" className="btn" style={{ background: '#fff', color: '#09090B', border: 'none', padding: '12px 28px', fontSize: '15px', fontWeight: 700 }}>
                  Get Started Free
                </Link>
                <Link href="/teachers" className="btn" style={{ background: 'transparent', color: '#fff', border: '1px solid #ffffff44', padding: '12px 28px', fontSize: '15px' }}>
                  Meet Our Educator
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section style={{ background: '#fff', borderBottom: '1px solid #E4E4E7' }}>
          <div className="container">
            <div className="lp-stats-row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', flexWrap: 'wrap' }}>
              {[
                { value: '25+', label: 'Years Teaching' },
                { value: 'CBSE', label: 'Classes 10 & 12' },
                { value: 'IELTS', label: '& CUET Coaching' },
                { value: 'Live', label: 'Interactive Classes' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <div className="lp-divider" />}
                  <div className="lp-stat lp-animate">
                    <div className="lp-stat-value">{s.value}</div>
                    <div className="lp-stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ padding: '80px 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }} className="lp-animate">
              <div className="lp-section-label">Why EDUSHA</div>
              <div className="lp-section-title">Everything you need to excel</div>
              <p style={{ fontSize: '15px', color: '#71717A', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
                A complete academic environment built around your success in board exams and beyond.
              </p>
            </div>

            <div className="lp-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {FEATURES.map((f, i) => (
                <div key={i} className="lp-card-hover lp-animate" style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div className="lp-icon">{f.icon}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.2px' }}>{f.title}</h3>
                  <p style={{ fontSize: '14px', color: '#71717A', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Educator card ── */}
        <section style={{ padding: '0 0 80px' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '36px' }} className="lp-animate">
              <div className="lp-section-label">Our Educator</div>
              <div className="lp-section-title">Expert guidance, proven results</div>
            </div>

            <div className="lp-animate lp-card-hover" style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: '16px', padding: '36px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #09090B', maxWidth: '860px', margin: '0 auto' }}>
              <div className="lp-educator-inner" style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

                {/* Left — credentials + bio */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    {EDUCATOR.credentials.map((c, i) => (
                      <span key={i} className="lp-cred">{c}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    English · CBSE · IELTS · CUET
                  </p>
                  <p style={{ fontSize: '15px', color: '#3F3F46', lineHeight: 1.75, marginBottom: '24px' }}>
                    {EDUCATOR.excerpt}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link href="/teachers" className="btn btn-primary" style={{ fontSize: '14px' }}>
                      View Full Profile
                    </Link>
                    {demoClass && spotsLeft > 0 ? (
                      <button className="btn" onClick={handleBannerClick} style={{ fontSize: '14px' }}>
                        Book a Demo Class
                      </button>
                    ) : (
                      <Link href="/sign-up" className="btn" style={{ fontSize: '14px' }}>
                        Join a Batch
                      </Link>
                    )}
                  </div>
                </div>

                {/* Right — stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0', minWidth: '160px', background: '#F4F4F5', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                  {EDUCATOR.stats.map((s, i) => (
                    <div key={i} style={{ padding: '20px 24px', borderBottom: i < EDUCATOR.stats.length - 1 ? '1px solid #E4E4E7' : 'none' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>{s.value}</div>
                      <div style={{ fontSize: '12px', color: '#71717A', marginTop: '2px', fontWeight: 500 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ── CTA dark strip ── */}
        <section className="lp-cta-strip" style={{ padding: '72px 0' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="lp-animate">
              <div style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', marginBottom: '12px' }}>
                Ready to achieve your best results?
              </div>
              <p style={{ fontSize: '16px', color: '#ffffffbb', marginBottom: '32px', maxWidth: '440px', margin: '0 auto 32px', lineHeight: 1.6 }}>
                Join EDUSHA today and get access to live sessions, study resources, and expert feedback.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/sign-up" className="btn" style={{ background: '#fff', color: '#09090B', border: 'none', padding: '12px 32px', fontSize: '15px', fontWeight: 700 }}>
                  Sign Up for Free
                </Link>
                {demoClass && spotsLeft > 0 && (
                  <button className="btn" onClick={handleBannerClick} style={{ background: 'transparent', color: '#fff', border: '1px solid #ffffff44', padding: '12px 32px', fontSize: '15px' }}>
                    Try a Demo Class
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ background: '#09090B', borderTop: '1px solid #27272A', padding: '32px 0' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '1px', color: '#fff' }}>EDUSHA</span>
            <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#71717A' }}>
              <Link href="/teachers" style={{ color: '#71717A' }}>Our Educator</Link>
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
