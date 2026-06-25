import { LuMoon, LuSun } from 'react-icons/lu';

import type { Theme } from '../lib/theme.js';

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const toDark = theme === 'light';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={toDark ? 'Ativar tema escuro' : 'Ativar tema claro'}
      title={toDark ? 'Tema escuro' : 'Tema claro'}
    >
      <span aria-hidden>{toDark ? <LuMoon /> : <LuSun />}</span>
      {toDark ? 'Escuro' : 'Claro'}
    </button>
  );
}
