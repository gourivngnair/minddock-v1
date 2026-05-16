import { useEffect } from 'react';

interface Props {
  doc: 'privacy' | 'terms';
  onClose: () => void;
}

const CONTACT_EMAIL = 'privacy@minddock.app';
const GOVERNING_LAW = 'Kerala, India';

type Section = { heading: string | null; body?: string; items?: string[] };

const PRIVACY: Section[] = [
  {
    heading: null,
    body: `Effective Date: May 17, 2026\nLast Updated: May 17, 2026\n\nThis Privacy Policy describes how MindDock ("we," "us," or "our") collects, uses, processes, and discloses your information when you use our application.\n\nMindDock is built as an offline-first, capacity-aware coaching application designed specifically for adults with ADHD. We are deeply committed to protecting your privacy. We do not sell your data, and we do not use your personal information to train third-party public AI models.`,
  },
  {
    heading: '1. Information We Collect',
    body: `Because MindDock operates as a local-first application, much of your data is stored directly on your device (localStorage). To synchronize your experience across devices, data is securely backed up to our cloud backend.`,
  },
  {
    heading: 'A. Personal Data You Provide',
    items: [
      'Account Information: Your name (or alias), email address, and authentication credentials.',
      'ADHD Profile & Symptoms: Cognitive challenges selected during onboarding (e.g., Time Blindness, Executive Dysfunction, Hyperfocus, Working Memory, Rejection Sensitivity, Overwhelm).',
      'Tasks & Commitments: Task titles, descriptions, categories, priorities, estimates, deadlines, and delegation details.',
      'Mood & Thoughts: Mood ratings and open-text reflections.',
      'Energy Levels: Timestamped energy scores (1–5).',
      'Meal Tracking: Meal descriptions and ratings.',
      'Sleep Logs: Bedtime, wake time, and perceived sleep quality.',
    ],
  },
  {
    heading: 'B. Data Generated Automatically',
    body: `To fuel the Time-Blindness Coach and capacity scoring, the app automatically computes:`,
    items: [
      'Time-Blindness Multiplier (B): B_new = B_old × 0.7 + (Actual ÷ Estimated) × 0.3 — an EWMA that learns how long tasks actually take you.',
      'XP & Levels: Gamification milestones earned through interaction.',
      'Pattern History: A rolling 30-day snapshot of tasks completed, focus sessions, and average energy.',
    ],
  },
  {
    heading: 'C. Media & Device Access',
    body: 'If you attach an image to a journal entry, the app accesses your device storage or camera. We do not track your live GPS location.',
  },
  {
    heading: '2. How We Use Your Information',
    items: [
      'Running the capacity-bucket algorithm to sort tasks by your current energy state.',
      'Training your local Time-Blindness Multiplier.',
      'Displaying the Energy vs. Time of Day chart.',
      'Synchronising your data across devices.',
    ],
  },
  {
    heading: '3. Third-Party Processors',
    body: 'We do not sell, rent, or trade your data. The following infrastructure providers process data on our behalf:',
    items: [
      'Supabase: Backend database, Row-Level Security (only you can access your rows via your unique user ID), and email/password auth.',
      'Google OAuth: Optional secondary authentication only.',
      'Vercel: Hosts the static web frontend.',
    ],
  },
  {
    heading: '4. Your Legal Rights',
    body: 'Under GDPR, CCPA/CPRA, and similar laws you have the right to access, rectify, export, restrict processing of, or delete your data at any time. Exercise these rights directly in the Settings → Me panel or by contacting us.\n\nWe do not sell personal information or share it for cross-context behavioural advertising.',
  },
  {
    heading: '5. Data Deletion',
    body: 'MindDock includes explicit erasure tools in Settings:\n\n• Clear Completed Tasks — purges historical completed tasks from device and cloud.\n• Reset Everything — permanently deletes all local storage and cloud profile data. This action is irreversible.',
  },
  {
    heading: '6. Security',
    body: 'All cloud data transits exclusively over HTTPS. Supabase enforces strict Row-Level Security (auth.uid() = user_id), ensuring no other user can query or modify your data.',
  },
  {
    heading: '7. Contact',
    body: `Questions about this policy? Reach us at ${CONTACT_EMAIL}.`,
  },
];

