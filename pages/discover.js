import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useApp } from './_app';
import BottomNav from '../components/BottomNav';
import SkillCard from '../components/SkillCard';
import ExchangeModal from '../components/ExchangeModal';
import TopHeader from '../components/TopHeader';

const CATEGORIES = ['All', 'Suggested', 'Coding', 'Trading', 'Cooking', 'Music', 'Design', 'Wellness', 'Language', 'Sports'];

export default function DiscoverPage() {
  const { user, api } = useApp();
  const router = useRouter();
  const [skills, setSkills] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    if (!user) router.replace('/');
  }, [user, router]);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      let params = [];
      if (category === 'Suggested') {
        params.push('suggested=true');
      } else if (category !== 'All') {
        params.push(`category=${encodeURIComponent(category)}`);
      }
      if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
      const data = await api(`/skills${params.length ? '?' + params.join('&') : ''}`);
      setSkills(data.skills);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search, api]);

  useEffect(() => {
    const t = setTimeout(fetchSkills, 350);
    return () => clearTimeout(t);
  }, [fetchSkills]);

  return (
    <>
      <Head>
        <title>Discover Skills — Skill Swap Connect</title>
      </Head>

      <div className="page-content page-enter" style={{ padding: '0 0 80px' }}>
        {/* Header */}
        <TopHeader title="Discover" subtitle="Find skills to learn" />

        {/* Search */}
        <div style={{ padding: '0 20px 16px' }}>
          <div className="search-bar">
            <span style={{ fontSize: 18 }}>🔍</span>
            <input
              id="skill-search-input"
              type="text"
              placeholder="Search skills, topics, mentors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', color: 'var(--text-muted)', fontSize: 16 }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ padding: '0 20px 20px' }}>
          <div className="chips-scroll">
            {CATEGORIES.map(c => (
              <button
                key={c}
                id={`filter-${c.toLowerCase()}`}
                className={`chip ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ padding: '0 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="spinner" />
            </div>
          ) : skills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No skills found</h3>
              <p>Try a different search or category</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                {skills.length} skill{skills.length !== 1 ? 's' : ''} found
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {skills.map(skill => (
                  <SkillCard
                    key={skill._id}
                    skill={skill}
                    onSwap={s => setSelectedSkill(s)}
                  />
                ))}
              </div>
            </>
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
