import { type ReactNode, useEffect } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode;
  actions: ReactNode;
  onClose: () => void;
}

/** Diálogo modal centrado sobre um backdrop escurecido (estética do front). */
export function Modal({ title, children, actions, onClose }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__card">
        <h3 className="modal__title">{title}</h3>
        <div className="modal__body">{children}</div>
        <div className="modal__actions">{actions}</div>
      </div>
    </div>
  );
}
