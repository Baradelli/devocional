import { useEffect, useRef, useState } from 'react';

import { localStorageNoteQueue } from '../../offline/noteQueue.js';
import { flushNoteQueue } from '../../offline/noteSync.js';
import {
  type AutosaveController,
  createAutosaveController,
  type SaveStatus,
} from './autosaveController.js';

/**
 * Liga o autosave coalescido ao ciclo de vida do editor: cria o controller uma
 * vez e dispara o flush imediato ao sair (blur, app em background, desmontar).
 */
export function useNoteAutosave(
  devotionalId: string,
  existedOnLoad: boolean,
  initialMarkdown: string,
): { status: SaveStatus; notifyChange: (markdown: string) => void; removeNote: () => void } {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const controllerRef = useRef<AutosaveController | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = createAutosaveController({
      devotionalId,
      existedOnLoad,
      initialMarkdown,
      queue: localStorageNoteQueue(),
      flush: flushNoteQueue,
      now: () => new Date().toISOString(),
      newId: () => crypto.randomUUID(),
      onStatus: setStatus,
    });
  }
  const controller = controllerRef.current;

  useEffect(() => {
    const flushNow = () => controller.flushNow();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        controller.flushNow();
      }
    };
    window.addEventListener('blur', flushNow);
    window.addEventListener('pagehide', flushNow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', flushNow);
      window.removeEventListener('pagehide', flushNow);
      document.removeEventListener('visibilitychange', onVisibility);
      controller.flushNow();
      controller.dispose();
    };
  }, [controller]);

  return {
    status,
    notifyChange: (markdown) => controller.change(markdown),
    removeNote: () => controller.remove(),
  };
}
