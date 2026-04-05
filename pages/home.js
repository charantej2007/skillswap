import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from './_app';
import BottomNav from '../components/BottomNav';
import SkillCard from '../components/SkillCard';
import ExchangeModal from '../components/ExchangeModal';
import { Bell } from 'lucide-react';

const TOPICS = ['All', 'Coding', 'Trading', 'Cooking', 'Music', 'Design', 'Wellness', 'Language', 'Sports'];

const STATS = [
  { key: 'skills', label: 'Skills' },
  { key: 'members', label: 'Members' },
  { key: 'topics', label: 'Topics' },
];

export default function HomePage() {
  const { user, api, showToast } = useApp();
  const router = useRouter();
  const [skills, setSkills] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statNums, setStatNums] = useState([0, 0, 0]);

  useEffect(() => {
    if (!user) router.replace('/');
  }, [user, router]);

  useEffect(() => {
    fetchSkills();
    // Fetch real stats and animate
    const loadStats = async () => {
      try {
        const res = await api('/stats');
        const targets = [res.skills || 0, res.members || 0, res.topics || 0];
        
        const duration = 1200;
        const startTime = Date.now();
        const frame = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setStatNums(targets.map(t => Math.floor(t * ease)));
          if (progress < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    loadStats();
  }, [api]);

  useEffect(() => {
    fetchSkills();
  }, [selectedTopic]);

  const fetchSkills = async () => {
    try {
      const params = selectedTopic !== 'All' ? `?category=${selectedTopic}` : '';
      const data = await api(`/skills${params}`);
      setSkills(data.skills.slice(0, 6));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <>
      <Head>
        <title>Home — Skill Swap Connect</title>
      </Head>

      <div className="page-content page-enter" style={{ padding: '0 0 80px' }}>
        {/* Top Bar */}
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
              SkillSwap
            </h1>
            <p style={{ fontSize: 15, color: '#64748B', fontWeight: 500 }}>
              Hey {firstName} 👋
            </p>
          </div>

          <div className="flex items-center">
            <button
              id="notification-bell"
              onClick={() => router.push('/notifications')}
              aria-label="Notifications"
              style={{
                width: 46,
                height: 46,
                borderRadius: 18,
                backgroundColor: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                cursor: 'pointer'
              }}
            >
              <Bell color="#7B61FF" size={22} strokeWidth={2} />
              <span style={{
                position: 'absolute',
                top: 10,
                right: 12,
                width: 8,
                height: 8,
                backgroundColor: '#D946EF',
                borderRadius: '50%',
                border: '2px solid white'
              }} />
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div style={{ padding: '0 20px 20px' }}>
          <div className="hero-banner">
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8, fontWeight: 500 }}>
              Skill Exchange Platform
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', lineHeight: 1.3, marginBottom: 8, position: 'relative', zIndex: 1 }}>
              Share What You Know,<br />Learn What You Love
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 20, position: 'relative', zIndex: 1 }}>
              100% Free — No money needed
            </p>
            <button
              id="explore-skills-btn"
              onClick={() => router.push('/discover')}
              style={{
                background: 'white',
                color: '#7B61FF',
                border: 'none',
                padding: '11px 22px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}
            >
              Explore Skills →
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-12" style={{ padding: '0 20px 24px' }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="stat-card">
              <div className="stat-value">
                {statNums[i] >= 1000 ? `${(statNums[i] / 1000).toFixed(1)}K` : statNums[i]}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Browse by Topic */}
        <div style={{ padding: '0 20px 20px' }}>
          <div className="section-header">
            <h2 className="section-title">Browse by Topic</h2>
          </div>
          <div className="chips-scroll">
            {TOPICS.map(t => (
              <button
                key={t}
                id={`topic-chip-${t.toLowerCase()}`}
                className={`chip ${selectedTopic === t ? 'active' : ''}`}
                onClick={() => setSelectedTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Latest Skills */}
        <div style={{ padding: '0 20px' }}>
          <div className="section-header">
            <h2 className="section-title">Latest Skills ✨</h2>
            <span className="section-action" style={{ color: 'var(--primary)', fontWeight: 600 }} onClick={() => router.push('/discover')}>See All →</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {skills.map(skill => (
                <SkillCard
                  key={skill._id}
                  skill={skill}
                  onSwap={s => setSelectedSkill(s)}
                />
              ))}
            </div>
          )}

          {!loading && skills.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <h3>No skills yet</h3>
              <p>Be the first to add a skill!</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {selectedSkill && (
        <ExchangeModal
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </>
  );
}
