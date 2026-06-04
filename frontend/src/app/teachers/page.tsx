'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface PublicDemoClass {
  id: number;
  grade: string;
  capacity: number;
  enrolledCount: number;
}

const EDUCATORS = [
  {
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
  },
  {
    tagline: 'English & Political Science | Middle & Senior School | NCERT Content Developer | 3+ Years Experience',
    credentials: [
      { label: 'PG in English', note: 'Post Graduate' },
      { label: 'PG in Political Science', note: 'Post Graduate' },
      { label: 'NCERT Diploma', note: 'English Language Pedagogy' },
      { label: 'Content Developer', note: 'NCERT Digital Learning' },
    ],
    stats: [
      { value: '3+', label: 'Years of Experience' },
      { value: 'NCERT', label: 'Content Developer' },
      { value: '6–12', label: 'School Levels' },
      { value: 'PG', label: 'Dual Postgraduate' },
    ],
    bio: 'A passionate educator with postgraduate qualifications in English and Political Science, along with a Diploma in English Language Pedagogy from NCERT. With over three years of teaching experience, she has worked with learners across middle and senior school levels, focusing on language development, literature, writing, and effective communication.',
    approach:
      'Alongside classroom teaching, she has contributed to educational content development and digital learning initiatives through her association with NCERT. Her student-centred approach combines conceptual clarity, interactive learning, and personalised guidance to help students build confidence, strengthen communication skills, and achieve academic success.',
    specialisations: [
      'English Language Development',
      'Literature & Literary Analysis',
      'Writing Skills & Composition',
      'Effective Communication',
      'Middle School English (Classes 6–8)',
      'Senior School English (Classes 9–12)',
      'Educational Content Development',
      'Digital Learning Initiatives',
    ],
    examsCovered: ['CBSE Board Exams', 'School Internal Assessments', 'Language Proficiency'],
  },
  {
    tagline: 'Science Educator | Chemistry | Middle & Secondary School | 4+ Years Experience',
    credentials: [
      { label: 'M.Sc. Chemistry', note: 'Banasthali Vidyapith' },
      { label: 'B.Ed.', note: 'Regional Institute of Education, NCERT' },
      { label: 'Science Educator', note: 'Middle & Secondary School' },
      { label: 'Resource Designer', note: 'Assessments & Student Activities' },
    ],
    stats: [
      { value: '4+', label: 'Years of Experience' },
      { value: 'NCERT', label: 'RIE Trained' },
      { value: '6–10', label: 'School Levels' },
      { value: 'Chem', label: 'Core Specialisation' },
    ],
    bio: 'A passionate Science educator with an M.Sc. in Chemistry from Banasthali Vidyapith and a B.Ed. from the Regional Institute of Education (NCERT), with over four years of teaching experience. Having worked with learners across middle and secondary school levels, she focuses on developing conceptual understanding, scientific temperament, analytical thinking, and problem-solving skills through engaging and interactive learning experiences.',
    approach:
      'Alongside classroom teaching, she has been actively involved in designing learning resources, assessments, and student-centred activities that promote curiosity and academic growth. Her teaching approach combines conceptual clarity, practical application, and personalised guidance to help students build confidence, strengthen scientific reasoning, and achieve academic success. Committed to fostering a love for science and lifelong learning, she strives to create an encouraging environment where students are empowered to explore, question, think critically, and develop a deeper understanding of the world around them.',
    specialisations: [
      'Conceptual Understanding & Scientific Temperament',
      'Analytical Thinking & Problem Solving',
      'Middle School Science (Classes 6–8)',
      'Secondary School Science (Classes 9–10)',
      'Chemistry — Organic, Inorganic & Physical',
      'Learning Resource & Assessment Design',
      'Student-Centred & Interactive Learning',
      'Practical Application of Scientific Concepts',
    ],
    examsCovered: ['CBSE Board Exams', 'Science Olympiads', 'School Internal Assessments'],
  },
  {
    tagline: 'English & German Educator | IELTS · CUET · German | Middle & Senior School | 10+ Years Experience',
    credentials: [
      { label: "Master's in English", note: 'Delhi University' },
      { label: 'Advanced Diploma in German', note: 'Delhi University' },
      { label: 'B.Ed.', note: 'Bachelor of Education' },
      { label: 'Content Developer', note: 'Educational Platforms' },
    ],
    stats: [
      { value: '10+', label: 'Years of Experience' },
      { value: 'IELTS', label: '& CUET Prep' },
      { value: 'German', label: 'Advanced Diploma' },
      { value: '6–12', label: 'School Levels' },
    ],
    bio: "A seasoned educator with expertise in language, holding a Master's degree in English, a B.Ed., and an Advanced Diploma in German Language from Delhi University. With over 10 years of teaching experience, she has worked with learners across middle, secondary, and senior secondary levels, focusing on English language development, literature, writing, and effective communication.",
    approach:
      'She specialises in English, IELTS, CUET preparation, and German language, helping students strengthen their language proficiency, critical thinking, and academic performance. Her student-centred approach combines conceptual clarity, interactive learning, and personalised guidance to build confidence and foster a genuine interest in learning. Alongside classroom teaching, she has contributed to educational content development through her association with various educational platforms. Known for her innovative teaching methods and commitment to student success, she strives to empower learners with the skills, confidence, and knowledge needed to excel academically and communicate effectively in an increasingly global world.',
    specialisations: [
      'English Language Development & Literature',
      'Writing Skills & Effective Communication',
      'IELTS Preparation (All Bands)',
      'CUET English Language Module',
      'German Language (Beginner to Advanced)',
      'Critical Thinking & Academic Performance',
      'Middle School English (Classes 6–8)',
      'Senior Secondary English (Classes 9–12)',
    ],
    examsCovered: ['CBSE Board Exams', 'IELTS', 'CUET', 'German Language Certifications', 'School Internal Assessments'],
  },
];

