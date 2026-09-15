import React, { useState, useMemo } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { getUniqueWeeks, getWeekBounds } from '../../utils/dateUtils';
import { calculateWeeklySummary } from '../../utils/calculations';
import {
  Trophy,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  History,
  PartyPopper,
} from 'lucide-react';

export default function WeeklyView() {
  const {
    members,
    expenses,
    settings,
    setIsCelebrationModalOpen,
  } = useExpenses();

  // Get all unique weeks from expenses
  const allWeeks = useMemo(() => {
    return getUniqueWeeks(expenses, settings.weekStartDay);
  }, [expenses, settings.weekStartDay]);

  const [selectedWeekKey, setSelectedWeekKey] = useState(() => {
    return allWeeks[0]?.weekKey || '';
  });

  const selectedWeek = useMemo(() => {
    return allWeeks.find(w => w.weekKey === selectedWeekKey) || allWeeks[0];
  }, [allWeeks, selectedWeekKey]);

  // Calculate summary for the selected week
  const weekSummary = useMemo(() => {
    if (!selectedWeek) return null;
    return calculateWeeklySummary(
      members,
      expenses,
      selectedWeek,
      settings.lowestSpenderCriteria
    );
  }, [members, expenses, selectedWeek, settings.lowestSpenderCriteria]);

  // Calculate historical summaries for previous weeks (Spec 10)
  const pastWeeksHistory = useMemo(() => {
    return allWeeks.map(w => {
      const summary = calculateWeeklySummary(
        members,
        expenses,
        w,
        settings.lowestSpenderCriteria
      );
      return {
        week: w,
        summary,
      };
    });
  }, [allWeeks, members, expenses, settings.lowestSpenderCriteria]);

  if (!weekSummary) return null;

  const { lowestMembers, lowestSpent, isTie, memberSpends, totalWeeklySpent, criteria } = weekSummary;

  return (
    <div className="main-content animate-fade-in">
      {/* Week Selector Dropdown / Navigator */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--accent-primary)" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                SELECT WEEK
              </div>
              <select
                value={selectedWeekKey}
                onChange={e => setSelectedWeekKey(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.98rem',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                {allWeeks.map((w, idx) => (
                  <option key={w.weekKey} value={w.weekKey} style={{ background: 'var(--bg-surface)' }}>
                    {idx === 0 ? `Current Week (${w.formattedRange})` : w.formattedRange}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="icon-btn"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)', color: '#fff', border: 'none' }}
            onClick={() => setIsCelebrationModalOpen(true)}
            title="Celebrate Lowest Spender"
          >
            <PartyPopper size={18} />
          </button>
        </div>
      </div>

      {/* Hero Lowest Spender Trophy Card (Spec 9 & 11) */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(236, 72, 153, 0.2) 50%, var(--bg-card) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 10px 30px rgba(245, 158, 11, 0.15)',
          padding: '20px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
          }}
        >
          <Trophy size={36} color="#ffffff" />
        </div>

        <div className="badge badge-warning" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Sparkles size={12} />
          <span>{isTie ? 'Lowest Spenders of the Week' : 'Lowest Spender of the Week'}</span>
        </div>

        <h2
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            margin: '8px 0 2px',
          }}
        >
          {lowestMembers.length > 0 ? lowestMembers.map(m => m.name).join(' & ') : 'No data'}
        </h2>

        <div
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#fbbf24',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {settings.currency}{lowestSpent.toLocaleString()}
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {isTie
            ? `Both spent only ${settings.currency}${lowestSpent}! Everyone else spent more.`
            : `Spent only ${settings.currency}${lowestSpent} this week! Everyone else spent more.`}
        </p>

        {/* Humorous Banner */}
        {settings.humorMode && lowestMembers.length > 0 && (
          <div
            style={{
              background: 'rgba(236, 72, 153, 0.12)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: '0.82rem',
              color: '#f472b6',
              fontWeight: 600,
              marginTop: '12px',
            }}
          >
            "{lowestMembers.map(m => m.name).join(' & ')} is officially the kanjoos of the week 😂"
          </div>
        )}

        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '10px' }}>
          Lowest spender based on {criteria === 'share' ? 'personal share' : 'amount actually paid'}.
        </div>

        <button
          className="btn-primary"
          style={{
            marginTop: '14px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
          }}
          onClick={() => setIsCelebrationModalOpen(true)}
        >
          <Sparkles size={16} />
          <span>Show Full Celebration</span>
        </button>
      </div>

      {/* Weekly Group Spending KPI */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            WEEKLY GROUP SPENDING
          </span>
          <span className="badge badge-primary">{weekSummary.weeklyExpenseCount} expenses</span>
        </div>

        <div
          style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)',
          }}
        >
          {settings.currency}{totalWeeklySpent.toLocaleString()}
        </div>
      </div>

      {/* Member Weekly Spending Leaderboard (Spec 8) */}
      <div>
        <div className="section-header">
          <h3 className="section-title">
            <Trophy size={16} color="var(--accent-primary)" />
            <span>Weekly Spending by Member</span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Sorted highest to lowest
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {memberSpends.map((item, idx) => {
            const isLowest = lowestMembers.some(m => m.id === item.member.id);
            const percentage = totalWeeklySpent > 0 ? Math.round((item.spent / totalWeeklySpent) * 100) : 0;

            return (
              <div
                key={item.member.id}
                className="card"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: isLowest ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-color)',
                  background: isLowest ? 'rgba(245, 158, 11, 0.06)' : 'var(--bg-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', width: '16px' }}>
                    #{idx + 1}
                  </div>
                  <div
                    className="avatar avatar-sm"
                    style={{ backgroundColor: item.member.avatarColor }}
                  >
                    {item.member.initials}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.member.name}</span>
                      {isLowest && (
                        <span className="badge badge-warning" style={{ fontSize: '0.62rem' }}>
                          🏆 Lowest
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.expenseCount} expenses • {percentage}% of week
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {settings.currency}{item.spent.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {criteria === 'share' ? 'fair share' : 'paid'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly History Archive (Spec 10) */}
      <div>
        <div className="section-header">
          <h3 className="section-title">
            <History size={16} color="var(--accent-primary)" />
            <span>Weekly History Archive</span>
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pastWeeksHistory.map((item, idx) => (
            <div
              key={item.week.weekKey}
              className="card"
              style={{
                padding: '12px 14px',
                cursor: 'pointer',
                borderColor: selectedWeekKey === item.week.weekKey ? 'var(--accent-primary)' : 'var(--border-color)',
              }}
              onClick={() => setSelectedWeekKey(item.week.weekKey)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    Week: {item.week.formattedRange}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    Lowest spender:{' '}
                    <strong style={{ color: '#f59e0b' }}>
                      {item.summary.lowestMembers.map(m => m.name).join(' & ')}
                    </strong>{' '}
                    — {settings.currency}{item.summary.lowestSpent}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Total Group</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>
                    {settings.currency}{item.summary.totalWeeklySpent.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
