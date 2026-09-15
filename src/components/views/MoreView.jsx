import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import SettlementView from './SettlementView';
import MonthlyView from './MonthlyView';
import MembersView from './MembersView';
import SettingsView from './SettingsView';
import { Scale, PieChart, Users, Settings as SettingsIcon } from 'lucide-react';

export default function MoreView() {
  const { currentView, setCurrentView } = useExpenses();

  // If currentView is one of the specific subviews, render it; otherwise default to 'settlement'
  const activeSubView = ['settlement', 'monthly', 'members', 'settings'].includes(currentView)
    ? currentView
    : 'settlement';

  const subTabs = [
    { id: 'settlement', label: 'Settlement', icon: Scale },
    { id: 'monthly', label: 'Monthly', icon: PieChart },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div>
      {/* Sub-navigation pills */}
      <div
        style={{
          padding: '12px 16px 0',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          background: 'var(--bg-glass)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                background: isActive ? 'var(--bg-surface)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                fontWeight: 600,
                fontSize: '0.84rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render the selected subview */}
      {activeSubView === 'settlement' && <SettlementView />}
      {activeSubView === 'monthly' && <MonthlyView />}
      {activeSubView === 'members' && <MembersView />}
      {activeSubView === 'settings' && <SettingsView />}
    </div>
  );
}