const TERMS: Section[] = [
  {
    heading: null,
    body: `Effective Date: May 17, 2026\n\nBy using MindDock you agree to these Terms. If you do not agree, please do not use the Service.`,
  },
  {
    heading: '1. Eligibility',
    body: 'You must be at least 13 years old (or the legal age of majority in your country) to create an account. You are responsible for maintaining the confidentiality of your credentials and all activity under your account.',
  },
  {
    heading: '2. Not Medical Advice',
    body: 'MindDock is a productivity and executive-function tool. It is NOT a medical device, clinical coaching service, or replacement for professional psychological, psychiatric, or medical intervention.\n\nThe automated capacity scores, symptom audits, and behavioural insights are for personal planning only. Never disregard or delay professional medical advice because of anything surfaced by the Service.',
  },
  {
    heading: '3. Acceptable Use',
    body: 'You agree not to reverse-engineer, exploit, or bypass application security — including our Supabase Row-Level Security boundaries. We reserve the right to suspend or terminate accounts immediately upon detection of malicious activity.',
  },
  {
    heading: '4. Intellectual Property & Data Ownership',
    body: `Our property: The design, algorithms (capacity-packing math, EWMA time-blindness adjustment), UI layout, and source code are the exclusive intellectual property of MindDock.\n\nYour property: You retain full ownership of all tasks, journal entries, logs, and photos you submit. By uploading content you grant us a limited, royalty-free licence to host, cache, and transmit that content solely to render the app to you.`,
  },
  {
    heading: '5. Limitation of Liability',
    body: `MINDDOCK IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND.\n\nAlthough MindDock uses offline caching for resilience, we cannot guarantee data will never be lost due to OS wipes, hardware damage, or browser cache clearances.\n\nTo the maximum extent permitted by law, MindDock shall not be liable for any indirect, incidental, special, or consequential damages — including loss of data, missed deadlines, scheduling conflicts, or algorithmic errors.`,
  },
  {
    heading: '6. Governing Law',
    body: `These Terms are governed by the laws of ${GOVERNING_LAW}, without regard to conflict of law principles.`,
  },
  {
    heading: '7. Changes to Terms',
    body: 'We may update these Terms to accommodate new features or regulations. Material changes will be communicated by updating the "Effective Date" above or via an in-app notification. Continued use after modifications constitutes acceptance.',
  },
  {
    heading: '8. Contact',
    body: `Questions? Contact us at ${CONTACT_EMAIL}.`,
  },
];

export default function LegalSheet({ doc, onClose }: Props) {
  const sections = doc === 'privacy' ? PRIVACY : TERMS;
  const title    = doc === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-back fade-in" onClick={onClose}>
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '88dvh' }}
      >
        <div className="sheet-grip" />

        {/* Header */}
        <div style={{ marginBottom: 20, paddingRight: 36 }}>
          <div className="kicker" style={{ marginBottom: 4 }}>Legal</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
            {title}
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {sections.map((s, i) => (
            <div key={i}>
              {s.heading && (
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  letterSpacing: '-0.01em',
                  marginBottom: 6,
                  paddingBottom: 6,
                  borderBottom: '1px solid var(--line)',
                }}>
                  {s.heading}
                </div>
              )}
              {s.body && (
                <p style={{
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  color: s.heading ? 'var(--ink-soft)' : 'var(--ink-soft)',
                  margin: 0,
                  whiteSpace: 'pre-line',
                }}>
                  {s.body}
                </p>
              )}
              {s.items && (
                <ul style={{ margin: s.body ? '8px 0 0 0' : 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.items.map((item, j) => (
                    <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 7 }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}
