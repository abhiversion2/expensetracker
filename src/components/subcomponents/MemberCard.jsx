import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function MemberCard({ member, balanceData, totalGroupSpending, onSelectMember }) {
  const { settings } = useExpenses();

  const totalPaid = balanceData?.totalPaid || 0;
  const expenseCount = balanceData?.paidExpenseCount || 0;
  const netBalance = balanceData?.netBalance || 0;

  const spendingPercentage = totalGroupSpending > 0
    ? Math.round((totalPaid / totalGroupSpending) * 100)
    : 0;

  return (
    <div
      className="card"
      style={{
        padding: '14px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '135px',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
      onClick={() => onSelectMember(member.id)}
      title={`View ${member.name}'s personal folder`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className="avatar avatar-sm"
            style={{ backgroundColor: member.avatarColor }}
          >
            {member.initials}
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{member.name}</h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}
            </span>
          </div>
        </div>

        {/* Net status pill */}
        {netBalance !== 0 && (
          <span
            className={`badge ${netBalance > 0 ? 'badge-success' : 'badge-danger'}`}
            style={{ fontSize: '0.65rem' }}
          >
            {netBalance > 0 ? (
              <>
                <ArrowUpRight size={11} />
                <span>+{settings.currency}{netBalance.toFixed(0)}</span>
              </>
            ) : (
              <>
                <ArrowDownRight size={11} />
                <span>-{settings.currency}{Math.abs(netBalance).toFixed(0)}</span>
              </>
            )}
          </span>
        )}
      </div>

      <div style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Paid</span>
          <span
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
            }}
          >
            {settings.currency || '₹'}{Number(totalPaid).toLocaleString()}
          </span>
        </div>

        {/* Percentage bar */}
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'var(--border-color)',
            borderRadius: 'var(--radius-full)',
            marginTop: '6px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(spendingPercentage, 100)}%`,
              height: '100%',
              backgroundColor: member.avatarColor,
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {spendingPercentage}% of group
          </span>
        </div>
      </div>
    </div>
  );
}
