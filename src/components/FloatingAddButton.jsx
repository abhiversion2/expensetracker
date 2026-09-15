import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Plus } from 'lucide-react';

export default function FloatingAddButton() {
  const { setIsAddExpenseOpen, setEditingExpense } = useExpenses();

  const handleClick = () => {
    setEditingExpense(null); // Clear any previous edit state
    setIsAddExpenseOpen(true);
  };

  return (
    <button
      className="fab-add"
      onClick={handleClick}
      aria-label="Add Expense"
    >
      <Plus size={20} strokeWidth={2.8} />
      <span>Add Expense</span>
    </button>
  );
}
