import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { calculateEqualShares } from '../utils/calculations';
import { getCurrentDateTime } from '../utils/dateUtils';
import { X, Check, CheckSquare, Square, Tag, Calendar, Clock, DollarSign, UserCheck, Sparkles } from 'lucide-react';

const COMMON_DESCRIPTIONS = [
  'Dinner',
  'Petrol',
  'Movie tickets',
  'Hotel',
  'Trip expenses',
  'Tea & Chai',
  'Snacks',
  'Groceries',
  'Zomato / Swiggy',
  'Uber / Ola',
];

export default function AddExpenseModal() {
  const {
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    editingExpense,
    setEditingExpense,
    members,
    categories,
    settings,
    addExpense,
    updateExpense,
    showToast,
  } = useExpenses();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wasOpenRef = React.useRef(false);

  // Initialize form state ONLY when opening the modal or editing a different expense
  useEffect(() => {
    if (isAddExpenseOpen && !wasOpenRef.current) {
      if (editingExpense) {
        setAmount(String(editingExpense.amount));
        setDescription(editingExpense.description);
        setPaidBy(editingExpense.paidBy);
        setSelectedParticipants(
          editingExpense.participants?.map(p => p.memberId) || members.map(m => m.id)
        );
        setCategory(editingExpense.category || categories[0]?.name || 'Food & Dining');
        setDate(editingExpense.date || getCurrentDateTime().date);
        setTime(editingExpense.time || getCurrentDateTime().time);
        setNotes(editingExpense.notes || '');
      } else {
        const { date: curDate, time: curTime } = getCurrentDateTime();
        setAmount('');
        setDescription('');
        setPaidBy(members[0]?.id || '');
        setSelectedParticipants(members.map(m => m.id)); // Default split equally among all
        setCategory(categories[0]?.name || 'Food & Dining');
        setDate(curDate);
        setTime(curTime);
        setNotes('');
      }
    }
    wasOpenRef.current = isAddExpenseOpen;
  }, [isAddExpenseOpen, editingExpense]);

  // Set default payer if not yet assigned
  useEffect(() => {
    if (isAddExpenseOpen && !paidBy && members.length > 0) {
      setPaidBy(members[0].id);
      if (selectedParticipants.length === 0) {
        setSelectedParticipants(members.map(m => m.id));
      }
    }
  }, [isAddExpenseOpen, members, paidBy, selectedParticipants.length]);

  if (!isAddExpenseOpen) return null;

  // Toggle single participant
  const toggleParticipant = (memberId) => {
    setSelectedParticipants(prev => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) {
          showToast('At least one friend must participate in the expense.', 'warning');
          return prev;
        }
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  // Select/Deselect all
  const selectAllParticipants = () => {
    setSelectedParticipants(members.map(m => m.id));
  };

  const deselectAllParticipants = () => {
    // Keep only the payer selected if possible
    if (paidBy) {
      setSelectedParticipants([paidBy]);
    } else if (members.length > 0) {
      setSelectedParticipants([members[0].id]);
    }
  };

  // Calculate live preview share
  const numAmount = parseFloat(amount) || 0;
  const numParticipants = selectedParticipants.length;
  const liveShare = numParticipants > 0 ? (numAmount / numParticipants).toFixed(2) : '0.00';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount greater than zero.', 'error');
      return;
    }

    if (!description || !description.trim()) {
      showToast('Please enter what the expense was for.', 'error');
      return;
    }

    if (!paidBy) {
      showToast('Please select who paid for this expense.', 'error');
      return;
    }

    if (selectedParticipants.length === 0) {
      showToast('Please select at least one participant to split with.', 'error');
      return;
    }

    setIsSubmitting(true);

    // Calculate exact equal shares
    const participantsWithShares = calculateEqualShares(parsedAmount, selectedParticipants);

    const expensePayload = {
      description: description.trim(),
      amount: parsedAmount,
      paidBy,
      date: date || getCurrentDateTime().date,
      time: time || getCurrentDateTime().time,
      category: category || 'Other',
      notes: notes.trim(),
      participants: participantsWithShares,
      splitType: 'equal',
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, expensePayload);
    } else {
      addExpense(expensePayload);
    }

    setIsSubmitting(false);
    setEditingExpense(null);
    setIsAddExpenseOpen(false);
  };

  const handleClose = () => {
    setEditingExpense(null);
    setIsAddExpenseOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '92vh' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>{editingExpense ? '✏️' : '⚡'}</span>
            <h2 className="modal-title">
              {editingExpense ? 'Edit Expense' : 'Add Group Expense'}
            </h2>
          </div>
          <button
            className="icon-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Amount Field */}
            <div className="form-group">
              <label className="form-label">
                <DollarSign size={14} />
                <span>Amount Spent</span>
              </label>
              <div className="amount-input-wrapper">
                <span className="amount-currency">{settings.currency || '₹'}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="0.00"
                  className="amount-input"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="chips-scroll" style={{ marginTop: '6px' }}>
                {[100, 250, 500, 1000, 1500, 2000].map(val => (
                  <button
                    key={val}
                    type="button"
                    className="chip"
                    onClick={() => setAmount(String((parseFloat(amount) || 0) + val))}
                  >
                    +{settings.currency}{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Field */}
            <div className="form-group">
              <label className="form-label">
                <span>What was this spent on?</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Dinner, Petrol, Movie tickets..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />

              {/* Quick description suggestions */}
              <div className="chips-scroll" style={{ marginTop: '6px' }}>
                {COMMON_DESCRIPTIONS.map(desc => (
                  <button
                    key={desc}
                    type="button"
                    className={`chip ${description.toLowerCase() === desc.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setDescription(desc)}
                  >
                    {desc}
                  </button>
                ))}
              </div>
            </div>

            {/* Paid By Selector */}
            <div className="form-group">
              <label className="form-label">
                <UserCheck size={14} />
                <span>Paid By</span>
              </label>
              <select
                value={paidBy}
                onChange={e => setPaidBy(e.target.value)}
                required
                style={{ fontWeight: 600 }}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} (Paid by)
                  </option>
                ))}
              </select>
            </div>

            {/* Split Between Checklist */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  <span>Split Between ({selectedParticipants.length} people)</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={selectAllParticipants}
                    style={{ background: 'transparent', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <span style={{ color: 'var(--border-color)' }}>•</span>
                  <button
                    type="button"
                    onClick={deselectAllParticipants}
                    style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Live share preview alert */}
              {numAmount > 0 && numParticipants > 0 && (
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    {settings.currency}{numAmount} ÷ {numParticipants} people
                  </span>
                  <strong>
                    = {settings.currency}{liveShare} / person
                  </strong>
                </div>
              )}

              <div className="participant-list">
                {members.map(member => {
                  const isChecked = selectedParticipants.includes(member.id);
                  return (
                    <div
                      key={member.id}
                      className={`participant-item ${isChecked ? 'selected' : ''}`}
                      onClick={() => toggleParticipant(member.id)}
                    >
                      <div className="participant-left">
                        <div
                          className="avatar avatar-sm"
                          style={{ backgroundColor: member.avatarColor }}
                        >
                          {member.initials}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {member.name}
                          {member.id === paidBy && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginLeft: '6px' }}>
                              (Payer)
                            </span>
                          )}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isChecked && numAmount > 0 && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {settings.currency}{liveShare}
                          </span>
                        )}
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            border: `2px solid ${isChecked ? 'var(--accent-primary)' : 'var(--text-muted)'}`,
                            background: isChecked ? 'var(--accent-primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isChecked && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Selector */}
            <div className="form-group">
              <label className="form-label">
                <Tag size={14} />
                <span>Category</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={14} />
                  <span>Time</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* Optional Notes */}
            <div className="form-group">
              <label className="form-label">
                <span>Notes (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Any special remarks or details"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2 }}
              disabled={isSubmitting}
            >
              <Check size={18} />
              <span>{editingExpense ? 'Update Expense' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
