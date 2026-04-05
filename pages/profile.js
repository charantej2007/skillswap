import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from './_app';
import BottomNav from '../components/BottomNav';

const CATEGORIES = ['Coding', 'Trading', 'Cooking', 'Music', 'Design', 'Wellness', 'Language', 'Sports', 'Finance', 'Other'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const AVAILABILITY_OPTIONS = ['Mornings', 'Evenings', 'Weekends', 'Weekdays', 'Flexible'];

function AddSkillModal({ onClose, onAdded, api, showToast, userName }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Coding', level: 'Beginner', availability: 'Flexible' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) { showToast('Skill title is required', 'error'); return; }
    setLoading(true);
    try {
      await api('/skills', {
        method: 'POST',
        body: JSON.stringify({ ...form, mentor_name: userName }),
      });
      showToast('Skill added! 🎉', 'success');
      onAdded();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to add skill', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Add a Skill to Teach</h2>

        <div className="input-group mb-16">
          <label className="input-label" htmlFor="skill-title">Skill Title *</label>
          <input id="skill-title" className="input-field" placeholder="e.g. Python Programming" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>

        <div className="input-group mb-16">
          <label className="input-label" htmlFor="skill-desc">Description</label>
          <textarea id="skill-desc" className="input-field" placeholder="What will you teach? What will students learn?" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
        </div>

        <div className="flex gap-12 mb-16">
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label" htmlFor="skill-cat">Category</label>
            <select id="skill-cat" className="input-field" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label" htmlFor="skill-level">Level</label>
            <select id="skill-level" className="input-field" value={form.level}
              onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="input-group mb-24">
          <label className="input-label" htmlFor="skill-avail">Availability</label>
          <select id="skill-avail" className="input-field" value={form.availability}
            onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}>
            {AVAILABILITY_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="flex gap-12">
          <button id="cancel-add-skill" className="btn btn-ghost btn-full" onClick={onClose}>Cancel</button>
          <button id="save-skill-btn" className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
            {loading ? '...' : '✓ Add Skill'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddLearnModal({ onClose, onAdded, api, showToast, user }) {
  const [form, setForm] = useState({ title: '', category: 'Coding' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) { showToast('Skill title is required', 'error'); return; }
    setLoading(true);
    try {
      const updatedLearnSkills = [...(user.skills_learn || []), form];
      const res = await api('/user', {
        method: 'POST',
        body: JSON.stringify({ skills_learn: updatedLearnSkills }),
      });
      showToast('Learning goal added! 🎯', 'success');
      onAdded(res.user);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to add learning goal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    // Optionally let them clear if needed, but not strictly required
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Add a Skill to Learn</h2>

        <div className="input-group mb-16">
          <label className="input-label" htmlFor="learn-title">What do you want to learn? *</label>
          <input id="learn-title" className="input-field" placeholder="e.g. Italian Cooking" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
        </div>

        <div className="input-group mb-24">
          <label className="input-label" htmlFor="learn-cat">Category</label>
          <select id="learn-cat" className="input-field" value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex gap-12">
          <button id="cancel-add-learn" className="btn btn-ghost btn-full" onClick={onClose}>Cancel</button>
          <button id="save-learn-btn" className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
            {loading ? '...' : '✓ Add Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, api, showToast, logout, updateUser } = useApp();
  const router = useRouter();
  const [profileTab, setProfileTab] = useState('teach');
  const [mySkills, setMySkills] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddLearnModal, setShowAddLearnModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    fetchMySkills();
    setNewName(user.name || '');
  }, [user, router]);

  const fetchMySkills = async () => {
    try {
      const data = await api('/skills');
      const mine = (data.skills || []).filter(s => String(s.mentor_id) === String(user?._id));
      setMySkills(mine);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!confirm('Delete this skill?')) return;
    try {
      await api(`/skills?id=${id}`, { method: 'DELETE' });
      showToast('Skill deleted', 'info');
      fetchMySkills();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveName = async () => {
    try {
      const data = await api('/user', {
        method: 'POST',
        body: JSON.stringify({ name: newName }),
      });
      updateUser(data.user);
      setEditingName(false);
      showToast('Name updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const data = await api('/user', {
          method: 'POST',
          body: JSON.stringify({ profile_image: reader.result }),
        });
        updateUser(data.user);
        showToast('Profile photo updated!', 'success');
      } catch (err) {
        showToast('Failed to upload image', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const teachSkills = user?.skills_teach || [];
  const learnSkills = user?.skills_learn || [];
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'You';

  return (
    <>
      <Head>
        <title>Profile — Skill Swap Connect</title>
      </Head>

      <div className="page-content page-enter" style={{ padding: '0 0 80px' }}>
        {/* Gradient Header */}
        <div className="profile-header">
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{ marginBottom: 16, position: 'relative', display: 'inline-block' }}>
              <input 
                type="file" 
                accept="image/*" 
                id="profile-upload" 
                style={{ display: 'none' }} 
                onChange={handleImageUpload} 
              />
              <label htmlFor="profile-upload" style={{ cursor: 'pointer', display: 'block', position: 'relative' }}>
                {user?.profile_image && user.profile_image.startsWith('data:image') ? (
                  <img
                    src={user.profile_image}
                    alt={user.name}
                    style={{ width: 84, height: 84, borderRadius: '50%', margin: '0 auto', border: '3px solid white', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="avatar avatar-xl" style={{ margin: '0 auto', border: '3px solid rgba(255,255,255,0.5)', width: 84, height: 84, fontSize: 32 }}>
                    {(user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div style={{ 
                  position: 'absolute', bottom: 0, right: 0, 
                  background: 'white', borderRadius: '50%', width: 28, height: 28, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)', fontSize: 13, border: '1px solid var(--border)'
                }}>
                  📷
                </div>
              </label>
            </div>

            {/* Name */}
            {editingName ? (
              <div className="flex items-center gap-8" style={{ justifyContent: 'center', marginBottom: 8 }}>
                <input
                  id="edit-name-input"
                  className="input-field"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ maxWidth: 200, textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                />
                <button onClick={handleSaveName} style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '6px 14px', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save</button>
              </div>
            ) : (
              <h1
                style={{ color: 'white', fontSize: 22, fontWeight: 800, marginBottom: 4, cursor: 'pointer' }}
                onClick={() => setEditingName(true)}
                title="Click to edit name"
              >
                {user?.name || 'Your Name'} ✏️
              </h1>
            )}

            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 20 }}>
              {user?.email}
            </p>

            {/* Counters */}
            <div className="flex gap-20" style={{ justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>{mySkills.length}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Teaching</p>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>{learnSkills.length}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Learning</p>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>—</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Exchanges</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 20px 0', marginTop: -24, position: 'relative', background: 'var(--bg)', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 20 }}>
            <button id="tab-teach" className={`tab ${profileTab === 'teach' ? 'active' : ''}`} onClick={() => setProfileTab('teach')}>
              I Can Teach
            </button>
            <button id="tab-learn" className={`tab ${profileTab === 'learn' ? 'active' : ''}`} onClick={() => setProfileTab('learn')}>
              I Want to Learn
            </button>
          </div>

          {/* Add Skill Button */}
          {profileTab === 'teach' && (
            <button
              id="add-skill-btn"
              className="btn btn-primary btn-full mb-16"
              onClick={() => setShowAddModal(true)}
            >
              + Add Skill to Teach
            </button>
          )}

          {profileTab === 'learn' && (
            <button
              id="add-learn-btn"
              className="btn btn-primary btn-full mb-16"
              onClick={() => setShowAddLearnModal(true)}
              style={{ background: 'var(--gradient-soft)', color: 'var(--primary)', boxShadow: 'none' }}
            >
              + Add Skill to Learn
            </button>
          )}

          {/* Skills List */}
          {profileTab === 'teach' ? (
            loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
            ) : mySkills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h3>No skills added yet</h3>
                <p>Add the skills you can teach to attract learners</p>
              </div>
            ) : (
              mySkills.map(skill => (
                <div key={skill._id} className="card mb-12" style={{ position: 'relative' }}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 style={{ fontWeight: 700, fontSize: 16 }}>{skill.title}</h3>
                    <div className="flex gap-8">
                      <span className={`badge badge-${skill.level?.toLowerCase()}`}>{skill.level}</span>
                    </div>
                  </div>
                  {skill.description && (
                    <p className="text-sm text-muted mb-12">{skill.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">📅 {skill.availability}</span>
                    <button
                      id={`delete-skill-${skill._id}`}
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteSkill(skill._id)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            <div>
              {learnSkills.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <h3>No learning goals yet</h3>
                  <p>Add what you'd like to learn, and we'll suggest mentors for you!</p>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 16 }}
                    onClick={() => router.push('/discover')}
                  >
                    Discover Skills
                  </button>
                </div>
              ) : (
                learnSkills.map((s, i) => (
                  <div key={i} className="card mb-12 flex items-center justify-between gap-12">
                    <div className="flex items-center gap-12">
                      <span style={{ fontSize: 24 }}>📚</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.title || s}</div>
                        {s.category && <div className="text-xs text-muted">{s.category}</div>}
                      </div>
                    </div>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={async () => {
                        const updated = learnSkills.filter((_, idx) => idx !== i);
                        try {
                          const res = await api('/user', { method: 'POST', body: JSON.stringify({ skills_learn: updated }) });
                          updateUser(res.user);
                          showToast('Goal removed', 'info');
                        } catch (err) { }
                      }}
                    >
                      🗑
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sign Out */}
          <div style={{ marginTop: 32 }}>
            <button
              id="signout-btn"
              className="btn btn-danger btn-full"
              onClick={() => {
                if (confirm('Sign out of Skill Swap?')) logout();
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <BottomNav />

      {showAddModal && (
        <AddSkillModal
          onClose={() => setShowAddModal(false)}
          onAdded={fetchMySkills}
          api={api}
          showToast={showToast}
          userName={user?.name || user?.email}
        />
      )}

      {showAddLearnModal && (
        <AddLearnModal
          onClose={() => setShowAddLearnModal(false)}
          onAdded={(u) => updateUser(u)}
          api={api}
          showToast={showToast}
          user={user}
        />
      )}
    </>
  );
}
