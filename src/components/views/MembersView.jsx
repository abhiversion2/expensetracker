import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  X,
  UserCheck,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function MembersView() {
  const {
    members,
    addMember,
    updateMember,
    removeMember,
    balances,
    settings,
    setActiveMemberId,
    setCurrentView,
    setConfirmDialog,
  } = useExpenses();

  const [isAdding, setIsAdding] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (addMember(newMemberName)) {
      setNewMemberName('');
      setIsAdding(false);
    }
  };

  const handleStartEdit = (member) => {
    setEditingMemberId(member.id);
    setEditNameValue(member.name);
  };

  const handleSaveEdit = (id) => {
    if (updateMember(id, editNameValue)) {
      setEditingMemberId(null);
    }
  };

  const handlePromptDelete = (member) => {
    setConfirmDialog({
      title: `Remove ${member.name}?`,
      message: `Are you sure you want to remove ${member.name} from the group? Members with recorded transactions cannot be removed.`,
      confirmText: 'Remove',
      isDanger: true,
      onConfirm: () => {
        removeMember(member.id);
      },
    });
  };

  const handleOpenProfile = (memberId) => {
    setActiveMemberId(memberId);
    setCurrentView('personal');
  };

  return (
    <div className="main-content animate-fade-in">
      {/* Header card */}
      <div className="card card-gradient-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className="badge badge-primary">Group Friends</span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
              {members.length} Active Members
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Add, rename or inspect individual spending profiles
            </p>
          </div>

          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '10px 14px' }}
            onClick={() => setIsAdding(!isAdding)}
          >
            <UserPlus size={16} />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Inline Add Member Form */}
        {isAdding && (
          <form
            onSubmit={handleAddSubmit}
            className="animate-slide-up"
            style={{
              marginTop: '14px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              placeholder="Friend's Name..."
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              autoFocus
              required
              style={{ flex: 1, padding: '10px 12px', fontSize: '0.9rem' }}
            />
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 14px' }}>
              <Check size={16} />
              <span>Save</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: 'auto', padding: '10px 12px' }}
              onClick={() => setIsAdding(false)}
            >
              <X size={16} />
            </button>
          </form>
        )}
      </div>

      {/* Members List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {members.map(member => {
          const b = balances[member.id] || { totalPaid: 0, personalShare: 0, netBalance: 0, paidExpenseCount: 0 };
          const isEditing = editingMemberId === member.id;

          return (
            <div
              key={member.id}
              className="card"
              style={{
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div
                    className="avatar avatar-md"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.initials}
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '10px' }}>
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                        autoFocus
                      />
                      <button
                        className="btn-primary"
                        style={{ width: 'auto', padding: '6px 10px' }}
                        onClick={() => handleSaveEdit(member.id)}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ width: 'auto', padding: '6px 10px' }}
                        onClick={() => setEditingMemberId(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{member.name}</span>
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {b.paidExpenseCount} expenses paid • Share: {settings.currency}{b.personalShare.toFixed(0)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      className="icon-btn"
                      onClick={() => handleStartEdit(member)}
                      title="Edit Name"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => handlePromptDelete(member)}
                      title="Remove Friend"
                    >
                      <Trash2 size={15} color="var(--danger)" />
                    </button>
                  </div>
                )}
              </div>

              {/* Balance Summary & Profile Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Paid: </span>
                  <strong>{settings.currency}{b.totalPaid.toLocaleString()}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      color: b.netBalance > 0 ? 'var(--success)' : b.netBalance < 0 ? 'var(--danger)' : 'var(--text-muted)',
                    }}
                  >
                    {b.netBalance > 0
                      ? `+${settings.currency}${b.netBalance.toFixed(0)}`
                      : b.netBalance < 0
                      ? `-${settings.currency}${Math.abs(b.netBalance).toFixed(0)}`
                      : 'Settled'}
                  </span>

                  <button
                    onClick={() => handleOpenProfile(member.id)}
                    style={{
                      background: 'transparent',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <span>View Profile</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
