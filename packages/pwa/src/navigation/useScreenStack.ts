import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface OverlayState<T> {
  overlays?: T[];
}

/**
 * Pilha de telas sobrepostas (estações da jornada) montada sobre o histórico do
 * React Router: abrir empilha uma entrada na MESMA URL guardando a pilha em
 * `location.state`. Fechar pela UI e o botão voltar do device usam `navigate(-1)`,
 * então sempre voltam à tela de origem (ex.: /today) sem brigar com o roteador.
 */
export function useScreenStack<T extends string>() {
  const navigate = useNavigate();
  const location = useLocation();
  const stack = (location.state as OverlayState<T> | null)?.overlays ?? [];
  const top = stack.length > 0 ? stack[stack.length - 1]! : null;

  // Trava o scroll do fundo enquanto há overlay aberto.
  useEffect(() => {
    document.documentElement.style.overflow = stack.length > 0 ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [stack.length]);

  const open = useCallback(
    (name: T) => {
      void navigate(location.pathname, { state: { overlays: [...stack, name] } });
    },
    [navigate, location.pathname, stack],
  );

  const close = useCallback(() => {
    void navigate(-1);
  }, [navigate]);

  return { stack, top, open, close };
}
