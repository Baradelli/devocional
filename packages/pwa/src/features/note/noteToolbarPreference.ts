/**
 * Preferência da barra fixa de blocos no editor de anotações. Persiste em
 * localStorage (best-effort) e vem LIGADA por padrão; desligada, restam só os
 * blocos pelo menu `/`. Espelha o padrão de `theme/theme.ts`.
 */
export const NOTE_TOOLBAR_KEY = 'devo-note-toolbar';

export function readNoteToolbarEnabled(): boolean {
  try {
    // Ausência da chave (estado inicial) = ligada.
    return localStorage.getItem(NOTE_TOOLBAR_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setNoteToolbarEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTE_TOOLBAR_KEY, enabled ? 'on' : 'off');
  } catch {
    // best-effort: sem localStorage a preferência simplesmente não persiste.
  }
}
