import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Pilha de telas que abrem por cima (estações da jornada, calendário, editor).
 * Integra com o histórico: abrir empilha um estado; o botão voltar do device
 * (popstate) fecha o topo; fechar pela UI chama history.back() para um só fluxo.
 */
export function useScreenStack<T extends string>() {
  const [stack, setStack] = useState<T[]>([]);
  const depthRef = useRef(0);

  useEffect(() => {
    const onPopState = () => {
      setStack((current) => {
        if (current.length === 0) {
          return current;
        }
        depthRef.current = Math.max(0, depthRef.current - 1);
        return current.slice(0, -1);
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Trava o scroll do fundo enquanto há overlay aberto.
  useEffect(() => {
    document.documentElement.style.overflow = stack.length > 0 ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [stack.length]);

  const open = useCallback((name: T) => {
    depthRef.current += 1;
    history.pushState({ depth: depthRef.current }, '');
    setStack((current) => (current[current.length - 1] === name ? current : [...current, name]));
  }, []);

  const close = useCallback(() => {
    setStack((current) => {
      if (current.length > 0) {
        history.back();
      }
      return current;
    });
  }, []);

  const top = stack.length > 0 ? stack[stack.length - 1] : null;

  return { stack, top, open, close };
}
