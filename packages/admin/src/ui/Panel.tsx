import type { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, hint, actions, children, className }: PanelProps) {
  return (
    <section className={['panel', className].filter(Boolean).join(' ')}>
      {(title || actions) && (
        <header className="panel__head">
          <div>
            {title && <h3 className="panel__title">{title}</h3>}
            {hint && <p className="panel__hint">{hint}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}
