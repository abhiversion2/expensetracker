import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { formatDateShort } from '../../utils/dateUtils';
import { Users, ChevronRight } from 'lucide-react';

export default function ExpenseCard({ expense }) {
  const { members, settings, setSelectedExpenseDetails } = useExpenses();
  const memberMap = new Map(members.map(m => [m.id, m]));
  const payer = memberMap.get(expense.paidBy);

  const participantCount = expense.participants?.length || 0;
  const sampleShare = expense.participants?.[0]?.share || (expense.amount / (participantCount || 1));

  return (
    <div
      className="card"
      style={{
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'all 0.15s ease',
      }}
      onClick={() => setSelectedExpenseDetails(expense)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="avatar avatar-sm"
            style={{ backgroundColor: payer?.avatarColor || '#6366f1' }}
          >
            {payer?.initials || 'P'}
          </div>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, lineHeight: 1.2 }}>
              {expense.description}
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Paid by <strong style={{ color: 'var(--text-primary)' }}>{payer?.name || 'Unknown'}</strong> • {formatDateShort(expense.date)}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
            }}
          >
            {settings.currency || '₹'}{Number(expense.amount).toLocaleString()}
          </div>
          <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
            {expense.category || 'General'}
          </span>
        </div>
      </div>

      {/* Participants & Share Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={13} />
          <span>
            {participantCount} friends • {settings.currency}{Number(sampleShare).toFixed(0)}/person
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-muted)' }}>
          <span>Details</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}
