import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApp } from './_app';

export default function NotificationsPage() {
  const router = useRouter();
  const { api } = useApp();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { notifications } = await api('/notifications');
        setNotifications(notifications);
        // Mark as read after fetching
        if (notifications.some(n => !n.is_read)) {
          await api('/notifications', { method: 'PUT' });
        }
      } catch (err) {}
    };
    fetchNotifications();
  }, []);

  return (
    <>
      <Head>
        <title>Notifications — Skill Swap Connect</title>
      </Head>

      <div className="page-content page-enter" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Top Bar */}
        <div className="flex items-center" style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <button 
            onClick={() => router.back()} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8, display: 'flex' }}
            aria-label="Go back"
          >
            <ArrowLeft size={24} color="var(--text)" />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginLeft: 12 }}>Notifications</h1>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: '50%', background: '#F8F4FF', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 
              }}>
                <Bell size={40} color="var(--primary)" strokeWidth={1.5} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>All caught up!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 15, textAlign: 'center' }}>
                You have no new notifications right now.<br/>Check back later.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {notifications.map((n) => (
                <div key={n._id} onClick={() => router.push('/exchanges')} style={{ 
                  padding: '16px', background: n.is_read ? '#fff' : '#F8F4FF', 
                  borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' 
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                    {n.from_image ? (
                      <img src={n.from_image} alt={n.from_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Bell size={20} color="var(--primary)" />
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
