import { useCallback, useEffect, useRef, useState } from 'react';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export interface GrowthAnimation {
  /** Valor de crescimento atual (0→6) para renderizar a árvore. */
  growth: number;
  /** Define o valor instantaneamente (sem animar). */
  set: (value: number) => void;
  /** Anima do valor atual até `target`; chama `onDone` ao assentar. */
  animateTo: (target: number, durationMs: number, onDone?: () => void) => void;
  /** True se o ambiente pede movimento reduzido (anima em saltos). */
  reduced: boolean;
}

/**
 * Motor de crescimento da árvore (ADR-012): interpola `growth` com requestAnimationFrame
 * e easing, respeitando prefers-reduced-motion. Inclui uma rede de segurança por timeout
 * para assentar no alvo mesmo se o rAF for estrangulado (aba inativa).
 */
export function useGrowthAnimation(initial = 0): GrowthAnimation {
  const [growth, setGrowth] = useState(initial);
  const currentRef = useRef(initial);
  const rafRef = useRef(0);
  const safetyRef = useRef(0);
  const reduced = prefersReducedMotion();

  const cancel = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = 0;
    }
  }, []);

  const commit = useCallback((value: number) => {
    currentRef.current = value;
    setGrowth(value);
  }, []);

  const set = useCallback(
    (value: number) => {
      cancel();
      commit(value);
    },
    [cancel, commit],
  );

  const animateTo = useCallback(
    (target: number, durationMs: number, onDone?: () => void) => {
      cancel();
      if (reduced || durationMs <= 0) {
        commit(target);
        onDone?.();
        return;
      }
      const from = currentRef.current;
      const start = performance.now();
      let settled = false;
      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        cancel();
        commit(target);
        onDone?.();
      };
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        commit(from + (target - from) * easeOutCubic(t));
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          finish();
        }
      };
      rafRef.current = requestAnimationFrame(step);
      safetyRef.current = window.setTimeout(finish, durationMs + 500);
    },
    [cancel, commit, reduced],
  );

  useEffect(() => cancel, [cancel]);

  return { growth, set, animateTo, reduced };
}
