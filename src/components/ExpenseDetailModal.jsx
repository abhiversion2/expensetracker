import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { formatDateTimeFriendly } from '../utils/dateUtils';
import { X, Edit3, Trash2, Calendar, UserCheck, Users, Tag, FileText } from 'lucide-react';

export default function ExpenseDetailModal() {
  const {
    selectedExpenseDetails,
    setSelectedExpenseDetails,
    setEditingExpense,
    setIsAddExpenseOpen,
    setConfirmDialog,
    deleteExpense,
    members,
    settings,
  } = useExpenses();

  if (!selectedExpenseDetails) return null;

  const exp = selectedExpenseDetails;
  const memberMap = new Map(members.map(m => [m.id, m]));
  const payer = memberMap.get(exp.paidBy);

  const handleEdit = () => {
    setSelectedExpenseDetails(null);
    setEditingExpense(exp);
    setIsAddExpenseOpen(true);
  };

  const handleDeletePrompt = () => {
    setConfirmDialog({
      title: 'Delete Expense?',
      message: `Are you sure you want to delete "${exp.description}" (₹${exp.amount})? This will automatically update everyone's balances and weekly summaries.`,
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        deleteExpense(exp.id);
        setSelectedExpenseDetails(null);
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={() => setSelectedExpenseDetails(null)}>
      <div
        className="modal-content animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '460px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary">{exp.category || 'Expense'}</span>
          </div>
          <button
            className="icon-btn"
            onClick={() => setSelectedExpenseDetails(null)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Header Amount & Title */}
          <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
              {exp.description}
            </h2>
            <div
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                color: 'var(--accent-primary)',
                letterSpacing: '-0.03em',
              }}
            >
              {settings.currency || '₹'}{Number(exp.amount).toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '4px',
              }}
            >
              <Calendar size={13} />
              <span>{formatDateTimeFriendly(exp.date, exp.time)}</span>
            </div>
          </div>

          {/* Paid By Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="avatar avatar-sm"
                style={{ backgroundColor: payer?.avatarColor || '#6366f1' }}
              >
                {payer?.initials || 'P'}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Paid in full by</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{payer?.name || 'Unknown'}</div>
              </div>
            </div>
            <span className="badge badge-success">Paid Entirely</span>
          </div>

          {/* Participants Breakdown */}
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Users size={14} />
              <span>Split Between ({exp.participants?.length || 0} friends)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(exp.participants || []).map(p => {
                const member = memberMap.get(p.memberId);
                const isPayer = p.memberId === exp.paidBy;

                return (
                  <div
                    key={p.memberId}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        className="avatar avatar-sm"
                        style={{ backgroundColor: member?.avatarColor || '#6366f1' }}
                      >
                        {member?.initials || 'M'}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {member?.name || 'Member'}
                        {isPayer && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', marginLeft: '6px' }}>
                            (Paid)
                          </span>
                        )}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {settings.currency || '₹'}{Number(p.share).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Notes */}
          {exp.notes && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <FileText size={15} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{exp.notes}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={handleEdit}
          >
            <Edit3 size={16} />
            <span>Edit</span>
          </button>
          <button
            className="btn-danger"
            style={{ flex: 1 }}
            onClick={handleDeletePrompt}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
