import React, { useState, useMemo } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { getMemberPersonalLedger } from '../../utils/calculations';
import { exportPersonalLedgerCsv } from '../../utils/exportUtils';
import { formatDateShort, isDateInWeek } from '../../utils/dateUtils';
import {
  User,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Calendar,
  Wallet,
  Coins,
  Scale,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function PersonalView() {
  const {
    members,
    expenses,
    activeMemberId,
    setActiveMemberId,
    balances,
    settings,
    currentWeekBounds,
    setSelectedExpenseDetails,
  } = useExpenses();

  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all', 'paidByMe', 'splitWithMe'

  const activeMember = useMemo(() => {
    return members.find(m => m.id === activeMemberId) || members[0];
  }, [members, activeMemberId]);

  // Dynamically derive the personal ledger from the group expenses
  const personalRecords = useMemo(() => {
    if (!activeMember) return [];
    return getMemberPersonalLedger(activeMember.id, expenses, members);
  }, [activeMember, expenses, members]);

  // Filtered records
  const displayRecords = useMemo(() => {
    if (activeTabFilter === 'paidByMe') {
      return personalRecords.filter(r => r.isPayer);
    }
    if (activeTabFilter === 'splitWithMe') {
      return personalRecords.filter(r => !r.isPayer);
    }
    return personalRecords;
  }, [personalRecords, activeTabFilter]);

  // Aggregate stats
  const memberBalance = balances[activeMember?.id] || {
    totalPaid: 0,
    personalShare: 0,
    netBalance: 0,
  };

  // Weekly total paid by this member
  const weeklyTotalPaid = useMemo(() => {
    return personalRecords
      .filter(r => r.isPayer && isDateInWeek(r.date, currentWeekBounds))
      .reduce((sum, r) => sum + r.amountPaidByMe, 0);
  }, [personalRecords, currentWeekBounds]);

  // Monthly total paid by this member (current month)
  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const monthlyTotalPaid = useMemo(() => {
    return personalRecords
      .filter(r => r.isPayer && r.date && r.date.startsWith(currentMonthKey))
      .reduce((sum, r) => sum + r.amountPaidByMe, 0);
  }, [personalRecords, currentMonthKey]);

  const handleExport = () => {
    if (activeMember && personalRecords.length > 0) {
      exportPersonalLedgerCsv(activeMember, personalRecords, settings.currency);
    }
  };

  if (!activeMember) return null;

  return (
    <div className="main-content animate-fade-in">
      {/* Member Selector Scroll / Pills */}
      <div className="chips-scroll" style={{ paddingBottom: '2px' }}>
        {members.map(m => {
          const isSelected = m.id === activeMemberId;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMemberId(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: isSelected ? 'var(--accent-gradient)' : 'var(--bg-input)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${isSelected ? 'transparent' : 'var(--border-color)'}`,
                fontWeight: 600,
                fontSize: '0.84rem',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? 'var(--accent-glow)' : 'none',
              }}
            >
              <div
                className="avatar avatar-sm"
                style={{
                  backgroundColor: isSelected ? '#ffffff' : m.avatarColor,
                  color: isSelected ? '#4f46e5' : '#ffffff',
                  width: '24px',
                  height: '24px',
                  fontSize: '0.7rem',
                }}
              >
                {m.initials}
              </div>
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Member Hero Summary Card */}
      <div className="card card-gradient-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="avatar avatar-md"
              style={{ backgroundColor: activeMember.avatarColor, width: '52px', height: '52px', fontSize: '1.2rem' }}
            >
              {activeMember.initials}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Personal Folder
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{activeMember.name}</h2>
            </div>
          </div>

          <button
            className="icon-btn"
            onClick={handleExport}
            title={`Export ${activeMember.name}'s Ledger as CSV`}
          >
            <Download size={18} />
          </button>
        </div>

        {/* Paid vs Share vs Net Balance Grid (Spec 5 & 6) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginTop: '16px',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '12px 10px',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              TOTAL PAID
            </div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-primary)',
                marginTop: '2px',
              }}
            >
              {settings.currency}{memberBalance.totalPaid.toLocaleString()}
            </div>
          </div>

          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              MY SHARE
            </div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              {settings.currency}{memberBalance.personalShare.toLocaleString()}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              NET BALANCE
            </div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                color: memberBalance.netBalance >= 0 ? 'var(--success)' : 'var(--danger)',
                marginTop: '2px',
              }}
            >
              {memberBalance.netBalance >= 0 ? '+' : ''}
              {settings.currency}{memberBalance.netBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Net Status Message */}
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: memberBalance.netBalance >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${memberBalance.netBalance >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: memberBalance.netBalance >= 0 ? 'var(--success)' : 'var(--danger)',
          }}
        >
          <span>
            {memberBalance.netBalance > 0
              ? `Should receive ${settings.currency}${memberBalance.netBalance.toLocaleString()}`
              : memberBalance.netBalance < 0
              ? `Owes ${settings.currency}${Math.abs(memberBalance.netBalance).toLocaleString()} to group`
              : 'All settled up! (Net ₹0)'}
          </span>
          <Scale size={14} />
        </div>
      </div>

      {/* Weekly & Monthly Sub-Totals (Spec 5) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            THIS WEEK'S PAID
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              marginTop: '4px',
            }}
          >
            {settings.currency}{weeklyTotalPaid.toLocaleString()}
          </div>
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            THIS MONTH'S PAID
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              marginTop: '4px',
            }}
          >
            {settings.currency}{monthlyTotalPaid.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter Tabs: All / Paid by Me / Split with Me */}
      <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
        {[
          { id: 'all', label: `All (${personalRecords.length})` },
          { id: 'paidByMe', label: `Paid by Me (${personalRecords.filter(r => r.isPayer).length})` },
          { id: 'splitWithMe', label: `My Shares (${personalRecords.filter(r => !r.isPayer).length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTabFilter(tab.id)}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: activeTabFilter === tab.id ? 'var(--bg-surface)' : 'transparent',
              color: activeTabFilter === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTabFilter === tab.id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Personal Ledger Records List */}
      <div>
        <div className="section-header">
          <h3 className="section-title">
            <Receipt size={16} color="var(--accent-primary)" />
            <span>Expense Ledger</span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Auto-synced from group
          </span>
        </div>

        {displayRecords.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No transactions found for {activeMember.name} in this filter.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayRecords.map((rec, idx) => {
              const fullExpense = expenses.find(e => e.id === rec.expenseId);

              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                  onClick={() => fullExpense && setSelectedExpenseDetails(fullExpense)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '0.94rem', fontWeight: 700 }}>
                        {rec.description}
                      </h4>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {formatDateShort(rec.date)} {rec.time ? `• ${rec.time}` : ''} • {rec.category}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-heading)',
                          color: rec.isPayer ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {rec.isPayer
                          ? `${settings.currency}${rec.amountPaidByMe.toLocaleString()}`
                          : `${settings.currency}${rec.totalAmount.toLocaleString()}`}
                      </div>
                      <span
                        className={`badge ${rec.isPayer ? 'badge-primary' : 'badge-warning'}`}
                        style={{ fontSize: '0.62rem' }}
                      >
                        {rec.isPayer ? 'Paid by Me' : `Paid by ${rec.payerName}`}
                      </span>
                    </div>
                  </div>

                  {/* Ledger Breakdown Row: Paid vs Share */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>
                      My fair share:{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {settings.currency}{rec.myShare.toFixed(2)}
                      </strong>
                    </span>

                    <span style={{ fontWeight: 600, color: rec.netImpact >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {rec.netImpact >= 0 ? `+${settings.currency}${rec.netImpact.toFixed(2)}` : `-${settings.currency}${Math.abs(rec.netImpact).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
