import '../styles/globals.css';
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';

export const AppContext = createContext({});

export function useApp() {
  return useContext(AppContext);
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('ss_token');
    const savedUser = localStorage.getItem('ss_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user && token && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (!sub) {
             reg.pushManager.subscribe({
               userVisibleOnly: true,
               applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
             }).then(newSub => {
               api('/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: newSub }) }).catch(console.error);
             }).catch(console.error);
          } else {
             api('/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub }) }).catch(console.error);
          }
        });
      }).catch(console.error);
    }
  }, [user, token]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('ss_token', userToken);
    localStorage.setItem('ss_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
    router.push('/');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('ss_user', JSON.stringify(updatedUser));
  };

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const api = async (endpoint, options = {}) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await fetch(`${baseUrl}/api${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const ctx = { user, token, login, logout, updateUser, showToast, api, loading };

  if (loading) {
    return (
      <div className="loading-overlay" style={{ background: '#0D0D14' }}>
        <div style={{ width: 64, height: 64 }} className="spinner" />
      </div>
    );
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="app-shell">
        <Component {...pageProps} />

        {/* Toast Container */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <span>
                {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
              </span>
              {t.message}
            </div>
          ))}
        </div>
      </div>
    </AppContext.Provider>
  );
}
