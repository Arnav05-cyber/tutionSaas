import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — EDUSHA',
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>← Back</Link>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Terms of Service</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '40px' }}>
          Last updated: 2 June 2026
        </p>

        <Section title="1. Acceptance">
          <p>
            By creating an account or using the EDUSHA platform you agree to be bound by these Terms of
            Service and our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use
            the platform.
          </p>
        </Section>

        <Section title="2. Services">
          <p>
            EDUSHA provides an education management platform enabling students, teachers, and parents to
            manage batches, sessions, attendance, resources, and fee payments. Access is provided
            role-based: Admin, Teacher, Student, or Parent.
          </p>
        </Section>

        <Section title="3. Eligibility">
          <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
            <li>You must be at least 13 years old to create an account.</li>
            <li>Students under 18 require parental consent. Use of the platform by a minor constitutes parental consent.</li>
            <li>Teacher accounts require a valid admin-issued invite link.</li>
          </ul>
        </Section>

        <Section title="4. User Obligations">
          <p>You agree to:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', lineHeight: '2' }}>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Keep your login credentials confidential</li>
            <li>Not share your account with others</li>
            <li>Not use the platform for any unlawful purpose</li>
            <li>Not attempt to reverse-engineer, disrupt, or circumvent any security feature</li>
            <li>Not upload content that is defamatory, obscene, or violates third-party rights</li>
          </ul>
        </Section>

        <Section title="5. Payment Terms">
          <p>
            Monthly fees are processed via Razorpay. By initiating a payment you agree to Razorpay&apos;s
            terms and conditions. All fees are listed in Indian Rupees (INR) and are non-refundable
            unless otherwise specified by the administration.
          </p>
        </Section>

        <Section title="6. Account Suspension and Termination">
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms, fail to pay
            applicable fees, or engage in conduct harmful to other users or the platform. You may request
            deletion of your account at any time by contacting our Grievance Officer.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            All platform software, design, and branding are owned by EDUSHA. Study materials uploaded by
            teachers remain the intellectual property of the respective uploader; by uploading you grant
            EDUSHA a limited licence to store and display the material to enrolled students.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, EDUSHA shall not be liable for indirect, incidental,
            or consequential damages arising from your use of the platform. Our total liability shall not
            exceed the fees paid by you in the 3 months preceding the claim.
          </p>
        </Section>

        <Section title="9. Governing Law and Dispute Resolution">
          <p>
            These terms are governed by the laws of India. Any dispute shall first be referred to our
            Grievance Officer. Unresolved disputes shall be subject to the exclusive jurisdiction of
            courts in India.
          </p>
        </Section>

        <Section title="10. Changes">
          <p>
            We may modify these terms at any time. Continued use after changes constitutes acceptance.
            Material changes will be notified via email.
          </p>
        </Section>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)' }}>
          <p>EDUSHA &mdash; Education Management Platform</p>
          <p style={{ marginTop: '4px' }}>
            Grievance Officer: <a href="mailto:arnav.vyas06@gmail.com">arnav.vyas06@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>{title}</h2>
      <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text)' }}>
        {children}
      </div>
    </div>
  );
}
