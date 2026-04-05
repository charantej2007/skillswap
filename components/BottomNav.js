import { useRouter } from 'next/router';
import { Home, Search, ArrowRightLeft, MessageCircle, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home', icon: Home, label: 'Home', id: 'nav-home' },
  { href: '/discover', icon: Search, label: 'Discover', id: 'nav-discover' },
  { href: '/exchanges', icon: ArrowRightLeft, label: 'Exchanges', id: 'nav-exchanges' },
  { href: '/messages', icon: MessageCircle, label: 'Messages', id: 'nav-messages' },
  { href: '/profile', icon: User, label: 'Profile', id: 'nav-profile' },
];

export default function BottomNav({ hasNotification }) {
  const router = useRouter();
  const current = router.pathname;

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.map(item => {
        const IconComponent = item.icon;
        const isActive = current === item.href;
        return (
          <button
            key={item.href}
            id={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => router.push(item.href)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className={`nav-icon ${isActive ? 'active-icon-bg' : ''}`} style={{ position: 'relative' }}>
              <IconComponent size={24} strokeWidth={isActive ? 2.5 : 2} color="currentColor" />
              {item.href === '/messages' && hasNotification && <span className="nav-dot" />}
            </div>
            <span className="nav-label" style={{ marginTop: 4 }}>{item.label}</span>
            {isActive && <div className="nav-active-dot" />}
          </button>
        );
      })}
    </nav>
  );
}
