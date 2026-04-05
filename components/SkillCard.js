import { useState } from 'react';
import { useApp } from '../pages/_app';

const CATEGORY_ICONS = {
  'Coding': '💻', 'Trading': '📈', 'Cooking': '🍳', 'Music': '🎸',
  'Design': '🎨', 'Wellness': '🧘', 'Language': '🌍', 'Sports': '⚽',
  'Finance': '💰', 'Other': '✨',
};

function getLevelBadge(level) {
  if (!level) return null;
  return (
    <span style={{ 
      color: 'var(--info)', 
      background: 'rgba(59,130,246,0.1)', 
      border: '1px solid rgba(59,130,246,0.2)', 
      padding: '4px 12px', 
      borderRadius: '999px',
      fontSize: 12,
      fontWeight: 600
    }}>
      {level}
    </span>
  );
}

export default function SkillCard({ skill, onSwap, isOwn }) {
  const [pressed, setPressed] = useState(false);
  const icon = CATEGORY_ICONS[skill.category] || '✨';

  return (
    <div
      className="skill-card-app flex-col"
      style={{ opacity: pressed ? 0.9 : 1 }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={() => { if (!isOwn && onSwap) onSwap(skill); }}
    >
      <div className="skill-card-top-border" />
      
      {/* Top Row: Icon + Title + Live Badge */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-12">
          <div className="skill-icon-box">
            {icon}
          </div>
          <div className="flex-col">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
              {skill.title}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 2 }}>
              {skill.category}
            </p>
          </div>
        </div>
        
        {skill.is_live && (
          <span className="badge badge-live" style={{ 
            background: 'var(--secondary)', 
            color: 'white', 
            borderRadius: '999px', 
            padding: '4px 12px', 
            fontSize: 10,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            ⚡ LIVE
          </span>
        )}
      </div>

      {/* Description */}
      {skill.description && (
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
          {skill.description.length > 80 ? skill.description.substring(0, 80) + '...' : skill.description}
        </p>
      )}

      {/* Meta Pills */}
      <div className="flex items-center gap-12 mb-16">
        {getLevelBadge(skill.level)}
        <span style={{ fontSize: 12, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          {skill.availability || 'Flexible'}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--surface3)', margin: '0 -20px 16px', opacity: 0.5 }} />

      {/* Mentor Info */}
      <div className="flex items-center gap-12">
        <div
          className="avatar avatar-sm"
          style={{ fontSize: 14, background: '#6366F1' }}
        >
          {skill.mentor_name ? skill.mentor_name[0].toUpperCase() : '?'}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase' }}>
          {skill.mentor_name || 'Anonymous'}
        </span>
      </div>
      
      {/* Visual Swap Indicator on Hover (App-like interactivity constraint) */}
      {!isOwn && (
        <div style={{ position: 'absolute', bottom: 16, right: 20, color: 'var(--primary)', opacity: 0, transition: 'opacity 0.2s' }} className="swap-indicator">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-4 4"/><path d="M3 17l4-4 4 4"/><path d="M21 7H7"/><path d="M3 17h14"/></svg>
        </div>
      )}
    </div>
  );
}
