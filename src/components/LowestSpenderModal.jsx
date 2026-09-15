import React, { useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, X, HeartHandshake, Smile } from 'lucide-react';

export default function LowestSpenderModal() {
  const {
    isCelebrationModalOpen,
    setIsCelebrationModalOpen,
    currentWeeklySummary,
    settings,
  } = useExpenses();

  // Fire celebratory confetti when modal opens
  useEffect(() => {
    if (isCelebrationModalOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      } catch (err) {
        // Safe fallback
      }
    }
  }, [isCelebrationModalOpen]);

  if (!isCelebrationModalOpen) return null;

  const { lowestMembers, lowestSpent, isTie, criteria } = currentWeeklySummary;

  if (!lowestMembers || lowestMembers.length === 0) return null;

  // Title formatting
  const memberNames = lowestMembers.map(m => m.name).join(' & ');

  // Humorous remarks
  const jokes = settings.kanjoosJokes || [
    "Bhai ne paisa bachane ka world record bana diya 😂",
    "Saving master in the house! Treat kab de rahe ho? 🍕",
  ];
  const selectedJoke = jokes[Math.floor(Math.random() * jokes.length)];

  return (
    <div className="modal-overlay" onClick={() => setIsCelebrationModalOpen(false)}>
      <div
        className="modal-content animate-scale-up"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          background: 'linear-gradient(180deg, #1e1b4b 0%, var(--bg-surface) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          boxShadow: '0 20px 50px rgba(99, 102, 241, 0.35)',
        }}
      >
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="icon-btn"
            onClick={() => setIsCelebrationModalOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', paddingTop: 0, paddingBottom: 24 }}>
          {/* Trophy Badge */}
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(245, 158, 11, 0.5)',
              animation: 'bounceTrophy 2s infinite ease-in-out',
            }}
          >
            <Trophy size={46} color="#ffffff" strokeWidth={2.2} />
          </div>

          <div
            className="badge badge-warning"
            style={{
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '10px',
              padding: '6px 14px',
            }}
          >
            <Sparkles size={14} />
            <span>{isTie ? 'Lowest Spenders of the Week' : 'Lowest Spender of the Week'}</span>
          </div>

          <h2
            style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: '#ffffff',
              marginBottom: '6px',
            }}
          >
            {memberNames}
          </h2>

          <div
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: '#fbbf24',
              fontFamily: 'var(--font-heading)',
              margin: '8px 0',
            }}
          >
            {settings.currency || '₹'}{Number(lowestSpent).toLocaleString()}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '300px', margin: '0 auto 16px' }}>
            {isTie
              ? `Both spent only ${settings.currency}${lowestSpent} this week! Everyone else spent more.`
              : `You spent only ${settings.currency}${lowestSpent} this week! Everyone else spent more than you.`}
          </p>

          {/* Humorous Banner (Toggleable via settings.humorMode) */}
          {settings.humorMode && (
            <div
              style={{
                background: 'rgba(236, 72, 153, 0.12)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                margin: '8px 0 16px',
                color: '#f472b6',
                fontWeight: 600,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
              }}
            >
              <Smile size={18} flexShrink={0} />
              <span>"{isTie ? `${memberNames} are officially the kanjoos partners of the week 😂` : selectedJoke}"</span>
            </div>
          )}

          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginBottom: '20px',
            }}
          >
            Calculated based on {criteria === 'share' ? 'personal share consumed' : 'amount actually paid'}
          </div>

          <button
            className="btn-primary"
            onClick={() => setIsCelebrationModalOpen(false)}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
            }}
          >
            <HeartHandshake size={18} />
            <span>Celebrate & Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
}
