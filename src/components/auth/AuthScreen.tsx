import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import LegalSheet from '../settings/LegalSheet';

type Mode = 'signin' | 'signup' | 'reset';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function AuthScreen() {
  const [mode,      setMode]      = useState<Mode>('signin');
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error,        setError]        = useState('');
  const [resetSent,    setResetSent]    = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) { setError('Please enter your name.'); return; }
        const { error: e } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() } },
        });
        if (e) throw e;
      } else if (mode === 'signin') {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
      } else {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (e) throw e;
        setResetSent(true);
      }
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (e) { setError(e.message); setOauthLoading(false); }
    // on success the page navigates away — no need to reset loading
  };

  /* ── Reset sent confirmation ── */
  if (resetSent) {
    return (
      <div className="onboard-wrap" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 8 }}>📬</div>
        <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>Check your email</div>
        <p style={{ color: 'var(--ink-soft)', marginTop: 8, fontSize: 14, lineHeight: 1.65, maxWidth: 260 }}>
          We sent a reset link to <strong style={{ color: 'var(--charcoal)' }}>{email}</strong>.
        </p>
        <button
          onClick={() => { setResetSent(false); setMode('signin'); }}
          style={{ marginTop: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-blue-deep)', fontWeight: 600, fontSize: '0.88rem' }}
        >
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="onboard-wrap" style={{ justifyContent: 'center' }}>

      {/* Wordmark */}
      <div style={{ marginBottom: 4 }}>
        <div className="serif" style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--charcoal)' }}>
          MindDock
        </div>
        <p style={{ color: 'var(--ink-soft)', marginTop: 6, fontSize: 14, lineHeight: 1.6 }}>
          Your capacity-aware coach for ADHD adults.
        </p>
      </div>

      {/* Google — prominent, above the fold */}
      {mode !== 'reset' && (
        <button
          onClick={handleGoogle}
          disabled={oauthLoading || loading || (mode === 'signup' && !termsAccepted)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '13px 16px',
            background: '#fff',
            border: '1.5px solid var(--line)',
            borderRadius: 12,
            cursor: oauthLoading ? 'wait' : 'pointer',
            fontWeight: 600, fontSize: '0.92rem',
            color: 'var(--charcoal)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          {oauthLoading
            ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--line)', borderTopColor: 'var(--charcoal)', animation: 'spin 0.8s linear infinite' }} />
            : <GoogleIcon />
          }
          {oauthLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>
      )}

      {/* Divider */}
      {mode !== 'reset' && (
        <div className="row" style={{ gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 500 }}>or with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>
      )}

      {/* Mode toggle */}
      {mode !== 'reset' && (
        <div style={{ display: 'flex', background: 'var(--paper2)', borderRadius: 12, padding: 4, gap: 2 }}>
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setTermsAccepted(false); }}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: mode === m ? '#fff' : 'transparent',
                fontWeight: mode === m ? 600 : 400,
                fontSize: '0.85rem',
                color: mode === m ? 'var(--charcoal)' : 'var(--ink-muted)',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>
      )}

      {/* Form fields */}
      <div className="col" style={{ gap: 11 }}>
        {mode === 'signup' && (
          <div className="field">
            <label>Your name</label>
            <input className="input" placeholder="Alex" value={name} onChange={(e) => setName(e.target.value)} autoFocus={mode === 'signup'} />
          </div>
        )}

        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus={mode === 'signin'}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {mode !== 'reset' && (
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ marginBottom: 0 }}>Password</label>
              {mode === 'signin' && (
                <button
                  onClick={() => { setMode('reset'); setError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--ink-muted)' }}
                >
                  Forgot?
                </button>
              )}
            </div>
            <input
              className="input"
              type="password"
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        )}

        {/* Terms acceptance — signup only */}
        {mode === 'signup' && (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '4px 0' }}>
            {/* Custom checkbox */}
            <div
              onClick={() => setTermsAccepted((v) => !v)}
              style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                border: `2px solid ${termsAccepted ? 'var(--accent-deep)' : 'var(--line-strong, var(--line))'}`,
                background: termsAccepted ? 'var(--accent-deep)' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s var(--ease)',
              }}
            >
              {termsAccepted && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setLegalDoc('terms'); }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent-deep)', fontWeight: 600, fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}
              >
                Terms &amp; Conditions
              </button>
              {' '}and{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setLegalDoc('privacy'); }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent-deep)', fontWeight: 600, fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}
              >
                Privacy Policy
              </button>
            </span>
          </label>
        )}

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 13px', fontSize: '0.82rem', color: 'var(--danger)', lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary btn-block btn-lg"
          disabled={loading || oauthLoading || !email.trim() || (mode !== 'reset' && !password.trim()) || (mode === 'signup' && !termsAccepted)}
          onClick={handleSubmit}
          style={{ marginTop: 2 }}
        >
          {loading ? 'Please wait…'
            : mode === 'signin'  ? 'Sign in'
            : mode === 'signup'  ? 'Create account'
            : 'Send reset link'}
        </button>

        {mode === 'reset' && (
          <button
            onClick={() => { setMode('signin'); setError(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--ink-muted)', textAlign: 'center' }}
          >
            ← Back to sign in
          </button>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.6 }}>
        Your data is encrypted and private. We never sell it.{' '}
        <button type="button" onClick={() => setLegalDoc('privacy')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy Policy</button>
      </p>

      {legalDoc && <LegalSheet doc={legalDoc} onClose={() => setLegalDoc(null)} />}
    </div>
  );
}
