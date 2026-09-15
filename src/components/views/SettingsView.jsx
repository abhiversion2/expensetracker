import React, { useRef } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { downloadFile, exportGroupExpensesCsv } from '../../utils/exportUtils';
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
} from 'lucide-react';

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
  } = useExpenses();

  const fileInputRef = useRef(null);

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
              // Direct restore
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
    <div className="main-content animate-fade-in">
      {/* Settings Header */}
      <div className="card card-gradient-hero">
        <span className="badge badge-primary">Preferences</span>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
          App & Group Settings
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Customize group name, currency, weekly rules, and data backup
        </p>
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

      {/* Data Backup & Export Section (Spec 23 & 24) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Data Safety & Backup</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          All data is automatically kept safe on this device. You can download a full JSON backup or export to Excel/CSV.
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
