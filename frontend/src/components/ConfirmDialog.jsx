import React from 'react';

const ConfirmDialog = ({ show, title, message, confirmText = 'Evet, Sil', cancelText = 'İptal', onConfirm, onCancel, variant = 'danger' }) => {
  if (!show) return null;

  const variantColors = {
    danger: { bg: '#FEE2E2', color: '#DC2626', icon: '🗑️' },
    warning: { bg: '#FEF3C7', color: '#D97706', icon: '⚠️' },
  };

  const cfg = variantColors[variant] || variantColors.danger;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop show"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="modal d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: '16px', overflow: 'hidden' }}
          >
            <div className="modal-body text-center p-4">
              {/* İkon */}
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: cfg.bg,
                  fontSize: '24px',
                }}
              >
                {cfg.icon}
              </div>

              <h6 className="fw-bold mb-2" style={{ color: 'var(--custom-text)' }}>
                {title}
              </h6>
              <p className="text-muted mb-4" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                {message}
              </p>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-light flex-grow-1 fw-medium"
                  onClick={onCancel}
                >
                  {cancelText}
                </button>
                <button
                  className="btn flex-grow-1 fw-medium text-white"
                  style={{ backgroundColor: cfg.color }}
                  onClick={onConfirm}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;
