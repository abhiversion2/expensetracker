import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_MEMBERS,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  SAMPLE_EXPENSES,
} from '../utils/defaultData';
import {
  loadFromStorage,
  saveToStorage,
  STORAGE_KEYS,
  clearAllStorage,
} from '../utils/storage';
import {
  calculateMemberBalances,
  calculateOptimalSettlements,
  calculateWeeklySummary,
  calculateMonthlySummary,
  getMemberPersonalLedger,
} from '../utils/calculations';
import { getWeekBounds, getCurrentDateTime } from '../utils/dateUtils';

const ExpenseContext = createContext(null);

export function ExpenseProvider({ children }) {
  // Members state
  const [members, setMembers] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.MEMBERS, DEFAULT_MEMBERS);
  });

  // Expenses state: start with SAMPLE_EXPENSES if fresh so the app is instantly rich and demonstrative
  const [expenses, setExpenses] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.EXPENSES, SAMPLE_EXPENSES);
  });

  // Categories state
  const [categories, setCategories] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  });

  // Settings state
  const [settings, setSettings] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  });

  // Navigation & Active Member
  const [currentView, setCurrentView] = useState('home'); // 'home', 'expenses', 'personal', 'weekly', 'more', 'settlement', 'monthly', 'members', 'settings'
  const [activeMemberId, setActiveMemberId] = useState(() => {
    return members[0]?.id || 'm_prabhat';
  });

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpenseDetails, setSelectedExpenseDetails] = useState(null);
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm, confirmText, isDanger }

  // Toast notification state
  const [toast, setToast] = useState(null); // { text, type: 'success' | 'info' | 'warning' | 'error' }

  // Search and filter for expenses
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMember, setFilterMember] = useState('all');

  // Sync to LocalStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MEMBERS, members);
  }, [members]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EXPENSES, expenses);
  }, [expenses]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
    // Apply theme
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings]);

  // Show toast helper
  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Ensure active member is valid
  useEffect(() => {
    if (members.length > 0 && !members.some(m => m.id === activeMemberId)) {
      setActiveMemberId(members[0].id);
    }
  }, [members, activeMemberId]);

  // Member actions
  const addMember = (name, avatarColor) => {
    if (!name || !name.trim()) {
      showToast('Member name cannot be empty', 'error');
      return false;
    }
    const trimmed = name.trim();
    if (members.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast('A friend with this name already exists', 'warning');
      return false;
    }

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#14b8a6'];
    const chosenColor = avatarColor || colors[members.length % colors.length];
    const initials = trimmed
      .split(' ')
      .map(w => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newMember = {
      id: `m_${Date.now()}`,
      name: trimmed,
      avatarColor: chosenColor,
      initials: initials || trimmed.substring(0, 2).toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    setMembers(prev => [...prev, newMember]);
    showToast(`Added ${trimmed} to group`, 'success');
    return true;
  };

  const updateMember = (id, newName) => {
    if (!newName || !newName.trim()) {
      showToast('Name cannot be empty', 'error');
      return false;
    }
    const trimmed = newName.trim();
    setMembers(prev =>
      prev.map(m => (m.id === id ? { ...m, name: trimmed, initials: trimmed.substring(0, 2).toUpperCase() } : m))
    );
    showToast('Member updated', 'success');
    return true;
  };

  const removeMember = (id) => {
    const member = members.find(m => m.id === id);
    if (!member) return;

    // Check if member is involved in any expenses
    const hasExpenses = expenses.some(
      e => e.paidBy === id || e.participants?.some(p => p.memberId === id)
    );

    if (hasExpenses) {
      showToast(`Cannot remove ${member.name} because they have recorded expenses.`, 'error');
      return false;
    }

    if (members.length <= 2) {
      showToast('Group must have at least 2 members.', 'warning');
      return false;
    }

    setMembers(prev => prev.filter(m => m.id !== id));
    showToast(`Removed ${member.name}`, 'info');
    return true;
  };

  // Expense Actions
  const addExpense = (expenseData) => {
    const newId = `exp_${Date.now()}`;
    const newExpense = {
      ...expenseData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setExpenses(prev => [newExpense, ...prev]);
    showToast(`Added "${newExpense.description}" (₹${newExpense.amount})`, 'success');
    return true;
  };

  const updateExpense = (id, updatedFields) => {
    setExpenses(prev =>
      prev.map(e => (e.id === id ? { ...e, ...updatedFields } : e))
    );
    showToast('Expense updated successfully', 'success');
    return true;
  };

  const deleteExpense = (id) => {
    const target = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast(`Deleted "${target?.description || 'Expense'}"`, 'info');
    if (selectedExpenseDetails?.id === id) {
      setSelectedExpenseDetails(null);
    }
  };

  // Record a settlement payment directly
  const recordSettlement = (fromMemberId, toMemberId, amount) => {
    const fromMember = members.find(m => m.id === fromMemberId);
    const toMember = members.find(m => m.id === toMemberId);
    if (!fromMember || !toMember || amount <= 0) return false;

    const { date, time } = getCurrentDateTime();
    const settlementExpense = {
      id: `settle_${Date.now()}`,
      description: `Settlement: ${fromMember.name} ➔ ${toMember.name}`,
      amount: Number(amount),
      paidBy: fromMemberId,
      date,
      time,
      category: 'Bills & Utilities',
      notes: `Settlement payment from ${fromMember.name} to ${toMember.name}`,
      participants: [
        { memberId: toMemberId, share: Number(amount) }
      ],
      splitType: 'settlement',
      createdAt: new Date().toISOString(),
    };

    setExpenses(prev => [settlementExpense, ...prev]);
    showToast(`Settled ₹${amount}: ${fromMember.name} paid ${toMember.name}`, 'success');
    return true;
  };

  // Settings
  const updateSettings = (partial) => {
    setSettings(prev => ({ ...prev, ...partial }));
    showToast('Settings saved', 'success');
  };

  // Custom Category
  const addCategory = (name, icon = 'Tag', color = '#64748b') => {
    if (!name || !name.trim()) return false;
    const newCat = {
      id: `cat_${Date.now()}`,
      name: name.trim(),
      icon,
      color,
    };
    setCategories(prev => [...prev, newCat]);
    showToast(`Created category "${name}"`, 'success');
    return true;
  };

  // Load sample demo data
  const loadSampleData = () => {
    setMembers(DEFAULT_MEMBERS);
    setExpenses(SAMPLE_EXPENSES);
    showToast('Sample group data loaded!', 'success');
  };

  // Reset all data to clean default members
  const resetAllData = () => {
    clearAllStorage();
    setMembers(DEFAULT_MEMBERS);
    setExpenses([]);
    setCategories(DEFAULT_CATEGORIES);
    setSettings(DEFAULT_SETTINGS);
    showToast('App reset to clean state', 'info');
  };

  // Calculations
  const balances = useMemo(() => {
    return calculateMemberBalances(members, expenses);
  }, [members, expenses]);

  const settlements = useMemo(() => {
    return calculateOptimalSettlements(members, expenses);
  }, [members, expenses]);

  const currentWeekBounds = useMemo(() => {
    return getWeekBounds(new Date(), settings.weekStartDay);
  }, [settings.weekStartDay]);

  const currentWeeklySummary = useMemo(() => {
    return calculateWeeklySummary(
      members,
      expenses,
      currentWeekBounds,
      settings.lowestSpenderCriteria
    );
  }, [members, expenses, currentWeekBounds, settings.lowestSpenderCriteria]);

  const totalGroupSpending = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  return (
    <ExpenseContext.Provider
      value={{
        members,
        expenses,
        categories,
        settings,
        currentView,
        setCurrentView,
        activeMemberId,
        setActiveMemberId,
        balances,
        settlements,
        currentWeekBounds,
        currentWeeklySummary,
        totalGroupSpending,
        // Actions
        addMember,
        updateMember,
        removeMember,
        addExpense,
        updateExpense,
        deleteExpense,
        recordSettlement,
        updateSettings,
        addCategory,
        loadSampleData,
        resetAllData,
        showToast,
        // Modals & UI helpers
        isAddExpenseOpen,
        setIsAddExpenseOpen,
        editingExpense,
        setEditingExpense,
        selectedExpenseDetails,
        setSelectedExpenseDetails,
        isCelebrationModalOpen,
        setIsCelebrationModalOpen,
        confirmDialog,
        setConfirmDialog,
        toast,
        // Filters
        searchQuery,
        setSearchQuery,
        filterCategory,
        setFilterCategory,
        filterMember,
        setFilterMember,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
