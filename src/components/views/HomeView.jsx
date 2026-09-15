import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import MemberCard from '../subcomponents/MemberCard';
import ExpenseCard from '../subcomponents/ExpenseCard';
import {
  PlusCircle,
  Receipt,
  User,
  Users,
  Trophy,
  Scale,
  Sparkles,
  ArrowRight,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

export default function HomeView() {
  const {
    members,
    expenses,
    settings,
    balances,
    settlements,
    totalGroupSpending,
    currentWeeklySummary,
    setCurrentView,
    setActiveMemberId,
    setIsAddExpenseOpen,
    setIsCelebrationModalOpen,
  } = useExpenses();

  const [timeScope, setTimeScope] = useState('all'); // 'all', 'month', 'week'

  // Calculate scope amount
  const displayTotal = React.useMemo(() => {
    if (timeScope === 'week') {
      return currentWeeklySummary.totalWeeklySpent;
    }
    if (timeScope === 'month') {
      const curMonth = new Date().toISOString().substring(0, 7);
      return expenses
        .filter(e => e.date && e.date.startsWith(curMonth))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    }
    return totalGroupSpending;
  }, [timeScope, currentWeeklySummary.totalWeeklySpent, expenses, totalGroupSpending]);

  const handleMemberClick = (memberId) => {
    setActiveMemberId(memberId);
    setCurrentView('personal');
  };

  const recentExpenses = expenses.slice(0, 4);

  return (
    <div className="main-content animate-fade-in">
      {/* Hero Overview Card */}
      <div className="card card-gradient-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="badge badge-primary">
            <Sparkles size={12} />
            <span>Group Overview</span>
          </span>

          {/* Time Scope Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', padding: '2px' }}>
            {['all', 'month', 'week'].map(scope => (
              <button
                key={scope}
                onClick={() => setTimeScope(scope)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: timeScope === scope ? 'var(--accent-primary)' : 'transparent',
                  color: timeScope === scope ? '#ffffff' : 'var(--text-secondary)',
                  textTransform: 'capitalize',
                }}
              >
                {scope === 'all' ? 'Total' : scope === 'month' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {timeScope === 'all' ? 'Total Group Spending' : timeScope === 'month' ? 'Spent This Month' : 'Spent This Week'}
        </div>

        <div
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            margin: '4px 0 12px',
          }}
        >
          {settings.currency || '₹'}{Number(displayTotal).toLocaleString()}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>{expenses.length}</strong> transactions
          </div>
          <div>•</div>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>{members.length}</strong> group friends
          </div>
        </div>
      </div>

      {/* Prominent Action Buttons Grid (Required in Spec 2) */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
        </div>

        <div className="action-grid">
          <button
            className="action-pill"
            onClick={() => setIsAddExpenseOpen(true)}
            style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' }}
          >
            <div className="action-pill-icon" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
              <PlusCircle size={18} />
            </div>
            <span>+ Add Expense</span>
          </button>

          <button
            className="action-pill"
            onClick={() => setCurrentView('expenses')}
          >
            <div className="action-pill-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
              <Receipt size={18} />
            </div>
            <span>Group Expenses</span>
          </button>

          <button
            className="action-pill"
            onClick={() => setCurrentView('personal')}
          >
            <div className="action-pill-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <User size={18} />
            </div>
            <span>Personal Folders</span>
          </button>

          <button
            className="action-pill"
            onClick={() => setCurrentView('members')}
          >
            <div className="action-pill-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
              <Users size={18} />
            </div>
            <span>Members</span>
          </button>

          <button
            className="action-pill"
            onClick={() => setCurrentView('weekly')}
          >
            <div className="action-pill-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Trophy size={18} />
            </div>
            <span>Weekly Summary</span>
          </button>

          <button
            className="action-pill"
            onClick={() => setCurrentView('settlement')}
          >
            <div className="action-pill-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              <Scale size={18} />
            </div>
            <span>Settlement</span>
          </button>
        </div>
      </div>

      {/* Lowest Spender Banner Callout if Week has data */}
      {currentWeeklySummary.lowestMembers.length > 0 && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(236, 72, 153, 0.12) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setIsCelebrationModalOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
              }}
            >
              <Trophy size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase' }}>
                Lowest Spender of the Week
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700 }}>
                {currentWeeklySummary.lowestMembers.map(m => m.name).join(' & ')}
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '6px', fontSize: '0.85rem' }}>
                  ({settings.currency}{currentWeeklySummary.lowestSpent})
                </span>
              </div>
            </div>
          </div>

          <span className="badge badge-warning" style={{ gap: '2px' }}>
            <span>Celebrate</span>
            <Sparkles size={11} />
          </span>
        </div>
      )}

      {/* Group Members Cards Section (Spec 2) */}
      <div>
        <div className="section-header">
          <h2 className="section-title">
            <Users size={18} color="var(--accent-primary)" />
            <span>Group Members</span>
          </h2>
          <button
            onClick={() => setCurrentView('members')}
            style={{ background: 'transparent', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600 }}
          >
            Manage
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {members.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              balanceData={balances[member.id]}
              totalGroupSpending={totalGroupSpending}
              onSelectMember={handleMemberClick}
            />
          ))}
        </div>
      </div>

      {/* Quick Settlement Preview */}
      {settlements.length > 0 && (
        <div className="card" style={{ padding: '16px' }}>
          <div className="section-header" style={{ marginBottom: '8px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={16} color="var(--accent-primary)" />
              <span>Pending Settlements ({settlements.length})</span>
            </h3>
            <button
              onClick={() => setCurrentView('settlement')}
              style={{ background: 'transparent', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 600 }}
            >
              See All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {settlements.slice(0, 2).map((st, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-input)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <span style={{ color: 'var(--danger)' }}>{st.fromName}</span>
                  <ArrowRight size={13} color="var(--text-muted)" />
                  <span style={{ color: 'var(--success)' }}>{st.toName}</span>
                </div>
                <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}>
                  {settings.currency}{st.amount}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Expenses List */}
      <div>
        <div className="section-header">
          <h2 className="section-title">
            <Receipt size={18} color="var(--accent-primary)" />
            <span>Recent Expenses</span>
          </h2>
          <button
            onClick={() => setCurrentView('expenses')}
            style={{ background: 'transparent', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600 }}
          >
            View All ({expenses.length})
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
              No expenses recorded yet.
            </p>
            <button
              className="btn-primary"
              style={{ maxWidth: '200px', margin: '0 auto' }}
              onClick={() => setIsAddExpenseOpen(true)}
            >
              + Add First Expense
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentExpenses.map(exp => (
              <ExpenseCard key={exp.id} expense={exp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
