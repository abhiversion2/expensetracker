import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export default function Toast() {
  const { toast } = useExpenses();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'error':
        return <AlertCircle size={18} color="var(--danger)" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--warning)" />;
      case 'info':
        return <Info size={18} color="var(--info)" />;
      default:
        return <CheckCircle2 size={18} color="var(--success)" />;
    }
  };

  return (
    <div className="toast-container">
      <div className={`toast toast-${toast.type || 'success'}`}>
        {getIcon()}
        <span>{toast.text}</span>
      </div>
    </div>
  );
}
