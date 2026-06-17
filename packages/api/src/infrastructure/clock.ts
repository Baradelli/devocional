import type { Clock } from '../application/identity/ports.js';

export function createSystemClock(): Clock {
  return { now: () => new Date() };
}
