import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Home, Receipt, User, Trophy, MoreHorizontal } from 'lucide-react';

export default function BottomNav() {
  const { currentView, setCurrentView } = useExpenses();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'weekly', label: 'Weekly', icon: Trophy },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  // Map subviews to parent tab for active styling
  const getActiveTab = () => {
    if (['home'].includes(currentView)) return 'home';
    if (['expenses'].includes(currentView)) return 'expenses';
    if (['personal'].includes(currentView)) return 'personal';
    if (['weekly'].includes(currentView)) return 'weekly';
    return 'more'; // settlement, monthly, members, settings fall under More
  };

  const activeTab = getActiveTab();

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
            aria-label={item.label}
          >
            <div className="nav-icon-wrapper">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
