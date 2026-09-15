import React, { useState, useMemo } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { getUniqueMonths, formatMonthYear } from '../../utils/dateUtils';
import { calculateMonthlySummary } from '../../utils/calculations';
import {
  Calendar,
  PieChart,
  TrendingUp,
  Award,
  Layers,
  Calculator,
  Flame,
  ArrowDownRight,
} from 'lucide-react';

export default function MonthlyView() {
  const { members, expenses, settings } = useExpenses();

  const allMonths = useMemo(() => {
    return getUniqueMonths(expenses);
  }, [expenses]);

  const [selectedMonthKey, setSelectedMonthKey] = useState(() => {
    return allMonths[0] || new Date().toISOString().substring(0, 7);
  });

  const monthSummary = useMemo(() => {
    return calculateMonthlySummary(members, expenses, selectedMonthKey);
  }, [members, expenses, selectedMonthKey]);

  const {
    totalGroupSpent,
    transactionCount,
    memberRankings,
    highestSpender,
    lowestSpender,
    mostCommonCategory,
    categoryBreakdown,
    averageExpense,
  } = monthSummary;

  return (
    <div className="main-content animate-fade-in">
      {/* Month Selector */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--accent-primary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              SELECT MONTH
            </div>
            <select
              value={selectedMonthKey}
              onChange={e => setSelectedMonthKey(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '1rem',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              {allMonths.map(mKey => (
                <option key={mKey} value={mKey} style={{ background: 'var(--bg-surface)' }}>
                  {formatMonthYear(mKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Monthly Hero Total */}
      <div className="card card-gradient-hero">
        <span className="badge badge-primary">Monthly Analytics</span>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
          Total Spending for {formatMonthYear(selectedMonthKey)}
        </div>
        <div
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            margin: '4px 0 10px',
          }}
        >
          {settings.currency}{totalGroupSpent.toLocaleString()}
        </div>

        <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>{transactionCount}</strong> transactions
          </div>
          <div>•</div>
          <div>
            Avg:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {settings.currency}{averageExpense}
            </strong>
          </div>
        </div>
      </div>

      {/* Highest & Lowest Spender Highlights (Spec 14) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Highest */}
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#f43f5e' }}>
            <Flame size={14} />
            <span>HIGHEST SPENDER</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px' }}>
            {highestSpender?.amount > 0 ? highestSpender.member.name : 'None'}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
            {highestSpender?.amount > 0 ? `${settings.currency}${highestSpender.amount.toLocaleString()}` : '—'}
          </div>
        </div>

        {/* Lowest */}
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>
            <Award size={14} />
            <span>LOWEST SPENDER</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px' }}>
            {lowestSpender?.member.name || 'None'}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
            {settings.currency}{(lowestSpender?.amount || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Most Common Category */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            MOST FREQUENT CATEGORY
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {mostCommonCategory}
          </div>
        </div>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Layers size={22} />
        </div>
      </div>

      {/* Individual Spending Breakdown */}
      <div>
        <div className="section-header">
          <h3 className="section-title">
            <span>Individual Spending Breakdown</span>
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {memberRankings.map((item, idx) => {
            const pct = totalGroupSpent > 0 ? Math.round((item.amount / totalGroupSpent) * 100) : 0;
            return (
              <div key={item.member.id} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      className="avatar avatar-sm"
                      style={{ backgroundColor: item.member.avatarColor }}
                    >
                      {item.member.initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.member.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.count} expenses paid
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', fontFamily: 'var(--font-heading)' }}>
                      {settings.currency}{item.amount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pct}% of month</div>
                  </div>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--border-color)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: item.member.avatarColor,
                      borderRadius: 'var(--radius-full)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown Bars */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div>
          <div className="section-header">
            <h3 className="section-title">
              <span>Category Distribution</span>
            </h3>
          </div>

          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(categoryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const catPct = totalGroupSpent > 0 ? Math.round((amt / totalGroupSpent) * 100) : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{cat}</span>
                      <strong style={{ fontFamily: 'var(--font-heading)' }}>
                        {settings.currency}{amt.toLocaleString()} ({catPct}%)
                      </strong>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: 'var(--border-color)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${catPct}%`,
                          height: '100%',
                          background: 'var(--accent-gradient)',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