export default function TeachersPage() {
  const [demoClass, setDemoClass] = useState<PublicDemoClass | null>(null);

  useEffect(() => {
    api.get('/api/public/demo-class').then(setDemoClass).catch(() => null);
  }, []);

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
        .tp-cred-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }

        .tp-spec-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid #F4F4F5;
          font-size: 14px; color: #3F3F46; line-height: 1.5;
        }
        .tp-spec-item:last-child { border-bottom: none; }
        .tp-spec-dot {
          width: 6px; height: 6px; background: #09090B;
          border-radius: 50%; flex-shrink: 0; margin-top: 6px;
        }

        /* Main 2-col grid */
        .tp-main-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 24px;
          align-items: start;
        }

        /* Stats 2×2 */
        .tp-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); }

        /* Credentials 2-col */
        .tp-creds-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

        /* Card padding helper */
        .tp-card { background: #fff; border: 1px solid #E4E4E7; border-radius: 12px; padding: 24px; }

        @media (max-width: 768px) {
          .tp-main-grid { grid-template-columns: 1fr; }
          .tp-creds-grid { grid-template-columns: 1fr; }
          .tp-card { padding: 16px; }

          /* On mobile, right sidebar renders after left column naturally */
        }

        @media (max-width: 480px) {
          .tp-spec-item { font-size: 13px; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F4F4F5' }}>

        {/* ── Nav ── */}
        <header style={{ background: '#fff', borderBottom: '1px solid #E4E4E7', padding: '16px 0', position: 'sticky', top: 0, zIndex: 40 }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px', color: '#09090B' }}>EDUSHA</Link>
            <Link href="/" className="btn" style={{ fontSize: '13px' }}>← Back to Home</Link>
          </div>
        </header>

        {/* ── Hero strip ── */}
        <div style={{ background: '#09090B', color: '#fff', padding: 'clamp(32px, 6vw, 48px) 0 clamp(28px, 5vw, 40px)' }}>
          <div className="container">
            <div style={{ display: 'inline-block', background: '#ffffff14', border: '1px solid #ffffff22', borderRadius: '99px', padding: '5px 14px', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#ffffffaa', marginBottom: '16px' }}>
              Our Educators
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.15, marginBottom: '12px' }}>
              Meet Our Educators
            </h1>
            <p style={{ fontSize: 'clamp(13px, 2vw, 15px)', color: '#ffffffbb', maxWidth: '560px', lineHeight: 1.6 }}>
              Expert educators bringing decades of combined experience across CBSE, IELTS, CUET, and language development.
            </p>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="container" style={{ padding: '32px 24px 0', display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {EDUCATORS.map((edu, idx) => (
            <div key={idx} id={`educator-${idx}`} style={{ scrollMarginTop: '80px' }}>
              {idx > 0 && <div style={{ borderTop: '1px solid #E4E4E7', marginBottom: '40px' }} />}
              <div className="tp-main-grid">

                {/* ── Left column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* About */}
                  <div className="tp-card" style={{ borderLeft: '4px solid #09090B' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>About</h2>
                    <p style={{ fontSize: '15px', color: '#3F3F46', lineHeight: 1.8, marginBottom: '14px' }}>{edu.bio}</p>
                    <p style={{ fontSize: '15px', color: '#3F3F46', lineHeight: 1.8 }}>{edu.approach}</p>
                  </div>

                  {/* Credentials */}
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Credentials & Qualifications</h2>
                    <div className="tp-creds-grid">
                      {edu.credentials.map((c, i) => (
                        <div key={i} className="tp-cred-card">
                          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '3px' }}>{c.label}</div>
                          <div style={{ fontSize: '12px', color: '#71717A' }}>{c.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Specialisations */}
                  <div className="tp-card">
                    <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Areas of Specialisation</h2>
                    {edu.specialisations.map((s, i) => (
                      <div key={i} className="tp-spec-item">
                        <div className="tp-spec-dot" />
                        {s}
                      </div>
                    ))}
                  </div>

                </div>

                {/* ── Right column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Stats 2×2 */}
                  <div style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="tp-stats-grid">
                      {edu.stats.map((s, i) => (
                        <div key={i} style={{
                          padding: '18px 16px',
                          borderRight: i % 2 === 0 ? '1px solid #E4E4E7' : 'none',
                          borderBottom: i < 2 ? '1px solid #E4E4E7' : 'none',
                        }}>
                          <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
                          <div style={{ fontSize: '12px', color: '#71717A', marginTop: '4px', fontWeight: 500 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exams covered */}
                  <div className="tp-card">
                    <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#71717A', marginBottom: '12px' }}>Exams Covered</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {edu.examsCovered.map((e, i) => (
                        <span key={i} className="badge" style={{ fontSize: '13px' }}>{e}</span>
                      ))}
                    </div>
                  </div>

                  {/* Demo class notice — only on first educator */}
                  {idx === 0 && demoClass && spotsLeft > 0 && (
                    <div style={{ background: '#F4F4F5', border: '1px solid #E4E4E7', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#71717A', marginBottom: '8px' }}>Demo Class Available</div>
                      <p style={{ fontSize: '13px', color: '#3F3F46', lineHeight: 1.6 }}>
                        Free demo class scheduled for Grade {demoClass.grade}th — {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} remaining.
                      </p>
                      <Link href="/" style={{ fontSize: '13px', color: '#09090B', fontWeight: 600, display: 'inline-block', marginTop: '10px' }}>
                        Learn more →
                      </Link>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}

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
