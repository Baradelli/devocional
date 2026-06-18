import { useSyncExternalStore } from 'react';

/** Evento não-padrão do Chrome/Android para instalação do PWA. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

// O `beforeinstallprompt` dispara no load, antes de qualquer componente montar.
// Por isso capturamos em escopo de módulo e só então a UI pode oferecer instalar.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** `true` quando o navegador ofereceu instalação programática (Android/Chrome). */
export function useCanInstall(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => deferred !== null,
    () => false,
  );
}

/** Dispara o prompt nativo de instalação. Retorna se o usuário aceitou. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) {
    return false;
  }
  const event = deferred;
  await event.prompt();
  const choice = await event.userChoice;
  // O evento só pode ser usado uma vez.
  deferred = null;
  emit();
  return choice.outcome === 'accepted';
}
