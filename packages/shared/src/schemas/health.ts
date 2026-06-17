import { z } from 'zod';

/**
 * Contrato de resposta do healthcheck da API. Fonte única de verdade:
 * o backend serializa com este schema e os frontends podem reusá-lo.
 * Tipos derivam por `z.infer` — sem divergência cliente/servidor.
 */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number().nonnegative(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
