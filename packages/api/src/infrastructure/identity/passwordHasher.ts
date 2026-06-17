import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import type { PasswordHasher } from '../../application/identity/ports.js';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Hasher de senha com scrypt do `node:crypto` — sem dependência nativa.
 * Formato armazenado: `scrypt$<saltHex>$<hashHex>`.
 */
export function createScryptPasswordHasher(): PasswordHasher {
  return {
    async hash(password) {
      const salt = randomBytes(SALT_LENGTH);
      const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
      return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
    },

    async verify(password, stored) {
      const [scheme, saltHex, hashHex] = stored.split('$');
      if (scheme !== 'scrypt' || !saltHex || !hashHex) {
        return false;
      }
      const salt = Buffer.from(saltHex, 'hex');
      const expected = Buffer.from(hashHex, 'hex');
      const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;
      return expected.length === derived.length && timingSafeEqual(expected, derived);
    },
  };
}
