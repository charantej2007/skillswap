import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from './_app';
import { auth, googleProvider } from '../lib/firebaseClient';
import { signInWithPopup } from 'firebase/auth';

export default function LoginPage() {
  const { login, user, showToast } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace('/home');
  }, [user, router]);

  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    if (!password) {
      showToast('Please enter your password', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes('set up your password via OTP')) {
          showToast('Account needs setup. Please Sign up.', 'error');
          router.push('/signup');
        } else {
          throw new Error(data.error);
        }
        return;
      }

      login(data.user, data.token);
      showToast('Logged in successfully! 🚀', 'success');
      router.push('/home');
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
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
      showToast(`Welcome, ${displayName?.split(' ')['0'] || 'there'}! 🎉`, 'success');
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
        <title>Login — Skill Swap Connect</title>
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 24px 40px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src="/logo.png"
            alt="Skill Swap Logo"
            style={{ width: 90, height: 90, margin: '0 auto 16px', objectFit: 'contain', display: 'block' }}
          />
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
            <span className="text-gradient">Skill Swap</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Connect · Learn · Grow
          </p>
        </div>

        <div className="page-enter">
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Welcome Back 🔒</h2>
            <p className="text-sm text-muted" style={{ marginBottom: 24 }}>
              Log in to your account
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
                autoComplete="email"
              />
            </div>

            <div className="input-group" style={{ marginBottom: 24 }}>
              <label className="input-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
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
            <span className="text-muted">Don't have an account? </span>
            <button 
              onClick={() => router.push('/signup')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
