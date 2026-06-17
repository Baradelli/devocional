import { checkVerificationCode } from '../../domain/notifications/verification.js';
import { NotificationError } from './errors.js';
import type {
  Clock,
  CodeGenerator,
  WhatsappContactRepository,
  WhatsappVerificationSender,
} from './ports.js';

/** Janela de validade do código de verificação. */
const CODE_TTL_MINUTES = 15;

export interface RegisterWhatsappDeps {
  whatsapp: WhatsappContactRepository;
  codes: CodeGenerator;
  clock: Clock;
  sender: WhatsappVerificationSender;
}

/**
 * Registra o número e dispara o código de verificação. O número fica PENDING e
 * só recebe lembretes depois de confirmado (design §3). Best-effort no envio.
 */
export async function registerWhatsapp(
  deps: RegisterWhatsappDeps,
  userId: string,
  phone: string,
): Promise<void> {
  const code = deps.codes.generate();
  const codeExpiresAt = new Date(deps.clock.now().getTime() + CODE_TTL_MINUTES * 60 * 1000);
  await deps.whatsapp.register({ userId, phone, verificationCode: code, codeExpiresAt });
  await deps.sender.sendCode(phone, code);
}

export interface VerifyWhatsappDeps {
  whatsapp: WhatsappContactRepository;
  clock: Clock;
}

export async function verifyWhatsapp(
  deps: VerifyWhatsappDeps,
  userId: string,
  code: string,
): Promise<void> {
  const contact = await deps.whatsapp.findByUser(userId);
  if (!contact) {
    throw new NotificationError('WHATSAPP_NOT_REGISTERED');
  }
  if (contact.status === 'VERIFIED') {
    throw new NotificationError('ALREADY_VERIFIED');
  }

  const outcome = checkVerificationCode(
    { code: contact.verificationCode, expiresAt: contact.codeExpiresAt },
    code,
    deps.clock.now(),
  );
  if (outcome === 'EXPIRED') {
    throw new NotificationError('CODE_EXPIRED');
  }
  if (outcome !== 'OK') {
    throw new NotificationError('CODE_INVALID');
  }

  await deps.whatsapp.markVerified(userId, deps.clock.now());
}
