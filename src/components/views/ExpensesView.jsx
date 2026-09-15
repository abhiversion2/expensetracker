import React, { useState, useMemo } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import ExpenseCard from '../subcomponents/ExpenseCard';
import { exportGroupExpensesCsv } from '../../utils/exportUtils';
import {
  Search,
  Filter,
  Download,
  Plus,
  X,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

export default function ExpensesView() {
  const {
    expenses,
    members,
    categories,
    settings,
    setIsAddExpenseOpen,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterMember,
    setFilterMember,
  } = useExpenses();

  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const memberMap = new Map(members.map(m => [m.id, m]));

  // Filter & Search logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // 1. Search Query (description or payer name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const descMatch = exp.description.toLowerCase().includes(query);
        const payerName = memberMap.get(exp.paidBy)?.name.toLowerCase() || '';
        const payerMatch = payerName.includes(query);
        const participantMatch = exp.participants?.some(p => {
          const pName = memberMap.get(p.memberId)?.name.toLowerCase() || '';
          return pName.includes(query);
        });

        if (!descMatch && !payerMatch && !participantMatch) return false;
      }

      // 2. Category Filter
      if (filterCategory !== 'all' && exp.category !== filterCategory) {
        return false;
      }

      // 3. Member Filter (paid by or participant)
      if (filterMember !== 'all') {
        const isPayer = exp.paidBy === filterMember;
        const isParticipant = exp.participants?.some(p => p.memberId === filterMember);
        if (!isPayer && !isParticipant) return false;
      }

      // 4. Amount Range
      const amt = Number(exp.amount) || 0;
      if (minAmount && amt < parseFloat(minAmount)) return false;
      if (maxAmount && amt > parseFloat(maxAmount)) return false;

      // 5. Date Range
      if (startDate && exp.date < startDate) return false;
      if (endDate && exp.date > endDate) return false;

      return true;
    });
  }, [expenses, searchQuery, filterCategory, filterMember, minAmount, maxAmount, startDate, endDate, memberMap]);

  // Total of filtered expenses
  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const handleExportCsv = () => {
    exportGroupExpensesCsv(filteredExpenses, members, settings.groupName);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterMember('all');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
  };

  const activeFilterCount =
    (filterCategory !== 'all' ? 1 : 0) +
    (filterMember !== 'all' ? 1 : 0) +
    (minAmount || maxAmount ? 1 : 0) +
    (startDate || endDate ? 1 : 0);

  return (
    <div className="main-content animate-fade-in">
      {/* Search Bar & Actions */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search by description, friend..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '42px', fontSize: '0.9rem' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                color: 'var(--text-muted)',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className="icon-btn"
          style={{
            height: '42px',
            width: '42px',
            background: activeFilterCount > 0 ? 'var(--accent-primary)' : 'var(--bg-input)',
            color: activeFilterCount > 0 ? '#fff' : 'var(--text-secondary)',
            position: 'relative',
          }}
          onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          title="Filters"
        >
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'var(--danger)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          className="icon-btn"
          style={{ height: '42px', width: '42px' }}
          onClick={handleExportCsv}
          title="Export CSV"
        >
          <Download size={18} />
        </button>
      </div>

      {/* Category Pills Quick Filter */}
      <div className="chips-scroll">
        <button
          className={`chip ${filterCategory === 'all' ? 'active' : ''}`}
          onClick={() => setFilterCategory('all')}
        >
          All Categories
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`chip ${filterCategory === cat.name ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat.name)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Expanded Filter Drawer */}
      {showFilterDrawer && (
        <div className="card animate-slide-up" style={{ padding: '16px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Filter Expenses</h4>
            <button
              onClick={clearAllFilters}
              style={{ background: 'transparent', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 600 }}
            >
              Reset Filters
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div className="form-group">
              <label className="form-label">Member Involved</label>
              <select
                value={filterMember}
                onChange={e => setFilterMember(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '8px 10px' }}
              >
                <option value="all">Any Friend</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '8px 10px' }}
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount and Date range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div className="form-group">
              <label className="form-label">Min Amount ({settings.currency})</label>
              <input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={e => setMinAmount(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '8px 10px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Amount ({settings.currency})</label>
              <input
                type="number"
                placeholder="No max"
                value={maxAmount}
                onChange={e => setMaxAmount(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '8px 10px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '8px 10px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '8px 10px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary count header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        <span>
          Showing <strong>{filteredExpenses.length}</strong> of {expenses.length} expenses
        </span>
        <span>
          Total: <strong style={{ color: 'var(--text-primary)' }}>{settings.currency}{Number(filteredTotal).toLocaleString()}</strong>
        </span>
      </div>

      {/* Expenses Chronological List */}
      {filteredExpenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔍</div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>No expenses found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Try clearing your search query or filters.
          </p>
          <button className="btn-secondary" onClick={clearAllFilters} style={{ margin: '0 auto' }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredExpenses.map(exp => (
            <ExpenseCard key={exp.id} expense={exp} />
          ))}
        </div>
      )}
    </div>
  );
}
