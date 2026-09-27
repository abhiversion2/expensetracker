import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  getSupabaseClient,
  getSupabaseCredentials,
  getActiveGroupId,
  setActiveGroupId,
  fetchRemoteGroupData,
  seedGroupToSupabase,
  syncExpenseToSupabase,
  deleteExpenseFromSupabase,
  syncMemberToSupabase,
  deleteMemberFromSupabase,
  syncGroupSettingsToSupabase,
  testSupabaseConnection,
} from '../utils/supabase';

const ExpenseContext = createContext(null);

export function ExpenseProvider({ children }) {
  // Group ID & Cloud Sync state
  const [groupId, setGroupIdState] = useState(() => getActiveGroupId());
  const [cloudStatus, setCloudStatus] = useState('offline'); // 'offline' | 'connecting' | 'connected' | 'error'
  const [cloudLastSynced, setCloudLastSynced] = useState(null);

  // Members state
  const [members, setMembers] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.MEMBERS, DEFAULT_MEMBERS);
  });

  // Expenses state: empty by default, automatically purging past sample data
  const [expenses, setExpenses] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.EXPENSES, []);
    const sampleIds = new Set(['exp_1', 'exp_2', 'exp_3', 'exp_4', 'exp_5', 'exp_6']);
    return (stored || []).filter(e => !sampleIds.has(e.id));
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
  const [currentView, setCurrentView] = useState('home');
  const [activeMemberId, setActiveMemberId] = useState(() => {
    return members[0]?.id || 'm_prabhat';
  });

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpenseDetails, setSelectedExpenseDetails] = useState(null);
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Search and filter for expenses
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMember, setFilterMember] = useState('all');

  // Show toast helper
  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  // Sync to LocalStorage (Offline Cache)
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
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings]);

  // Ensure active member is valid
  useEffect(() => {
    if (members.length > 0 && !members.some(m => m.id === activeMemberId)) {
      setActiveMemberId(members[0].id);
    }
  }, [members, activeMemberId]);

  // ----------------- Supabase Live Realtime Sync -----------------
  const refreshCloudData = useCallback(async () => {
    const creds = getSupabaseCredentials();
    if (!creds.isConfigured) {
      setCloudStatus('offline');
      return;
    }

    try {
      setCloudStatus('connecting');
      const remoteData = await fetchRemoteGroupData(groupId);
      if (remoteData && remoteData.group) {
        if (remoteData.members && remoteData.members.length > 0) {
          setMembers(prev => {
            const hasChanged =
              prev.length !== remoteData.members.length ||
              prev.some((m, i) => m.id !== remoteData.members[i]?.id || m.name !== remoteData.members[i]?.name);
            return hasChanged ? remoteData.members : prev;
          });
        }
        if (remoteData.expenses !== null && remoteData.expenses !== undefined) {
          const sampleIds = new Set(['exp_1', 'exp_2', 'exp_3', 'exp_4', 'exp_5', 'exp_6']);
          const clean = remoteData.expenses.filter(e => !sampleIds.has(e.id));
          setExpenses(prev => {
            if (prev.length !== clean.length) return clean;
            const hasChanged = prev.some(
              (e, i) =>
                e.id !== clean[i]?.id ||
                e.amount !== clean[i]?.amount ||
                e.description !== clean[i]?.description
            );
            return hasChanged ? clean : prev;
          });
        }
        if (remoteData.group?.settings) {
          setSettings(prev => ({
            ...prev,
            ...remoteData.group.settings,
            groupName: remoteData.group.name || prev.groupName,
            currency: remoteData.group.currency || prev.currency,
          }));
        }
      } else if (remoteData) {
        await seedGroupToSupabase(groupId, { settings, members, expenses });
      }
      setCloudStatus('connected');
      setCloudLastSynced(new Date());
    } catch (err) {
      console.error('Error refreshing cloud data:', err);
      setCloudStatus('error');
    }
  }, [groupId, members, expenses, settings]);

  useEffect(() => {
    const creds = getSupabaseCredentials();
    if (!creds.isConfigured) {
      setCloudStatus('offline');
      return;
    }

    let isMounted = true;
    const client = getSupabaseClient();
    if (!client) {
      setCloudStatus('offline');
      return;
    }

    setCloudStatus('connecting');

    async function initCloud() {
      try {
        const remoteData = await fetchRemoteGroupData(groupId);
        if (!isMounted) return;

        // Clean out any lingering sample data from Supabase
        client.from('expenses').delete().in('id', ['exp_1', 'exp_2', 'exp_3', 'exp_4', 'exp_5', 'exp_6']).eq('group_id', groupId);

        if (remoteData && remoteData.group) {
          if (remoteData.members && remoteData.members.length > 0) {
            setMembers(prev => {
              const hasChanged =
                prev.length !== remoteData.members.length ||
                prev.some((m, i) => m.id !== remoteData.members[i]?.id || m.name !== remoteData.members[i]?.name);
              return hasChanged ? remoteData.members : prev;
            });
          }
          if (remoteData.expenses !== null && remoteData.expenses !== undefined) {
            const sampleIds = new Set(['exp_1', 'exp_2', 'exp_3', 'exp_4', 'exp_5', 'exp_6']);
            const clean = remoteData.expenses.filter(e => !sampleIds.has(e.id));
            setExpenses(prev => {
              if (prev.length !== clean.length) return clean;
              const hasChanged = prev.some(
                (e, i) =>
                  e.id !== clean[i]?.id ||
                  e.amount !== clean[i]?.amount ||
                  e.description !== clean[i]?.description
              );
              return hasChanged ? clean : prev;
            });
          }
          if (remoteData.group?.settings) {
            setSettings(prev => ({
              ...prev,
              ...remoteData.group.settings,
              groupName: remoteData.group.name || prev.groupName,
              currency: remoteData.group.currency || prev.currency,
            }));
          }
        } else if (remoteData) {
          // First time this group opened: seed current data to Supabase
          await seedGroupToSupabase(groupId, { settings, members, expenses: [] });
        }

        if (isMounted) {
          setCloudStatus('connected');
          setCloudLastSynced(new Date());
        }
      } catch (err) {
        console.error('Supabase initial fetch error:', err);
        if (isMounted) setCloudStatus('error');
      }
    }

    initCloud();

    // Subscribe to Realtime postgres changes without strict filter for maximum reliability
    const channel = client
      .channel(`sync_${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        payload => {
          const eventGroupId = payload.new?.group_id || payload.old?.group_id;
          if (eventGroupId && eventGroupId !== groupId) return;

          if (payload.eventType === 'INSERT') {
            const newExp = {
              id: payload.new.id,
              description: payload.new.description,
              amount: Number(payload.new.amount),
              paidBy: payload.new.paid_by,
              date: payload.new.date,
              time: payload.new.time || '',
              category: payload.new.category,
              notes: payload.new.notes || '',
              participants: payload.new.participants || [],
              splitType: payload.new.split_type || 'equal',
              createdAt: payload.new.created_at,
            };
            setExpenses(prev => {
              if (prev.some(e => e.id === newExp.id)) return prev;
              return [newExp, ...prev];
            });
            showToast(`🔔 Synced: Added "${newExp.description}" (₹${newExp.amount})`, 'info');
          } else if (payload.eventType === 'UPDATE') {
            const updatedExp = {
              id: payload.new.id,
              description: payload.new.description,
              amount: Number(payload.new.amount),
              paidBy: payload.new.paid_by,
              date: payload.new.date,
              time: payload.new.time || '',
              category: payload.new.category,
              notes: payload.new.notes || '',
              participants: payload.new.participants || [],
              splitType: payload.new.split_type || 'equal',
              createdAt: payload.new.created_at,
            };
            setExpenses(prev => prev.map(e => (e.id === updatedExp.id ? updatedExp : e)));
          } else if (payload.eventType === 'DELETE') {
            setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
          }
          setCloudLastSynced(new Date());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        payload => {
          const eventGroupId = payload.new?.group_id || payload.old?.group_id;
          if (eventGroupId && eventGroupId !== groupId) return;

          if (payload.eventType === 'INSERT') {
            const newMember = {
              id: payload.new.id,
              name: payload.new.name,
              avatarColor: payload.new.avatar_color,
              initials: payload.new.initials,
              createdAt: payload.new.created_at,
            };
            setMembers(prev => (prev.some(m => m.id === newMember.id) ? prev : [...prev, newMember]));
          } else if (payload.eventType === 'UPDATE') {
            setMembers(prev =>
              prev.map(m =>
                m.id === payload.new.id
                  ? {
                      ...m,
                      name: payload.new.name,
                      avatarColor: payload.new.avatar_color,
                      initials: payload.new.initials,
                    }
                  : m
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMembers(prev => prev.filter(m => m.id !== payload.old.id));
          }
          setCloudLastSynced(new Date());
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'groups' },
        payload => {
          if (payload.new?.id && payload.new.id !== groupId) return;
          if (payload.new?.settings) {
            setSettings(prev => ({
              ...prev,
              ...payload.new.settings,
              groupName: payload.new.name || prev.groupName,
              currency: payload.new.currency || prev.currency,
            }));
          }
          setCloudLastSynced(new Date());
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setCloudStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[Supabase Realtime] Channel error:', err);
        }
      });

    return () => {
      isMounted = false;
      client.removeChannel(channel);
    };
  }, [groupId, showToast]);

  // Automatic polling heartbeat & visibility synchronization
  useEffect(() => {
    const creds = getSupabaseCredentials();
    if (!creds.isConfigured) return;

    // Refresh every 3.5 seconds when tab is open for guaranteed always-on sync
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshCloudData();
      }
    }, 3500);

    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshCloudData();
      }
    };

    window.addEventListener('focus', onVisible);
    window.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    window.addEventListener('online', onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, [refreshCloudData]);

  const changeGroupId = (newId) => {
    const clean = setActiveGroupId(newId);
    setGroupIdState(clean);
    showToast(`Switched to group: ${clean}`, 'info');
  };

  // ----------------- Member Actions -----------------
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
    syncMemberToSupabase(groupId, newMember);
    showToast(`Added ${trimmed} to group`, 'success');
    return true;
  };

  const updateMember = (id, newName) => {
    if (!newName || !newName.trim()) {
      showToast('Name cannot be empty', 'error');
      return false;
    }
    const trimmed = newName.trim();
    const updatedMember = members.find(m => m.id === id);
    if (updatedMember) {
      const merged = { ...updatedMember, name: trimmed, initials: trimmed.substring(0, 2).toUpperCase() };
      setMembers(prev => prev.map(m => (m.id === id ? merged : m)));
      syncMemberToSupabase(groupId, merged);
    }
    showToast('Member updated', 'success');
    return true;
  };

  const removeMember = (id) => {
    const member = members.find(m => m.id === id);
    if (!member) return;

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
    deleteMemberFromSupabase(id);
    showToast(`Removed ${member.name}`, 'info');
    return true;
  };

  // ----------------- Expense Actions -----------------
  const addExpense = async (expenseData) => {
    const newId = `exp_${Date.now()}`;
    const newExpense = {
      ...expenseData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setExpenses(prev => [newExpense, ...prev]);
    showToast(`Added "${newExpense.description}" (₹${newExpense.amount})`, 'success');

    const res = await syncExpenseToSupabase(groupId, newExpense);
    if (res && res.error) {
      showToast(`⚠️ Cloud sync failed: ${res.error.message || 'Check database tables in Supabase'}`, 'error');
    }
    return true;
  };

  const updateExpense = async (id, updatedFields) => {
    let target = null;
    setExpenses(prev =>
      prev.map(e => {
        if (e.id === id) {
          target = { ...e, ...updatedFields };
          return target;
        }
        return e;
      })
    );
    showToast('Expense updated successfully', 'success');
    if (target) {
      const res = await syncExpenseToSupabase(groupId, target);
      if (res && res.error) {
        showToast(`⚠️ Cloud update failed: ${res.error.message}`, 'error');
      }
    }
    return true;
  };

  const deleteExpense = async (id) => {
    const target = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast(`Deleted "${target?.description || 'Expense'}"`, 'info');
    if (selectedExpenseDetails?.id === id) {
      setSelectedExpenseDetails(null);
    }
    const res = await deleteExpenseFromSupabase(id);
    if (res && res.error) {
      showToast(`⚠️ Cloud delete failed: ${res.error.message}`, 'error');
    }
  };

  // Record a settlement payment directly
  const recordSettlement = async (fromMemberId, toMemberId, amount) => {
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
    const res = await syncExpenseToSupabase(groupId, settlementExpense);
    if (res && res.error) {
      showToast(`⚠️ Cloud settlement failed: ${res.error.message}`, 'error');
    }
    return true;
  };

  // Settings
  const updateSettings = (partial) => {
    setSettings(prev => {
      const merged = { ...prev, ...partial };
      syncGroupSettingsToSupabase(groupId, merged);
      return merged;
    });
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
    seedGroupToSupabase(groupId, { settings, members: DEFAULT_MEMBERS, expenses: SAMPLE_EXPENSES });
    showToast('Sample group data loaded!', 'success');
  };

  // Reset all data to clean default members
  const resetAllData = async () => {
    clearAllStorage();
    setMembers(DEFAULT_MEMBERS);
    setExpenses([]);
    setCategories(DEFAULT_CATEGORIES);
    setSettings(DEFAULT_SETTINGS);
    const client = getSupabaseClient();
    if (client) {
      await client.from('expenses').delete().eq('group_id', groupId);
    }
    showToast('App reset to clean state (0 expenses)', 'info');
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
        // Supabase Cloud Sync
        groupId,
        changeGroupId,
        cloudStatus,
        cloudLastSynced,
        refreshCloudData,
        testSupabaseConnection,
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
