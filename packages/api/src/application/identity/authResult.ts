import type { SessionRecord, UserRecord } from './ports.js';

/** Resultado de uma autenticação bem-sucedida (registro ou login). */
export interface AuthResult {
  user: UserRecord;
  session: SessionRecord;
  /** Token em claro — vai para o cookie; nunca é persistido (guardamos só o hash). */
  rawToken: string;
}
