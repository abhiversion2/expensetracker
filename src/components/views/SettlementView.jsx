import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import {
  Scale,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Send,
} from 'lucide-react';

export default function SettlementView() {
  const {
    members,
    settlements,
    balances,
    settings,
    recordSettlement,
    setConfirmDialog,
  } = useExpenses();

  const memberList = Object.values(balances);
  const creditors = memberList.filter(b => b.netBalance > 0.01).sort((a, b) => b.netBalance - a.netBalance);
  const debtors = memberList.filter(b => b.netBalance < -0.01).sort((a, b) => a.netBalance - b.netBalance);
  const settled = memberList.filter(b => Math.abs(b.netBalance) <= 0.01);

  const handleSettleClick = (transaction) => {
    setConfirmDialog({
      title: 'Record Settlement Payment?',
      message: `Record that ${transaction.fromName} paid ${settings.currency}${transaction.amount} to ${transaction.toName}? This will adjust their balances.`,
      confirmText: 'Record Settlement',
      isDanger: false,
      onConfirm: () => {
        recordSettlement(transaction.fromMemberId, transaction.toMemberId, transaction.amount);
      },
    });
  };

  return (
    <div className="main-content animate-fade-in">
      {/* Overview Header Card */}
      <div className="card card-gradient-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-primary">
            <Scale size={12} />
            <span>Optimal Settlement Engine</span>
          </span>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
          Simplified Friend Balances
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          We calculate the absolute minimum number of payments required so everyone settles up completely.
        </p>

        {settlements.length === 0 ? (
          <div
            style={{
              marginTop: '14px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--success-bg)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <CheckCircle2 size={20} />
            <span>All members are completely settled up! No debts pending.</span>
          </div>
        ) : (
          <div
            style={{
              marginTop: '14px',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              fontWeight: 600,
            }}
          >
            {settlements.length} simple {settlements.length === 1 ? 'transaction' : 'transactions'} needed to settle all group debts.
          </div>
        )}
      </div>

      {/* Simplified Transactions List (Spec 7) */}
      <div>
        <div className="section-header">
          <h3 className="section-title">
            <Sparkles size={16} color="var(--accent-primary)" />
            <span>Suggested Settlements ({settlements.length})</span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Tap to record payment
          </span>
        </div>

        {settlements.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Zero pending debts! 🎉</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {settlements.map((tx, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-glow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.96rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--danger)' }}>{tx.fromName}</span>
                      <ArrowRight size={15} color="var(--text-muted)" />
                      <span style={{ color: 'var(--success)' }}>{tx.toName}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {tx.fromName} pays {tx.toName}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {settings.currency}{tx.amount.toLocaleString()}
                  </div>

                  <button
                    className="btn-primary"
                    style={{ padding: '8px 12px', fontSize: '0.78rem', width: 'auto' }}
                    onClick={() => handleSettleClick(tx)}
                    title="Mark this debt as settled"
                  >
                    <CheckCircle2 size={14} />
                    <span>Settle</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Net Balance Breakdown (Who Should Receive & Who Should Pay) */}
      <div>
        <div className="section-header">
          <h3 className="section-title">
            <span>Members Net Status</span>
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Should Receive */}
          <div className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={14} />
              <span>SHOULD RECEIVE</span>
            </div>

            {creditors.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {creditors.map(c => (
                  <div key={c.member.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                    <span style={{ fontWeight: 600 }}>{c.member.name}</span>
                    <strong style={{ color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
                      +{settings.currency}{c.netBalance.toFixed(0)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Should Pay */}
          <div className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownRight size={14} />
              <span>SHOULD PAY</span>
            </div>

            {debtors.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {debtors.map(d => (
                  <div key={d.member.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                    <span style={{ fontWeight: 600 }}>{d.member.name}</span>
                    <strong style={{ color: 'var(--danger)', fontFamily: 'var(--font-heading)' }}>
                      -{settings.currency}{Math.abs(d.netBalance).toFixed(0)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
