import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from './_app';
import BottomNav from '../components/BottomNav';
import TopHeader from '../components/TopHeader';

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

function ExchangeCard({ exchange, isIncoming, onAccept, onReject }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    await (action === 'accept' ? onAccept : onReject)(exchange._id);
    setLoading(false);
  };

  return (
    <div className="exchange-card page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-12">
          <div className="avatar avatar-sm" style={{ background: 'var(--gradient)' }}>
            {isIncoming
              ? (exchange.from_name || '?')[0].toUpperCase()
              : (exchange.to_name || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold" style={{ fontSize: 14 }}>
              {isIncoming ? exchange.from_name || 'Anonymous' : exchange.to_name || 'Anonymous'}
            </p>
            <p className="text-xs text-muted">{timeAgo(exchange.created_at)}</p>
          </div>
        </div>
        <StatusBadge status={exchange.status} />
      </div>

      {/* Skills */}
      <div className="flex items-center gap-8" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{
          background: 'var(--gradient-soft)',
          border: '1px solid var(--border-active)',
          borderRadius: 10, padding: '6px 12px', fontSize: 13,
        }}>
          🎯 <strong>{exchange.want_skill}</strong>
        </div>
        <span className="text-muted" style={{ fontSize: 18 }}>⇄</span>
        <div style={{
          background: 'rgba(34,211,165,0.08)',
          border: '1px solid rgba(34,211,165,0.2)',
          borderRadius: 10, padding: '6px 12px', fontSize: 13,
        }}>
          ✨ <strong>{exchange.offer_skill}</strong>
        </div>
      </div>

      {exchange.message && (
        <p className="text-sm text-muted" style={{
          marginBottom: 14,
          padding: '10px 12px',
          background: 'var(--surface2)',
          borderRadius: 10,
          fontStyle: 'italic',
        }}>
          "{exchange.message}"
        </p>
      )}

      {/* Actions */}
      {isIncoming && exchange.status === 'pending' && (
        <div className="flex gap-8">
          <button
            id={`reject-${exchange._id}`}
            className="btn btn-danger btn-sm"
            style={{ flex: 1 }}
            onClick={() => handleAction('reject')}
            disabled={loading}
          >
            ✕ Decline
          </button>
          <button
            id={`accept-${exchange._id}`}
            className="btn btn-success"
            style={{ flex: 2 }}
            onClick={() => handleAction('accept')}
            disabled={loading}
          >
            {loading ? '...' : '✓ Accept Exchange'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExchangesPage() {
  const { user, api, showToast } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState('incoming');
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) router.replace('/');
  }, [user, router]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [inc, out] = await Promise.all([
        api('/exchanges?type=incoming'),
        api('/exchanges?type=outgoing'),
      ]);
      setIncoming(inc.exchanges || []);
      setOutgoing(out.exchanges || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await api(`/exchanges?action=accept&id=${id}`);
      showToast('Exchange accepted! Chat is now enabled 💬', 'success');
      fetchAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await api(`/exchanges?action=reject&id=${id}`);
      showToast('Exchange declined', 'info');
      fetchAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const list = tab === 'incoming' ? incoming : outgoing;
  const pendingCount = incoming.filter(e => e.status === 'pending').length;

  return (
    <>
      <Head>
        <title>Exchanges — Skill Swap Connect</title>
      </Head>

      <div className="page-content page-enter" style={{ padding: '0 0 80px' }}>
        {/* Header */}
        <TopHeader title="Exchanges" subtitle="Manage your skill swaps" />

        {/* Tabs */}
        <div style={{ padding: '0 20px 20px' }}>
          <div className="tabs">
            <button
              id="tab-incoming"
              className={`tab ${tab === 'incoming' ? 'active' : ''}`}
              onClick={() => setTab('incoming')}
            >
              Incoming ({incoming.length})
            </button>
            <button
              id="tab-outgoing"
              className={`tab ${tab === 'outgoing' ? 'active' : ''}`}
              onClick={() => setTab('outgoing')}
            >
              Outgoing ({outgoing.length})
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ padding: '0 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="spinner" />
            </div>
          ) : list.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{tab === 'incoming' ? '📥' : '📤'}</div>
              <h3>No {tab} requests</h3>
              <p>
                {tab === 'incoming'
                  ? 'No one has sent you a swap request yet'
                  : 'You haven\'t sent any swap requests yet'}
              </p>
              {tab === 'outgoing' && (
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => router.push('/discover')}
                >
                  Discover Skills
                </button>
              )}
            </div>
          ) : (
            list.map(exchange => (
              <ExchangeCard
                key={exchange._id}
                exchange={exchange}
                isIncoming={tab === 'incoming'}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
