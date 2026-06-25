/**
 * Progresso dos passos do dia (UX do cliente — a autoridade do dia concluído /
 * streak continua sendo do servidor). Fica atrelado ao `devotionalId` do dia: o
 * devocional de amanhã tem outro id, então o progresso de hoje "expira" sozinho.
 * É apagado ao concluir o dia.
 */
export interface DayProgress {
  devotionalId: string;
  done: string[];
}

export interface DayProgressStorage {
  read(): string | null;
  write(value: string): void;
  remove(): void;
}

export interface DayProgressStore {
  read(): DayProgress | null;
  save(progress: DayProgress): void;
  clear(): void;
}

export function createDayProgressStore(storage: DayProgressStorage): DayProgressStore {
  return {
    read() {
      const raw = storage.read();
      if (!raw) {
        return null;
      }
      try {
        const parsed = JSON.parse(raw) as Partial<DayProgress>;
        if (typeof parsed.devotionalId === 'string' && Array.isArray(parsed.done)) {
          return {
            devotionalId: parsed.devotionalId,
            done: parsed.done.filter((s): s is string => typeof s === 'string'),
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    save(progress) {
      storage.write(JSON.stringify(progress));
    },
    clear() {
      storage.remove();
    },
  };
}

export function localStorageDayProgress(key = 'devocional.dayProgress'): DayProgressStore {
  return createDayProgressStore({
    read: () => localStorage.getItem(key),
    write: (value) => localStorage.setItem(key, value),
    remove: () => localStorage.removeItem(key),
  });
}
