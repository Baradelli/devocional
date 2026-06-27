import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';

import { TreeCanvas } from './TreeCanvas.js';

/**
 * A TreeCanvas é uma função pura (sem hooks): construímos a árvore para toda a
 * faixa de crescimento e garantimos que o port procedural não lança nem produz
 * SVG inválido. Sem DOM — só verifica a árvore de elementos React.
 */
describe('TreeCanvas', () => {
  const samples = [-2, 0, 0.5, 1, 1.6, 2.2, 3.3, 4.3, 5.5, 6, 9];

  it('renders a valid <svg> across the whole growth range', () => {
    for (const growth of samples) {
      const el = TreeCanvas({ growth });
      expect(isValidElement(el)).toBe(true);
      expect((el as { type?: unknown }).type).toBe('svg');
    }
  });

  it('builds without throwing with and without wind/celebration', () => {
    expect(() => TreeCanvas({ growth: 3, wind: false })).not.toThrow();
    expect(() => TreeCanvas({ growth: 6, celebrating: true })).not.toThrow();
  });
});
