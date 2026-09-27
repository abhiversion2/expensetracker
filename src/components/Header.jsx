import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Moon, Sun, Users, Plus, Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function Header() {
  const {
    settings,
    updateSettings,
    members,
    setIsAddExpenseOpen,
    setCurrentView,
    cloudStatus,
  } = useExpenses();

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  const renderCloudBadge = () => {
    if (cloudStatus === 'connected') {
      return (
        <button
          className="cloud-status-badge badge-connected"
          onClick={() => setCurrentView('settings')}
          title="Cloud Realtime Sync Active"
        >
          <span className="status-dot dot-live" />
          <Cloud size={12} />
          <span>Live</span>
        </button>
      );
    }
    if (cloudStatus === 'connecting') {
      return (
        <button
          className="cloud-status-badge badge-connecting"
          onClick={() => setCurrentView('settings')}
          title="Connecting to Supabase..."
        >
          <RefreshCw size={12} className="spin-icon" />
          <span>Syncing</span>
        </button>
      );
    }
    return (
      <button
        className="cloud-status-badge badge-offline"
        onClick={() => setCurrentView('settings')}
        title="Running locally on this device. Click to configure Supabase."
      >
        <CloudOff size={12} />
        <span>Local</span>
      </button>
    );
  };

  return (
    <header className="app-header">
      <div
        className="header-brand"
        style={{ cursor: 'pointer' }}
        onClick={() => setCurrentView('home')}
      >
        <div className="header-logo">💸</div>
        <div className="header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>{settings.groupName || 'Apna Gang'}</h1>
            {renderCloudBadge()}
          </div>
          <div className="header-subtitle">
            <Users size={12} />
            <span>{members.length} friends spending together</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle Theme"
        >
          {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="icon-btn"
          style={{ background: 'var(--accent-gradient)', color: '#fff', border: 'none' }}
          onClick={() => setIsAddExpenseOpen(true)}
          title="Add Expense"
          aria-label="Add Expense"
        >
          <Plus size={18} />
        </button>
      </div>
    </header>
  );
}
