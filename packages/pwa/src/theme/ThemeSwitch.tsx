import { useEffect, useState } from 'react';
import { LuMoon, LuSun } from 'react-icons/lu';

import { applyTheme, readStoredTheme, type ThemeId } from './theme.js';

/** Botão flutuante de tema (canto inferior esquerdo): clica e alterna claro/escuro. */
export function ThemeSwitch() {
  const [current, setCurrent] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    applyTheme(current);
  }, [current]);

  const toDark = current === 'claro';

  return (
    <button
      type="button"
      className="theme-switch__btn"
      aria-label={toDark ? 'Ativar tema escuro' : 'Ativar tema claro'}
      title={toDark ? 'Tema escuro' : 'Tema claro'}
      onClick={() => setCurrent(toDark ? 'escuro' : 'claro')}
    >
      {toDark ? <LuMoon size={22} aria-hidden /> : <LuSun size={22} aria-hidden />}
    </button>
  );
}
