import { createHash, randomBytes } from 'node:crypto';

import type { InviteCodeGenerator, TokenGenerator } from '../../application/identity/ports.js';

/**
 * Token de sessão: 256 bits de entropia (base64url). Persistimos apenas o
 * hash SHA-256 — o token em claro vive só no cookie do cliente.
 */
export function createCryptoTokenGenerator(): TokenGenerator {
  return {
    generate: () => randomBytes(32).toString('base64url'),
    hash: (token) => createHash('sha256').update(token).digest('hex'),
  };
}

// Sem caracteres ambíguos (0/O, 1/I/L) — o admin compartilha o código manualmente.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 12;

export function createInviteCodeGenerator(): InviteCodeGenerator {
  return {
    generate() {
      const bytes = randomBytes(CODE_LENGTH);
      let code = '';
      for (const byte of bytes) {
        code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
      }
      return code;
    },
  };
}
