import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — EDUSHA',
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>← Back</Link>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Privacy Policy</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '40px' }}>
          Last updated: 2 June 2026
        </p>

        <Section title="1. Introduction">
          <p>
            EDUSHA (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates an education management
            platform at edusha.in. This Privacy Policy describes how we collect, use, store, and protect your
            personal information in accordance with the <strong>Information Technology Act, 2000</strong> and
            the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive
            Personal Data or Information) Rules, 2011</strong> (&ldquo;SPDI Rules&rdquo;).
          </p>
          <p style={{ marginTop: '12px' }}>
            By using our platform you consent to the collection and use of information as described herein.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We collect the following personal and sensitive personal data:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', lineHeight: '2' }}>
            <li><strong>Identity data:</strong> Full name, email address, phone number</li>
            <li><strong>Academic data:</strong> Grade, batch enrolment, attendance records</li>
            <li><strong>Financial data (teachers only):</strong> UPI ID, bank account number, pay-per-class rate</li>
            <li><strong>Payment data (students/parents):</strong> Razorpay order and payment IDs (we do <em>not</em> store card numbers or CVVs)</li>
            <li><strong>Usage data:</strong> Session join logs, resource access, queries submitted</li>
            <li><strong>Profile data:</strong> LinkedIn URL (teachers, optional), qualification, bio</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            Financial data such as UPI IDs and bank account numbers constitutes <em>sensitive personal data or
            information</em> (SPDI) under the SPDI Rules and is handled with heightened care.
          </p>
        </Section>

        <Section title="3. Purpose of Collection">
          <p>We collect your data solely to:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', lineHeight: '2' }}>
            <li>Create and manage your account on the platform</li>
            <li>Facilitate class scheduling, attendance tracking, and resource sharing</li>
            <li>Process fee payments via Razorpay</li>
            <li>Calculate and disburse teacher remuneration</li>
            <li>Send session reminders and administrative notices</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            We do not use your data for advertising, and we do not sell it to third parties.
          </p>
        </Section>

        <Section title="4. Disclosure and Third-Party Sharing">
          <p>Your data is shared only with the following processors, each bound by their own privacy commitments:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', lineHeight: '2' }}>
            <li><strong>Clerk (clerk.com)</strong> — Authentication and identity management</li>
            <li><strong>Razorpay (razorpay.com)</strong> — Payment processing (PCI-DSS compliant)</li>
            <li><strong>Supabase (supabase.com)</strong> — File/document storage</li>
            <li><strong>Render / Railway</strong> — Cloud hosting infrastructure</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            We may disclose data to law-enforcement or regulatory authorities if required by law.
            No other disclosure occurs without your explicit consent.
          </p>
        </Section>

        <Section title="5. Data Retention">
          <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
            <li>Account and profile data is retained for the duration of your active account.</li>
            <li>Payment records are retained for 8 years as required by Indian tax regulations.</li>
            <li>Attendance and session logs are retained for 3 years.</li>
            <li>Upon account deletion all data except legally mandated payment records is permanently erased.</li>
          </ul>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', lineHeight: '2' }}>
            <li><strong>Access</strong> — Request a copy of the personal data we hold about you</li>
            <li><strong>Correction</strong> — Request correction of inaccurate or incomplete data</li>
            <li><strong>Erasure</strong> — Request deletion of your account and associated data</li>
            <li><strong>Withdrawal of consent</strong> — Withdraw consent at any time; this may affect your ability to use the platform</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            To exercise any of these rights, contact our Grievance Officer (see Section 9).
          </p>
        </Section>

        <Section title="7. Security Practices">
          <p>
            We implement reasonable security practices as required under Section 43A of the IT Act, including:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', lineHeight: '2' }}>
            <li>TLS/HTTPS encryption for all data in transit</li>
            <li>Role-based access control — users can only access data relevant to their role</li>
            <li>Audit logging for sensitive administrative actions</li>
            <li>Third-party authentication (Clerk) with no local password storage</li>
            <li>Payment tokenisation via Razorpay — card data never touches our servers</li>
            <li>HTTP security headers (HSTS, CSP, X-Frame-Options, etc.)</li>
          </ul>
        </Section>

        <Section title="8. Cookies">
          <p>
            We use session cookies set by Clerk for authentication purposes only. We do not use tracking or
            advertising cookies.
          </p>
        </Section>

        <Section title="9. Grievance Officer">
          <p>
            In accordance with Rule 6 of the SPDI Rules, the details of our Grievance Officer are:
          </p>
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'var(--bg)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            lineHeight: '2',
          }}>
            <p><strong>Name:</strong> Arnav Vyas</p>
            <p><strong>Designation:</strong> Grievance Officer</p>
            <p><strong>Email:</strong>{' '}
              <a href="mailto:arnav.vyas06@gmail.com">arnav.vyas06@gmail.com</a>
            </p>
            <p><strong>Response time:</strong> Within 30 days of receipt of complaint</p>
          </div>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this policy periodically. Continued use of the platform after changes constitutes
            acceptance. Material changes will be notified via email.
          </p>
        </Section>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)' }}>
          <p>EDUSHA &mdash; Education Management Platform</p>
          <p style={{ marginTop: '4px' }}>
            Questions? Email us at <a href="mailto:arnav.vyas06@gmail.com">arnav.vyas06@gmail.com</a>
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
