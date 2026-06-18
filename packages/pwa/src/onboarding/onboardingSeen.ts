/** Abstração de armazenamento (localStorage em produção; fake nos testes). */
export interface SeenStorage {
  read(): string | null;
  write(value: string): void;
}

export interface OnboardingSeen {
  hasSeen(): boolean;
  markSeen(): void;
}

/**
 * Marca local de que o onboarding já foi exibido neste device. Complementa o
 * `onboardingCompletedAt` do servidor: como concluir o tour é best-effort (pode
 * falhar offline), esta marca garante que ele não reapareça a cada abertura.
 */
export function createOnboardingSeen(storage: SeenStorage): OnboardingSeen {
  return {
    hasSeen: () => storage.read() === '1',
    markSeen: () => storage.write('1'),
  };
}

export function localOnboardingSeen(key = 'devo-onboarding-seen'): OnboardingSeen {
  return createOnboardingSeen({
    read: () => localStorage.getItem(key),
    write: (value) => localStorage.setItem(key, value),
  });
}
