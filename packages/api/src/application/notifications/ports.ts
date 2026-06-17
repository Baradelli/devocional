import type { WhatsappStatusValue } from '@devocional/shared';

export interface Clock {
  now(): Date;
}

export interface CodeGenerator {
  /** Código numérico curto para verificação por WhatsApp. */
  generate(): string;
}

/** Alvo de Web Push (uma inscrição de device). */
export interface PushSubscriptionTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface SavePushSubscriptionInput {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  label: string | null;
}

export interface PushSubscriptionRepository {
  upsert(input: SavePushSubscriptionInput): Promise<void>;
  removeByEndpoint(userId: string, endpoint: string): Promise<void>;
  listByUser(userId: string): Promise<PushSubscriptionTarget[]>;
  countByUser(userId: string): Promise<number>;
}

export interface WhatsappContactRecord {
  phone: string;
  status: WhatsappStatusValue;
  verificationCode: string | null;
  codeExpiresAt: Date | null;
}

export interface RegisterWhatsappData {
  userId: string;
  phone: string;
  verificationCode: string;
  codeExpiresAt: Date;
}

export interface WhatsappContactRepository {
  register(data: RegisterWhatsappData): Promise<void>;
  findByUser(userId: string): Promise<WhatsappContactRecord | null>;
  markVerified(userId: string, verifiedAt: Date): Promise<void>;
}

export interface ReminderPreferenceData {
  userId: string;
  localTime: string;
  pushEnabled: boolean;
  whatsappEnabled: boolean;
}

export interface ReminderPreferenceRecord {
  localTime: string;
  pushEnabled: boolean;
  whatsappEnabled: boolean;
}

/** Candidato a lembrete: preferência + fuso, para a decisão de disparo. */
export interface ReminderCandidate {
  userId: string;
  timezone: string;
  localTime: string;
  pushEnabled: boolean;
  whatsappEnabled: boolean;
  lastSentLogicalDate: string | null;
}

export interface ReminderPreferenceRepository {
  upsert(data: ReminderPreferenceData): Promise<void>;
  findByUser(userId: string): Promise<ReminderPreferenceRecord | null>;
  listCandidates(): Promise<ReminderCandidate[]>;
  markSent(userId: string, logicalDate: string): Promise<void>;
}

export interface NotificationRepositories {
  push: PushSubscriptionRepository;
  whatsapp: WhatsappContactRepository;
  reminders: ReminderPreferenceRepository;
}

/** Conteúdo (PT-BR) de um lembrete. */
export interface ReminderPayload {
  title: string;
  body: string;
  url: string;
}

/** Alvos de entrega de um usuário, agregados para os canais. */
export interface ChannelTargets {
  pushSubscriptions: PushSubscriptionTarget[];
  whatsappPhone: string | null;
}

export type ChannelKey = 'WEB_PUSH' | 'WHATSAPP';

/**
 * Canal de entrega best-effort (ADR-002/005). NUNCA lança: devolve quantos
 * destinos receberam. Web Push e WhatsApp são adapters intercambiáveis.
 */
export interface NotificationChannel {
  readonly key: ChannelKey;
  deliver(targets: ChannelTargets, payload: ReminderPayload): Promise<{ delivered: number }>;
}

/** Envia o código de verificação ao número informado (best-effort). */
export interface WhatsappVerificationSender {
  sendCode(phone: string, code: string): Promise<void>;
}

export interface ReminderContentProvider {
  build(logicalDate: string): ReminderPayload;
}
