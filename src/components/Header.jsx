import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Moon, Sun, Users, Sparkles, Plus } from 'lucide-react';

export default function Header() {
  const {
    settings,
    updateSettings,
    members,
    setIsAddExpenseOpen,
    setCurrentView,
    currentView,
  } = useExpenses();

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
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
          <h1>{settings.groupName || 'Apna Gang'}</h1>
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
