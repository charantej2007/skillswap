import { useState } from 'react';
import { useApp } from '../pages/_app';

export default function ExchangeModal({ skill, onClose }) {
  const { user, api, showToast } = useApp();
  const [offerSkill, setOfferSkill] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const teachSkills = user?.skills_teach || [];

  const handleSubmit = async () => {
    if (!offerSkill) {
      showToast('Please select a skill to offer', 'error');
      return;
    }
    setLoading(true);
    try {
      await api('/exchanges', {
        method: 'POST',
        body: JSON.stringify({
          to_user: skill.mentor_id,
          to_name: skill.mentor_name,
          offer_skill: offerSkill,
          want_skill: skill.title,
          message,
        }),
      });
      showToast('Exchange request sent! 🎉', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to send request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>
          Propose an Exchange
        </h2>

        {/* You'll Learn */}
        <div className="card" style={{ marginBottom: 20, background: 'var(--gradient-soft)', border: '1.5px solid var(--border-active)' }}>
          <p className="text-xs font-semibold text-muted mb-8" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            You&apos;ll Learn
          </p>
          <div className="flex items-center gap-12">
            <div style={{ fontSize: 28 }}>🎯</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16 }}>{skill?.title}</p>
              <p className="text-sm text-muted">with {skill?.mentor_name || 'Mentor'}</p>
            </div>
          </div>
        </div>

        {/* What will you teach */}
        <div className="input-group" style={{ marginBottom: 16 }}>
          <label className="input-label" htmlFor="offer-skill-select">
            What will you teach in return?
          </label>
          {teachSkills.length > 0 ? (
            <select
              id="offer-skill-select"
              className="input-field"
              value={offerSkill}
              onChange={e => setOfferSkill(e.target.value)}
            >
              <option value="">Select a skill...</option>
              {teachSkills.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>
          ) : (
            <div>
              <input
                id="offer-skill-input"
                className="input-field"
                placeholder="e.g. Python, Guitar, Cooking..."
                value={offerSkill}
                onChange={e => setOfferSkill(e.target.value)}
              />
              <p className="text-xs text-muted mt-4">
                💡 Add skills to your profile to offer them here
              </p>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="input-group" style={{ marginBottom: 24 }}>
          <label className="input-label" htmlFor="exchange-message">Your Message</label>
          <textarea
            id="exchange-message"
            className="input-field"
            placeholder="Introduce yourself and why you'd like to learn this skill..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-12">
          <button
            id="exchange-cancel-btn"
            className="btn btn-ghost btn-full"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            id="exchange-send-btn"
            className="btn btn-primary btn-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '...' : '🚀 Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
