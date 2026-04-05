import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useApp } from './_app';
import BottomNav from '../components/BottomNav';
import TopHeader from '../components/TopHeader';
import { Video, X } from 'lucide-react';

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatView({ exchange, currentUserId, onBack, api, showToast }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [pDate, setPDate] = useState('');
  const [pTime, setPTime] = useState('');
  const [pLink, setPLink] = useState('');
  const [pTopics, setPTopics] = useState('');
  const bottomRef = useRef(null);
  const otherId = exchange.from_user === currentUserId ? exchange.to_user : exchange.from_user;
  const otherName = exchange.from_user === currentUserId ? exchange.to_name : exchange.from_name;

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const data = await api(`/messages?with=${otherId}&exchange_id=${exchange._id}`);
      setMessages(data.messages || []);
    } catch (err) {}
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const tempText = text;
    setText('');
    try {
      await api('/messages', {
        method: 'POST',
        body: JSON.stringify({ receiver: otherId, text: tempText, exchange_id: exchange._id }),
      });
      fetchMessages();
    } catch (err) {
      showToast('Failed to send message', 'error');
      setText(tempText);
    } finally {
      setSending(false);
    }
  };

  const handleSendProposal = async () => {
    if (!pDate || !pTime || !pLink) {
      showToast('Please fill required fields (Date, Time, Link)', 'error');
      return;
    }
    setSending(true);
    try {
      await api('/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiver: otherId,
          text: `Proposed a meeting for ${pDate} at ${pTime}`,
          exchange_id: exchange._id,
          is_proposal: true,
          proposal_data: { date: pDate, time: pTime, link: pLink, topics: pTopics }
        }),
      });
      setShowProposal(false);
      setPDate(''); setPTime(''); setPLink(''); setPTopics('');
      fetchMessages();
    } catch (err) {
      showToast('Failed to send proposal', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Chat Header */}
      <div style={{
        padding: '16px 20px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', color: 'var(--text-muted)', fontSize: 20 }}
          aria-label="Back"
        >
          ←
        </button>
        <div className="avatar avatar-sm" style={{ background: 'var(--gradient)' }}>
          {(otherName || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p className="font-semibold" style={{ fontSize: 15 }}>{otherName || 'User'}</p>
          <p className="text-xs text-muted">
            {exchange.offer_skill} ⇄ {exchange.want_skill}
          </p>
        </div>
        <button
          onClick={() => setShowProposal(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
          aria-label="Propose a Call"
        >
          <Video color="var(--primary)" size={24} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        paddingBottom: 80,
      }}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <div className="empty-icon">💬</div>
            <h3>Start the conversation!</h3>
            <p>You and {otherName} can now chat</p>
          </div>
        )}
        {messages.map(msg => {
          const isProposal = msg.is_proposal || (msg.text && msg.text.startsWith('Proposed a meeting for'));
          let pDate = msg.proposal_data?.date;
          let pTime = msg.proposal_data?.time;
          let pTopics = msg.proposal_data?.topics;
          if (!msg.is_proposal && isProposal) {
             const match = msg.text.match(/for (.*?) at (.*?)$/);
             if (match) {
               pDate = match[1];
               pTime = match[2];
             }
          }

          return (
          <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === currentUserId ? 'flex-end' : 'flex-start' }}>
            {isProposal ? (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, maxWidth: '85%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Video size={18} color="var(--primary)" />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Meeting Proposal</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  <p><strong>When:</strong> {pDate || 'TBD'} {pTime ? `at ${pTime}` : ''}</p>
                  <p><strong>Topic:</strong> {pTopics || 'Discussion'}</p>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', fontSize: 13, gap: 6, height: 38 }}
                  onClick={() => window.open(msg.proposal_data?.link || 'https://meet.google.com/new', '_blank')}
                >
                  Join Meeting
                </button>
              </div>
            ) : (
              <div className={`chat-bubble ${msg.sender === currentUserId ? 'sent' : 'received'}`}>
                {msg.text}
              </div>
            )}
            <span className="text-xs text-faint" style={{ marginTop: 4, paddingLeft: 4, paddingRight: 4 }}>
              {formatTime(msg.timestamp)}
            </span>
          </div>
        )})}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 'var(--max-w)',
        padding: '12px 20px 20px',
        background: 'rgba(22,22,31,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: 10,
      }}>
        <input
          id="chat-message-input"
          className="input-field"
          style={{ flex: 1, height: 44 }}
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
        />
        <button
          id="chat-send-btn"
          className="btn btn-primary"
          style={{ height: 44, padding: '0 18px' }}
          onClick={handleSend}
          disabled={sending || !text.trim()}
          aria-label="Send message"
        >
          ➤
        </button>
      </div>

      {/* Proposal Modal */}
      {showProposal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, zIndex: 999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Propose an Exchange</h3>
              <button onClick={() => setShowProposal(false)} style={{ background: 'none' }}><X size={20} color="var(--text-muted)" /></button>
            </div>
            
            <div className="input-group" style={{ marginBottom: 12 }}>
              <label className="input-label">Date</label>
              <input type="date" className="input-field" value={pDate} onChange={e => setPDate(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 12 }}>
              <label className="input-label">Time</label>
              <input type="time" className="input-field" value={pTime} onChange={e => setPTime(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 12 }}>
              <label className="input-label">Meeting Link (G Meet, Zoom, etc)</label>
              <input type="url" className="input-field" placeholder="https://" value={pLink} onChange={e => setPLink(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label">Topics to discuss</label>
              <input type="text" className="input-field" placeholder="Optional topics..." value={pTopics} onChange={e => setPTopics(e.target.value)} />
            </div>
            
            <button
              className="btn btn-primary btn-full"
              onClick={handleSendProposal}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Proposal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const { user, api, showToast } = useApp();
  const router = useRouter();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    if (!user) router.replace('/');
  }, [user, router]);

  useEffect(() => {
    fetchAccepted();
  }, []);

  const fetchAccepted = async () => {
    try {
      const [inc, out] = await Promise.all([
        api('/exchanges?type=incoming'),
        api('/exchanges?type=outgoing'),
      ]);
      const all = [
        ...(inc.exchanges || []).filter(e => e.status === 'accepted'),
        ...(out.exchanges || []).filter(e => e.status === 'accepted'),
      ];
      setExchanges(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (activeChat) {
    return (
      <>
        <Head><title>Chat — Skill Swap</title></Head>
        <ChatView
          exchange={activeChat}
          currentUserId={user?._id}
          onBack={() => setActiveChat(null)}
          api={api}
          showToast={showToast}
        />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Messages — Skill Swap Connect</title>
      </Head>

      <div className="page-content page-enter" style={{ padding: '0 0 80px' }}>
        {/* Header */}
        <TopHeader title="Messages" subtitle="Your conversations" />

        {/* Chat List */}
        <div style={{ padding: '0 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="spinner" />
            </div>
          ) : exchanges.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 80 }}>
              <div className="empty-icon">💬</div>
              <h3>No conversations yet</h3>
              <p>Accept or get an exchange accepted to start chatting</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 20 }}
                onClick={() => router.push('/exchanges')}
              >
                View Exchanges
              </button>
            </div>
          ) : (
            exchanges.map(ex => {
              const isFromMe = ex.from_user === user?._id;
              const partnerName = isFromMe ? ex.to_name : ex.from_name;
              return (
                <button
                  key={ex._id}
                  id={`chat-${ex._id}`}
                  className="flex items-center gap-14 w-full"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                  onClick={() => setActiveChat(ex)}
                >
                  <div className="avatar avatar-md" style={{ background: 'var(--gradient)', flexShrink: 0 }}>
                    {(partnerName || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p className="font-semibold" style={{ fontSize: 15, marginBottom: 2 }}>
                      {partnerName || 'User'}
                    </p>
                    <p className="text-sm text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ex.want_skill} ⇄ {ex.offer_skill}
                    </p>
                  </div>
                  <span className="badge badge-accepted">Active</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <BottomNav hasNotification={exchanges.length > 0} />
    </>
  );
}
