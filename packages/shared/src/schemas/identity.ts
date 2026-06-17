import { z } from 'zod';

/**
 * Schemas de identidade — fonte única de verdade (back + front).
 * Sem mensagens PT-BR aqui: a regra mora no schema; a mensagem exibida ao
 * fiel é mapeada na camada de apresentação (ver CLAUDE.md). Quando preciso,
 * usamos códigos neutros como `message` para o front traduzir.
 */

export const roleSchema = z.enum(['MEMBER', 'ADMIN']);
export type Role = z.infer<typeof roleSchema>;

export const inviteStatusSchema = z.enum(['PENDING', 'USED', 'REVOKED']);
export type InviteStatusValue = z.infer<typeof inviteStatusSchema>;

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const passwordSchema = z.string().min(8).max(200);

export const nameSchema = z.string().trim().min(1).max(120);

export const timezoneSchema = z
  .string()
  .min(1)
  .refine(isValidTimeZone, { message: 'invalid_timezone' });

export const inviteCodeSchema = z.string().trim().min(1).max(128);

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  inviteCode: inviteCodeSchema,
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  timezone: timezoneSchema,
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const createInviteRequestSchema = z.object({
  email: emailSchema.optional(),
  expiresInDays: z.number().int().positive().max(365).default(14),
});
export type CreateInviteRequest = z.infer<typeof createInviteRequestSchema>;

export const userPublicSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  timezone: z.string(),
  onboardingCompletedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type UserPublic = z.infer<typeof userPublicSchema>;

export const inviteSchema = z.object({
  id: z.string(),
  code: z.string(),
  email: z.string().nullable(),
  status: inviteStatusSchema,
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  usedAt: z.string().datetime().nullable(),
});
export type Invite = z.infer<typeof inviteSchema>;
