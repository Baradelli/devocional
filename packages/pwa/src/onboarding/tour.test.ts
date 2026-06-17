import { describe, expect, it } from 'vitest';

import { TOUR_STEPS, TOUR_VERSION } from './tour.js';

describe('onboarding tour content', () => {
  it('has a positive version', () => {
    expect(TOUR_VERSION).toBeGreaterThan(0);
  });

  it('has steps with non-empty title and body', () => {
    expect(TOUR_STEPS.length).toBeGreaterThanOrEqual(8);
    for (const step of TOUR_STEPS) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      expect(step.body.trim().length).toBeGreaterThan(0);
    }
  });

  it('covers every required onboarding topic', () => {
    const corpus = TOUR_STEPS.map((s) => `${s.title} ${s.body}`.toLowerCase()).join(' ');
    for (const topic of [
      'bloco',
      'escutar',
      'oração',
      'anotaç',
      'árvore',
      'lembrete',
      'tela de início',
      'whatsapp',
    ]) {
      expect(corpus).toContain(topic);
    }
  });
});
