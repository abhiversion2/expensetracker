import React from 'react';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import FloatingAddButton from './components/FloatingAddButton';
import AddExpenseModal from './components/AddExpenseModal';
import ExpenseDetailModal from './components/ExpenseDetailModal';
import ConfirmModal from './components/ConfirmModal';
import LowestSpenderModal from './components/LowestSpenderModal';
import Toast from './components/Toast';

import HomeView from './components/views/HomeView';
import ExpensesView from './components/views/ExpensesView';
import PersonalView from './components/views/PersonalView';
import WeeklyView from './components/views/WeeklyView';
import MoreView from './components/views/MoreView';

import './App.css';

function MainAppContent() {
  const { currentView, cloudStatus, setCurrentView } = useExpenses();

  const renderActiveView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'expenses':
        return <ExpensesView />;
      case 'personal':
        return <PersonalView />;
      case 'weekly':
        return <WeeklyView />;
      case 'more':
      case 'settlement':
      case 'monthly':
      case 'members':
      case 'settings':
        return <MoreView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="app-wrapper">
      <Header />

      {/* Persistent Database Connection Alerts */}
      {cloudStatus === 'offline' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#f87171',
            zIndex: 35,
          }}
        >
          <span>⚠️ <strong>Database Disconnected:</strong> Data is only local. Connect Supabase to sync live.</span>
          <button
            onClick={() => setCurrentView('settings')}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            Connect
          </button>
        </div>
      )}

      {cloudStatus === 'connecting' && (
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.12)',
            borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: 'var(--accent-primary)',
            zIndex: 35,
          }}
        >
          <span>🔄 Connecting to live database...</span>
        </div>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderActiveView()}
      </main>
      <FloatingAddButton />
      <BottomNav />

      {/* Global Modals & Notifications */}
      <AddExpenseModal />
      <ExpenseDetailModal />
      <ConfirmModal />
      <LowestSpenderModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ExpenseProvider>
      <MainAppContent />
    </ExpenseProvider>
  );
}
