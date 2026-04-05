import { useRouter } from 'next/router';
import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../pages/_app';

export default function TopHeader({ title, subtitle }) {
  const router = useRouter();
  const { api } = useApp();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { notifications } = await api('/notifications');
        setHasUnread(notifications.some(n => !n.is_read));
      } catch (err) {}
    };
    fetchNotifications();
    
    // Poll every 10 seconds for new notifications
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex items-center justify-between" style={{ padding: '20px 20px 12px' }}>
      <div>
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 900, 
          background: 'linear-gradient(90deg, #7B61FF 0%, #D946EF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
          marginBottom: 4
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 15, color: '#64748B', fontWeight: 500 }}>
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="flex items-center">
        <button
          id="notification-bell"
          onClick={() => router.push('/notifications')}
          aria-label="Notifications"
          style={{
            width: 48,
            height: 48,
            borderRadius: 18,
            backgroundColor: '#F8F4FF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer'
          }}
        >
          <Bell color="#7B61FF" size={24} strokeWidth={2.2} />
          {hasUnread && (
            <span style={{
              position: 'absolute',
              top: 10,
              right: 12,
              width: 9,
              height: 9,
              backgroundColor: '#D946EF',
              borderRadius: '50%',
              border: '2px solid #F8F4FF'
            }} />
          )}
        </button>
      </div>
    </div>
  );
}
