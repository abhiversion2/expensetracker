import React, { useRef, useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { downloadFile, exportGroupExpensesCsv } from '../../utils/exportUtils';
import { getSupabaseCredentials } from '../../utils/supabase';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Smile,
  Calendar,
  DollarSign,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Users,
  Tag,
  Check,
  RotateCcw,
  Cloud,
  CloudOff,
  Copy,
  Share2,
  ExternalLink,
  Database,
  Code,
  CheckCircle2,
} from 'lucide-react';

const SQL_SCHEMA_SNIPPET = `-- Run this in Supabase Dashboard -> SQL Editor
CREATE TABLE IF NOT EXISTS public.groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Apna Gang',
  currency TEXT DEFAULT '₹',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_color TEXT,
  initials TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_by TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  category TEXT,
  notes TEXT,
  participants JSONB DEFAULT '[]'::jsonb,
  split_type TEXT DEFAULT 'equal',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access for groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
-- 3. Set Replica Identity to FULL so Realtime events contain complete data
ALTER TABLE public.groups REPLICA IDENTITY FULL;
ALTER TABLE public.members REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;

-- 4. Enable Supabase Realtime safely
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;`;

export default function SettingsView() {
  const {
    settings,
    updateSettings,
    members,
    expenses,
    categories,
    resetAllData,
    loadSampleData,
    setConfirmDialog,
    showToast,
    setCurrentView,
    // Supabase
    groupId,
    changeGroupId,
    cloudStatus,
    cloudLastSynced,
    refreshCloudData,
    testSupabaseConnection,
  } = useExpenses();

  const fileInputRef = useRef(null);

  // Cloud sync form states
  const creds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(creds.url);
  const [supabaseKey, setSupabaseKey] = useState(creds.key);
  const [groupInput, setGroupInput] = useState(groupId);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Save Supabase credentials directly
  const handleSaveCredentials = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      showToast('Please enter both Supabase URL and Anon Key', 'error');
      return;
    }
    localStorage.setItem('supabase_custom_url', supabaseUrl.trim());
    localStorage.setItem('supabase_custom_key', supabaseKey.trim());
    showToast('Supabase credentials saved! Connecting...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('supabase_custom_url');
    localStorage.removeItem('supabase_custom_key');
    setSupabaseUrl('');
    setSupabaseKey('');
    showToast('Credentials cleared. Reverted to offline local storage.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleSwitchGroup = () => {
    if (!groupInput.trim()) return;
    changeGroupId(groupInput.trim());
  };

  const handleCopyInviteLink = () => {
    const origin = window.location.origin + window.location.pathname;
    const inviteUrl = `${origin}?group=${encodeURIComponent(groupId)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    showToast('Group invite link copied to clipboard! Share on WhatsApp 🎉', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(groupId);
      setTestResult(res);
      if (res.ok) {
        showToast('Supabase connected & verified!', 'success');
      } else {
        showToast('Connection test failed. Check details below.', 'error');
      }
    } catch (e) {
      setTestResult({ ok: false, message: e.message || 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
    setCopiedSql(true);
    showToast('SQL schema copied! Paste it in Supabase SQL Editor.', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Export complete JSON Backup
  const handleBackupJson = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      groupName: settings.groupName,
      members,
      expenses,
      categories,
      settings,
    };
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(
      JSON.stringify(backupData, null, 2),
      `${settings.groupName.replace(/\s+/g, '_')}_Backup_${dateStr}.json`,
      'application/json;charset=utf-8;'
    );
    showToast('Backup JSON downloaded', 'success');
  };

  // Restore from JSON file
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.members && parsed.expenses) {
          setConfirmDialog({
            title: 'Restore Backup?',
            message: `Restore data from ${parsed.groupName || 'backup'}? This will replace current expenses with ${parsed.expenses.length} expenses and ${parsed.members.length} members.`,
            confirmText: 'Restore Now',
            isDanger: false,
            onConfirm: () => {
              localStorage.setItem('apna_gang_members', JSON.stringify(parsed.members));
              localStorage.setItem('apna_gang_expenses', JSON.stringify(parsed.expenses));
              if (parsed.categories) {
                localStorage.setItem('apna_gang_categories', JSON.stringify(parsed.categories));
              }
              if (parsed.settings) {
                localStorage.setItem('apna_gang_settings', JSON.stringify(parsed.settings));
              }
              window.location.reload();
            },
          });
        } else {
          showToast('Invalid backup file format.', 'error');
        }
      } catch (err) {
        showToast('Failed to parse backup JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePromptReset = () => {
    setConfirmDialog({
      title: 'Reset All Group Data?',
      message: 'This will erase all recorded expenses and reset the app back to initial clean state with the default 6 friends. This cannot be undone.',
      confirmText: 'Reset Everything',
      isDanger: true,
      onConfirm: () => {
        resetAllData();
      },
    });
  };

  const handlePromptLoadDemo = () => {
    setConfirmDialog({
      title: 'Load Realistic Sample Data?',
      message: 'This will load sample group expenses (dinner, fuel, movie, tea, groceries) so you can test settlements, weekly lowest-spender celebrations, and charts immediately.',
      confirmText: 'Load Demo Data',
      isDanger: false,
      onConfirm: () => {
        loadSampleData();
      },
    });
  };

  return (
    <div className="main-content animate-fade-in" style={{ paddingBottom: '30px' }}>
      {/* Settings Header */}
      <div className="card card-gradient-hero">
        <span className="badge badge-primary">Preferences</span>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
          App & Group Settings
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Cloud sync, real-time collaboration, weekly rules, and data backup
        </p>
      </div>

      {/* Supabase Cloud Sync Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Supabase Cloud Sync</h3>
          </div>
          {cloudStatus === 'connected' ? (
            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="status-dot dot-live" /> Live Connected
            </span>
          ) : cloudStatus === 'connecting' ? (
            <span className="badge badge-warning">🔄 Connecting...</span>
          ) : (
            <span className="badge badge-outline">📱 Offline / Local</span>
          )}
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Connect Supabase so all friends can open your Vercel link on their phones, add expenses, and see live balances in real time!
        </p>

        {/* Group Code / Share Link */}
        <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Active Group ID / Room</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={groupInput}
              onChange={e => setGroupInput(e.target.value)}
              placeholder="e.g. apna-gang"
              style={{ flex: 1 }}
            />
            {groupInput !== groupId && (
              <button className="btn-secondary" style={{ padding: '0 12px' }} onClick={handleSwitchGroup}>
                Switch
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              className="btn-primary"
              style={{ flex: 1, padding: '9px 12px', fontSize: '0.82rem' }}
              onClick={handleCopyInviteLink}
            >
              {copiedLink ? <CheckCircle2 size={15} /> : <Share2 size={15} />}
              <span>{copiedLink ? 'Copied Link!' : 'Share Group Link (WhatsApp)'}</span>
            </button>
            {cloudStatus === 'connected' && (
              <button
                className="btn-secondary"
                style={{ padding: '9px 12px', fontSize: '0.82rem' }}
                onClick={refreshCloudData}
                title="Refresh from Cloud"
              >
                <RefreshCw size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Supabase Credentials Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="form-group">
            <label className="form-label">Supabase Project URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Supabase Anon Public Key</label>
            <input
              type="password"
              value={supabaseKey}
              onChange={e => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveCredentials}>
              <Check size={16} />
              <span>Save & Connect</span>
            </button>
            {creds.isConfigured && (
              <button className="btn-secondary" onClick={handleClearCredentials}>
                Disconnect
              </button>
            )}
          </div>

          <button
            className="btn-secondary"
            style={{ fontSize: '0.82rem', justifyContent: 'center' }}
            onClick={handleTestConnection}
            disabled={testing}
          >
            <RefreshCw size={14} className={testing ? 'spin-icon' : ''} />
            <span>{testing ? 'Testing Tables & Permissions...' : '🔍 Test Database Connection'}</span>
          </button>

          {testResult && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                lineHeight: 1.4,
                background: testResult.ok ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${testResult.ok ? '#10b981' : '#ef4444'}`,
                color: testResult.ok ? '#10b981' : '#f87171',
              }}
            >
              {testResult.ok ? '✅ ' : '❌ '}
              {testResult.message}
            </div>
          )}

          <button
            className="btn-secondary"
            style={{ fontSize: '0.78rem', justifyContent: 'center' }}
            onClick={() => setShowSqlModal(!showSqlModal)}
          >
            <Code size={14} />
            <span>{showSqlModal ? 'Hide SQL Setup Script' : 'View / Copy SQL Setup Script'}</span>
          </button>

          {showSqlModal && (
            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  Supabase Dashboard ➔ SQL Editor
                </span>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                  onClick={handleCopySql}
                >
                  {copiedSql ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  overflowX: 'auto',
                  maxHeight: '160px',
                  background: 'var(--bg-input)',
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {SQL_SCHEMA_SNIPPET}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* General Settings Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Group Preferences</h3>

        {/* Group Name */}
        <div className="form-group">
          <label className="form-label">Group Name</label>
          <input
            type="text"
            value={settings.groupName}
            onChange={e => updateSettings({ groupName: e.target.value })}
            placeholder="e.g. Apna Gang, Goa Trip 2026"
          />
        </div>

        {/* Currency Symbol */}
        <div className="form-group">
          <label className="form-label">Currency Symbol</label>
          <select
            value={settings.currency}
            onChange={e => updateSettings({ currency: e.target.value })}
          >
            <option value="₹">₹ Indian Rupee (INR)</option>
            <option value="$">$ US Dollar (USD)</option>
            <option value="€">€ Euro (EUR)</option>
            <option value="£">£ British Pound (GBP)</option>
            <option value="AED">AED UAE Dirham</option>
            <option value="৳">৳ Bangladeshi Taka</option>
          </select>
        </div>

        {/* Week Start Day */}
        <div className="form-group">
          <label className="form-label">Week Starts On</label>
          <select
            value={settings.weekStartDay}
            onChange={e => updateSettings({ weekStartDay: parseInt(e.target.value, 10) })}
          >
            <option value={1}>Monday (Default: Monday ➔ Sunday)</option>
            <option value={0}>Sunday (Sunday ➔ Saturday)</option>
          </select>
        </div>

        {/* Lowest Spender Criteria */}
        <div className="form-group">
          <label className="form-label">Lowest Spender Calculation Based On</label>
          <select
            value={settings.lowestSpenderCriteria}
            onChange={e => updateSettings({ lowestSpenderCriteria: e.target.value })}
          >
            <option value="paid">Actual Amount Paid (Default)</option>
            <option value="share">Personal Fair Share Consumed</option>
          </select>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Determines who qualifies for the weekly celebration trophy.
          </span>
        </div>
      </div>

      {/* Toggles Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Features & Fun</h3>

        {/* Humor Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smile size={16} color="#ec4899" />
              <span>Friendly Humor Mode</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Fun remarks like "Kanjoos of the week 😂" on weekly results
            </div>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
            <input
              type="checkbox"
              checked={settings.humorMode}
              onChange={e => updateSettings({ humorMode: e.target.checked })}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.humorMode ? 'var(--accent-primary)' : 'var(--bg-input)',
                borderRadius: '24px',
                transition: '0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: settings.humorMode ? '23px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#ffffff',
                  borderRadius: '50%',
                  transition: '0.2s',
                }}
              />
            </span>
          </label>
        </div>

        {/* Dark Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {settings.theme === 'dark' ? <Moon size={16} color="var(--accent-primary)" /> : <Sun size={16} color="#f59e0b" />}
              <span>Dark Theme</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Sleek dark mode vs bright clean light mode
            </div>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
            <input
              type="checkbox"
              checked={settings.theme === 'dark'}
              onChange={e => updateSettings({ theme: e.target.checked ? 'dark' : 'light' })}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.theme === 'dark' ? 'var(--accent-primary)' : 'var(--bg-input)',
                borderRadius: '24px',
                transition: '0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: settings.theme === 'dark' ? '23px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#ffffff',
                  borderRadius: '50%',
                  transition: '0.2s',
                }}
              />
            </span>
          </label>
        </div>
      </div>

      {/* Data Backup & Export Section */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Data Safety & Backup</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          All data is kept safe locally and synced to the cloud if Supabase is connected. You can also export backups.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleBackupJson}>
            <Download size={15} />
            <span>Backup (JSON)</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={15} />
            <span>Restore (JSON)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <button
          className="btn-secondary"
          onClick={() => exportGroupExpensesCsv(expenses, members, settings.groupName)}
        >
          <Download size={15} />
          <span>Export All Expenses (CSV / Excel)</span>
        </button>
      </div>

      {/* Danger & Demo Data Zone */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Data Management</h3>

        <button className="btn-secondary" onClick={handlePromptLoadDemo}>
          <RefreshCw size={15} color="var(--accent-primary)" />
          <span>Load Realistic Demo Expenses</span>
        </button>

        <button className="btn-danger" onClick={handlePromptReset}>
          <RotateCcw size={15} />
          <span>Reset Group to Clean State</span>
        </button>
      </div>
    </div>
  );
}
