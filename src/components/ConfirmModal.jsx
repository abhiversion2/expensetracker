import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal() {
  const { confirmDialog, setConfirmDialog } = useExpenses();

  if (!confirmDialog) return null;

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog(null);
  };

  const handleCancel = () => {
    setConfirmDialog(null);
  };

  return (
    <div className="modal-overlay" onClick={handleCancel} style={{ zIndex: 110 }}>
      <div
        className="modal-content animate-scale-up"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '400px' }}
      >
        <div className="modal-body" style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-full)',
              background: confirmDialog.isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: confirmDialog.isDanger ? 'var(--danger)' : 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
            {confirmDialog.title || 'Confirm Action'}
          </h3>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {confirmDialog.message}
          </p>
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className={confirmDialog.isDanger ? 'btn-danger' : 'btn-primary'}
            style={{ flex: 1 }}
            onClick={handleConfirm}
          >
            {confirmDialog.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
