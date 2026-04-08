import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from './_app';
import { auth, googleProvider } from '../lib/firebaseClient';
import { signInWithPopup } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// ── SVG Eye Icons ────────────────────────────────────────────────────────────
function EyeIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// Steps: 'login' | 'fp_email' | 'fp_otp' | 'fp_newpass' | 'fp_done'
const STEP = {
  LOGIN: 'login',
  FP_EMAIL: 'fp_email',
  FP_OTP: 'fp_otp',
  FP_PASS: 'fp_newpass',
  FP_DONE: 'fp_done',
};

export default function LoginPage() {
  const { login, user, showToast, api } = useApp();
  const router = useRouter();

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot-password fields
  const [step, setStep] = useState(STEP.LOGIN);
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpPwd, setFpPwd] = useState('');
  const [fpConfirm, setFpConfirm] = useState('');
  const [fpShowPwd, setFpShowPwd] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => { if (user) router.replace('/home'); }, [user, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Normal login ─────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !email.includes('@')) { showToast('Enter a valid email', 'error'); return; }
    if (!password) { showToast('Enter your password', 'error'); return; }
    setLoading(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.user, data.token);
      showToast('Logged in! 🚀', 'success');
      router.push('/home');
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
      // For Capacitor, we use Browser to open the login page on the deployed site
      // The web version of the site should handle the login and then deep link back
      await Browser.open({ url: `https://skillswap-pi-three.vercel.app/` });
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { displayName, email: gEmail, photoURL } = result.user;
      const idToken = await result.user.getIdToken();
      const data = await api('/auth/google-login', {
        method: 'POST',
        body: JSON.stringify({ idToken, name: displayName, email: gEmail, profile_image: photoURL }),
      });
      login(data.user, data.token);
      router.push('/home');
      showToast(`Welcome, ${displayName?.split(' ')[0] || 'there'}! 🎉`, 'success');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast(err.message || 'Google sign-in failed', 'error');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Forgot password: step 1 — send OTP ──────────────────────────────────
  const handleSendOtp = async () => {
    if (!fpEmail || !fpEmail.includes('@')) { showToast('Enter a valid email', 'error'); return; }
    setFpLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: fpEmail }),
      });
      setStep(STEP.FP_OTP);
      setCountdown(60);
      showToast('OTP sent to your email', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send OTP', 'error');
    } finally {
      setFpLoading(false);
    }
  };

  // ── Forgot password: step 2 — verify OTP ────────────────────────────────
  const handleVerifyOtp = async () => {
    if (fpOtp.length < 6) { showToast('Enter the 6-digit OTP', 'error'); return; }
    setFpLoading(true);
    try {
      // Just validate the OTP format; actual verification happens with reset
      setStep(STEP.FP_PASS);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFpLoading(false);
    }
  };

  // ── Forgot password: step 3 — set new password ──────────────────────────
  const handleResetPassword = async () => {
    if (fpPwd.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    if (fpPwd !== fpConfirm) { showToast('Passwords do not match', 'error'); return; }
    setFpLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: fpEmail, otp: fpOtp, newPassword: fpPwd }),
      });
      setStep(STEP.FP_DONE);
      showToast('Password reset successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Reset failed', 'error');
      // If OTP was invalid, go back to OTP step
      if (err.message?.toLowerCase().includes('otp')) setStep(STEP.FP_OTP);
    } finally {
      setFpLoading(false);
    }
  };

  const resetFp = () => {
    setStep(STEP.LOGIN);
    setFpEmail(''); setFpOtp(''); setFpPwd(''); setFpConfirm('');
    setCountdown(0);
  };

  // ── Shared styles ────────────────────────────────────────────────────────
  const eyeBtn = {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', lineHeight: 1, padding: '4px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, transition: 'color 0.15s',
  };
  const backBtn = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: 14, display: 'flex',
    alignItems: 'center', gap: 6, marginBottom: 16, padding: 0,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Login — Skill Swap Connect</title>
        <meta name="description" content="Log in to Skill Swap Connect and start exchanging skills today." />
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 24px 40px' }}>

        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src="logo.png"
            alt="Skill Swap Logo"
            style={{
              width: 96, height: 96,
              margin: '0 auto 16px',
              display: 'block',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--border)',
              boxShadow: '0 4px 20px rgba(123,97,255,0.25)',
            }}
          />
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
            <span className="text-gradient">Skill Swap</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Connect · Learn · Grow</p>
        </div>

        {/* ════════════════════════════════════════════════
            STEP: Normal Login
        ════════════════════════════════════════════════ */}
        {step === STEP.LOGIN && (
          <div className="page-enter">
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Welcome Back</h2>
              <p className="text-sm text-muted" style={{ marginBottom: 24 }}>Log in to your account</p>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label" htmlFor="email-input">Email Address</label>
                <input
                  id="email-input" type="email" className="input-field"
                  placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="input-group" style={{ marginBottom: 8 }}>
                <label className="input-label" htmlFor="login-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    className="input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button style={eyeBtn} onClick={() => setShowPwd(v => !v)} type="button" aria-label={showPwd ? 'Hide password' : 'Show password'}>
                    {showPwd ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password — right below the password field */}
              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <button
                  id="forgot-password-btn"
                  onClick={() => { setFpEmail(email); setStep(STEP.FP_EMAIL); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--primary)', fontWeight: 600, fontSize: 13,
                    textDecoration: 'underline', textUnderlineOffset: 3,
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                id="login-btn"
                className="btn btn-primary btn-full"
                onClick={handleLogin}
                disabled={loading}
                style={{ height: 52, fontSize: 16 }}
              >
                {loading ? 'Logging in...' : 'Log In 🚀'}
              </button>
            </div>

            {/* OR divider */}
            <div className="flex items-center gap-12" style={{ marginBottom: 20 }}>
              <div className="divider" style={{ flex: 1, margin: 0 }} />
              <span className="text-xs text-faint">or</span>
              <div className="divider" style={{ flex: 1, margin: 0 }} />
            </div>

            {/* Google */}
            <button
              id="google-login-btn"
              className="btn btn-ghost btn-full"
              onClick={handleGoogle}
              disabled={googleLoading}
              style={{ height: 52, fontSize: 15, border: '1.5px solid var(--border)', background: 'var(--surface)' }}
            >
              {googleLoading ? (
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <p className="text-sm text-center" style={{ marginTop: 24 }}>
              <span className="text-muted">Don't have an account? </span>
              <button
                onClick={() => router.push('/signup')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            STEP: Forgot — Enter Email
        ════════════════════════════════════════════════ */}
        {step === STEP.FP_EMAIL && (
          <div className="page-enter">
            <div className="card">
              <button style={backBtn} onClick={resetFp}>← Back to Login</button>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Forgot Password 🔑</h2>
              <p className="text-sm text-muted" style={{ marginBottom: 24 }}>
                Enter your registered email. We'll send you a 6-digit code.
              </p>

              <div className="input-group" style={{ marginBottom: 20 }}>
                <label className="input-label" htmlFor="fp-email">Email Address</label>
                <input
                  id="fp-email" type="email" className="input-field"
                  placeholder="you@example.com"
                  value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  autoFocus
                />
              </div>

              <button
                id="fp-send-otp-btn"
                className="btn btn-primary btn-full"
                onClick={handleSendOtp}
                disabled={fpLoading}
                style={{ height: 52, fontSize: 16 }}
              >
                {fpLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            STEP: Forgot — Verify OTP
        ════════════════════════════════════════════════ */}
        {step === STEP.FP_OTP && (
          <div className="page-enter">
            <div className="card">
              <button style={backBtn} onClick={() => setStep(STEP.FP_EMAIL)}>← Back</button>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Check Your Inbox ✉️</h2>
              <p className="text-sm text-muted" style={{ marginBottom: 24 }}>
                A 6-digit code was sent to <strong style={{ color: 'var(--text)' }}>{fpEmail}</strong>
              </p>

              <div className="input-group" style={{ marginBottom: 20 }}>
                <label className="input-label" htmlFor="fp-otp">Enter OTP</label>
                <input
                  id="fp-otp"
                  type="number"
                  className="input-field otp-field"
                  placeholder="000000"
                  value={fpOtp}
                  onChange={e => setFpOtp(e.target.value.slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  maxLength={6}
                  autoFocus
                  style={{ fontSize: 28, letterSpacing: 10, textAlign: 'center' }}
                />
              </div>

              <button
                id="fp-verify-btn"
                className="btn btn-primary btn-full"
                onClick={handleVerifyOtp}
                disabled={fpLoading || fpOtp.length < 6}
                style={{ height: 52, fontSize: 16, marginBottom: 16 }}
              >
                {fpLoading ? 'Verifying...' : 'Verify OTP →'}
              </button>

              <div style={{ textAlign: 'center' }}>
                {countdown > 0 ? (
                  <p className="text-sm text-muted">Resend in {countdown}s</p>
                ) : (
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}
                    onClick={() => { setFpOtp(''); handleSendOtp(); }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            STEP: Forgot — Set New Password
        ════════════════════════════════════════════════ */}
        {step === STEP.FP_PASS && (
          <div className="page-enter">
            <div className="card">
              <button style={backBtn} onClick={() => setStep(STEP.FP_OTP)}>← Back</button>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Set New Password 🛡️</h2>
              <p className="text-sm text-muted" style={{ marginBottom: 24 }}>Choose a strong password (min 6 characters)</p>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label" htmlFor="fp-new-pwd">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="fp-new-pwd"
                    type={fpShowPwd ? 'text' : 'password'}
                    className="input-field"
                    placeholder="••••••••"
                    value={fpPwd}
                    onChange={e => setFpPwd(e.target.value)}
                    style={{ paddingRight: 44 }}
                    autoFocus
                  />
                  <button style={eyeBtn} onClick={() => setFpShowPwd(v => !v)} type="button" aria-label={fpShowPwd ? 'Hide password' : 'Show password'}>
                    {fpShowPwd ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 24 }}>
                <label className="input-label" htmlFor="fp-confirm-pwd">Confirm New Password</label>
                <input
                  id="fp-confirm-pwd"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={fpConfirm}
                  onChange={e => setFpConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                />
              </div>

              <button
                id="fp-reset-btn"
                className="btn btn-primary btn-full"
                onClick={handleResetPassword}
                disabled={fpLoading}
                style={{ height: 52, fontSize: 16 }}
              >
                {fpLoading ? 'Resetting...' : 'Reset Password ✓'}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            STEP: Forgot — Done
        ════════════════════════════════════════════════ */}
        {step === STEP.FP_DONE && (
          <div className="page-enter">
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Password Reset!</h2>
              <p className="text-sm text-muted" style={{ marginBottom: 28 }}>
                Your password has been updated. Log in with your new password.
              </p>
              <button
                id="fp-done-btn"
                className="btn btn-primary btn-full"
                onClick={resetFp}
                style={{ height: 52, fontSize: 16 }}
              >
                Go to Login 🚀
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
