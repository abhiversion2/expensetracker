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
  const { currentView } = useExpenses();

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
