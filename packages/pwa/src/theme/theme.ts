/**
 * Tema visual do app: troca apenas variáveis de cor (ver styles/themes.css).
 * A escolha persiste em localStorage e é aplicada no <html data-theme>. O
 * script anti-flash em index.html aplica o tema antes do React montar.
 */

export interface Theme {
  id: ThemeId;
  name: string;
  swatch: string;
  accent: string;
}

export type ThemeId = 'claro' | 'escuro';

export const THEME_KEY = 'devo-theme';
export const DEFAULT_THEME: ThemeId = 'claro';

export const THEMES: Theme[] = [
  { id: 'claro', name: 'Claro', swatch: '#ffffff', accent: '#3c6b45' },
  { id: 'escuro', name: 'Escuro', swatch: '#1e2329', accent: '#6fa06a' },
];

const THEME_IDS = new Set<string>(THEMES.map((t) => t.id));

export function isThemeId(value: string | null): value is ThemeId {
  return value !== null && THEME_IDS.has(value);
}

export function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.setAttribute('data-theme', id);
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {
    // best-effort: sem localStorage o tema simplesmente não persiste.
  }
}
