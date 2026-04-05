import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from './_app';
import { auth, googleProvider } from '../lib/firebaseClient';
import { signInWithPopup } from 'firebase/auth';

const STEPS = { EMAIL: 'email', OTP: 'otp', SETUP_PASSWORD: 'setup_password', PROFILE: 'profile' };

export default function SignupPage() {
  const { login, user, showToast } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [tempToken, setTempToken] = useState('');
  const [tempUser, setTempUser] = useState(null);

  useEffect(() => {
    if (user) router.replace('/home');
  }, [user, router]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.requiresPassword || data.requiresGoogle) {
        showToast('Account already exists! Please log in.', 'error');
        router.push('/');
        return;
      }

      setStep(STEPS.OTP);
      setCountdown(60);
      showToast('OTP sent to your email! ✉️', 'success');
      
    } catch (err) {
      showToast(err.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      showToast('Enter the 6-digit OTP', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.isNew || data.needsPassword) {
        setTempToken(data.token);
        setTempUser(data.user);
        setStep(STEPS.SETUP_PASSWORD);
      } else {
        login(data.user, data.token);
        router.push('/home');
      }
    } catch (err) {
      showToast(err.message || 'Invalid OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async () => {
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tempToken}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      login(tempUser, tempToken);
      showToast('Password set! Tell us your name next.', 'success');
      setStep(STEPS.PROFILE);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('ss_token');
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.user, token);
      router.push('/home');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { displayName, email: gEmail, photoURL } = result.user;
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, name: displayName, email: gEmail, profile_image: photoURL }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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

  return (
    <>
      <Head>
        <title>Sign Up — Skill Swap Connect</title>
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 24px 40px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src="/logo.png"
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
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Connect · Learn · Grow
          </p>
        </div>

        {/* Step: Email */}
        {step === STEPS.EMAIL && (
          <div className="page-enter">
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Create an Account 🚀</h2>
              <p className="text-sm text-muted" style={{ marginBottom: 24 }}>
                Enter your email to sign up
              </p>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label" htmlFor="email-input">Email Address</label>
                <input
                  id="email-input"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                  autoComplete="email"
                />
              </div>

              <button
                id="send-otp-btn"
                className="btn btn-primary btn-full"
                onClick={handleSendOTP}
                disabled={loading}
                style={{ height: 52, fontSize: 16 }}
              >
                {loading ? 'Sending...' : 'Sign Up with Email ✉️'}
              </button>
            </div>

            {/* Divider */}
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
            
            <p className="text-sm text-center" style={{ marginTop: 24, paddingBottom: 24 }}>
              <span className="text-muted">Already have an account? </span>
              <button 
                onClick={() => router.push('/')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              >
                Log in
              </button>
            </p>
          </div>
        )}

        {/* Step: OTP */}
        {step === STEPS.OTP && (
          <div className="page-enter">
            <div className="card">
              <button
                style={{ background: 'none', color: 'var(--text-muted)', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setStep(STEPS.EMAIL)}
              >
                ← Back
              </button>

              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Check your inbox ✉️</h2>
              <p className="text-sm text-muted" style={{ marginBottom: 24 }}>
                We sent a 6-digit code to <strong style={{ color: 'var(--text)' }}>{email}</strong>
              </p>

              <div className="input-group" style={{ marginBottom: 20 }}>
                <label className="input-label" htmlFor="otp-input">OTP Code</label>
                <input
                  id="otp-input"
                  type="number"
                  className="input-field otp-field"
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                  maxLength={6}
                />
              </div>

              <button
                id="verify-otp-btn"
                className="btn btn-primary btn-full"
                onClick={handleVerifyOTP}
                disabled={loading}
                style={{ height: 52, fontSize: 16, marginBottom: 16 }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div style={{ textAlign: 'center' }}>
                {countdown > 0 ? (
                  <p className="text-sm text-muted">Resend in {countdown}s</p>
                ) : (
                  <button
                    className="text-sm"
                    style={{ color: 'var(--primary-light)', background: 'none' }}
                    onClick={() => { setOtp(''); handleSendOTP(); }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step: Setup Password (Signup) */}
        {step === STEPS.SETUP_PASSWORD && (
          <div className="page-enter">
            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Secure your Account 🛡️</h2>
              <p className="text-sm text-muted" style={{ marginBottom: 24 }}>
                Create a password so you can log in instantly next time
              </p>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label" htmlFor="setup-password">Password (min 6 chars)</label>
                <input
                  id="setup-password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 24 }}>
                <label className="input-label" htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSetupPassword()}
                />
              </div>

              <button
                id="setup-password-btn"
                className="btn btn-primary btn-full"
                onClick={handleSetupPassword}
                disabled={loading}
                style={{ height: 52, fontSize: 16 }}
              >
                {loading ? 'Saving...' : 'Set Password'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Profile Setup */}
        {step === STEPS.PROFILE && (
          <div className="page-enter">
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Account Created!</h2>
                <p className="text-sm text-muted">Tell us your name to get started</p>
              </div>

              <div className="input-group" style={{ marginBottom: 20 }}>
                <label className="input-label" htmlFor="name-input">Your Name</label>
                <input
                  id="name-input"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
                />
              </div>

              <button
                id="save-profile-btn"
                className="btn btn-primary btn-full"
                onClick={handleSaveProfile}
                disabled={loading}
                style={{ height: 52, fontSize: 16 }}
              >
                {loading ? 'Saving...' : 'Get Started 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
