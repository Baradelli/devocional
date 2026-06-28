import { useEffect } from 'react';

export interface ConfirmModalProps {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Modal de confirmação curto (sim/não), com Esc e clique no fundo para cancelar. */
export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="confirm" role="dialog" aria-modal="true" aria-label={title}>
      <div className="confirm__backdrop" onClick={onCancel} aria-hidden="true" />
      <div className="confirm__card">
        <p className="confirm__title">{title}</p>
        {message && <p className="confirm__msg">{message}</p>}
        <div className="confirm__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              danger ? 'btn confirm__confirm confirm__confirm--danger' : 'btn confirm__confirm'
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
