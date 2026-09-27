import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env or user localStorage override
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const customUrl = localStorage.getItem('supabase_custom_url') || '';
  const customKey = localStorage.getItem('supabase_custom_key') || '';

  const url = (customUrl || envUrl).trim();
  const key = (customKey || envKey).trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key && url.startsWith('http')),
  };
}

// Get or set active group ID (supports ?group=xyz in URL query param)
export function getActiveGroupId() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramGroup = urlParams.get('group');
  if (paramGroup && paramGroup.trim()) {
    localStorage.setItem('supabase_group_id', paramGroup.trim().toLowerCase());
    return paramGroup.trim().toLowerCase();
  }

  const storedGroup = localStorage.getItem('supabase_group_id');
  return storedGroup || 'apna-gang';
}

export function setActiveGroupId(groupId) {
  const cleanId = (groupId || 'apna-gang').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  localStorage.setItem('supabase_group_id', cleanId);
  return cleanId;
}

let supabaseInstance = null;
let currentClientUrl = '';
let currentClientKey = '';

export function getSupabaseClient() {
  const { url, key, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  // Re-instantiate if URL or Key changed
  if (!supabaseInstance || currentClientUrl !== url || currentClientKey !== key) {
    currentClientUrl = url;
    currentClientKey = key;
    supabaseInstance = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseInstance;
}

// ---------------- Database Sync Helpers ----------------

/**
 * Fetch all group data from Supabase
 */
export async function fetchRemoteGroupData(groupId) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Group info
    const { data: groupData, error: groupErr } = await client
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle();

    if (groupErr) console.warn('Supabase fetch group error:', groupErr);

    // 2. Members
    const { data: membersData, error: membersErr } = await client
      .from('members')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (membersErr) console.warn('Supabase fetch members error:', membersErr);

    // 3. Expenses
    const { data: expensesData, error: expensesErr } = await client
      .from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (expensesErr) console.warn('Supabase fetch expenses error:', expensesErr);

    return {
      group: groupData || null,
      members: membersData
        ? membersData.map(m => ({
            id: m.id,
            name: m.name,
            avatarColor: m.avatar_color,
            initials: m.initials,
            createdAt: m.created_at,
          }))
        : null,
      expenses: expensesData
        ? expensesData.map(e => ({
            id: e.id,
            description: e.description,
            amount: Number(e.amount),
            paidBy: e.paid_by,
            date: e.date,
            time: e.time,
            category: e.category,
            notes: e.notes || '',
            participants: e.participants || [],
            splitType: e.split_type || 'equal',
            createdAt: e.created_at,
          }))
        : null,
    };
  } catch (err) {
    console.error('Failed to fetch from Supabase:', err);
    return null;
  }
}

/**
 * Initialize or seed group in Supabase if not existing
 */
export async function seedGroupToSupabase(groupId, initialData) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    // Upsert group record
    await client.from('groups').upsert({
      id: groupId,
      name: initialData.settings?.groupName || 'Apna Gang',
      currency: initialData.settings?.currency || '₹',
      settings: initialData.settings || {},
    });

    // Upsert members
    if (initialData.members?.length) {
      const rows = initialData.members.map(m => ({
        id: m.id,
        group_id: groupId,
        name: m.name,
        avatar_color: m.avatarColor,
        initials: m.initials,
        created_at: m.createdAt || new Date().toISOString(),
      }));
      await client.from('members').upsert(rows);
    }

    // Upsert initial expenses
    if (initialData.expenses?.length) {
      const rows = initialData.expenses.map(e => ({
        id: e.id,
        group_id: groupId,
        description: e.description,
        amount: Number(e.amount),
        paid_by: e.paidBy,
        date: e.date,
        time: e.time,
        category: e.category,
        notes: e.notes,
        participants: e.participants,
        split_type: e.splitType,
        created_at: e.createdAt || new Date().toISOString(),
      }));
      await client.from('expenses').upsert(rows);
    }
  } catch (err) {
    console.error('Supabase seeding error:', err);
  }
}

/**
 * Insert or update single expense
 */
export async function syncExpenseToSupabase(groupId, expense) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('expenses').upsert({
      id: expense.id,
      group_id: groupId,
      description: expense.description,
      amount: Number(expense.amount),
      paid_by: expense.paidBy,
      date: expense.date,
      time: expense.time,
      category: expense.category,
      notes: expense.notes,
      participants: expense.participants,
      split_type: expense.splitType,
      created_at: expense.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error syncing expense to Supabase:', err);
  }
}

/**
 * Delete expense
 */
export async function deleteExpenseFromSupabase(expenseId) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('expenses').delete().eq('id', expenseId);
  } catch (err) {
    console.error('Error deleting expense from Supabase:', err);
  }
}

/**
 * Sync Member
 */
export async function syncMemberToSupabase(groupId, member) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('members').upsert({
      id: member.id,
      group_id: groupId,
      name: member.name,
      avatar_color: member.avatarColor,
      initials: member.initials,
      created_at: member.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error syncing member to Supabase:', err);
  }
}

/**
 * Delete Member
 */
export async function deleteMemberFromSupabase(memberId) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('members').delete().eq('id', memberId);
  } catch (err) {
    console.error('Error deleting member from Supabase:', err);
  }
}

/**
 * Sync Group Settings
 */
export async function syncGroupSettingsToSupabase(groupId, settings) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('groups').upsert({
      id: groupId,
      name: settings.groupName || 'Apna Gang',
      currency: settings.currency || '₹',
      settings: settings,
    });
  } catch (err) {
    console.error('Error syncing group settings to Supabase:', err);
  }
}
