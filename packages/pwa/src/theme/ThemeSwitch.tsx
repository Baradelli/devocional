import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { applyTheme, readStoredTheme, type ThemeId, THEMES } from './theme.js';

/** Botão flutuante de troca de tema (canto inferior esquerdo). */
export function ThemeSwitch() {
  const [current, setCurrent] = useState<ThemeId>(readStoredTheme);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(current);
  }, [current]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('click', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="theme-switch" ref={wrapRef}>
      <button
        type="button"
        className="theme-switch__btn"
        aria-label="Mudar tema"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="theme-switch__menu" role="menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitem"
              className={t.id === current ? 'is-active' : undefined}
              onClick={() => {
                setCurrent(t.id);
                setOpen(false);
              }}
            >
              <span
                className="theme-switch__dot"
                style={{ '--swatch': t.swatch, '--accent': t.accent } as CSSProperties}
              />
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
