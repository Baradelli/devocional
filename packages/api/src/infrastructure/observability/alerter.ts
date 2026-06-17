export type AlertSeverity = 'critical' | 'warning';

/**
 * Evento operacional digno de atenção do admin. `event` é um código estável
 * (inglês) para roteamento/filtragem; `message` é a descrição operacional.
 */
export interface AlertEvent {
  event: string;
  severity: AlertSeverity;
  message: string;
  context?: Record<string, unknown>;
  cause?: unknown;
}

/**
 * Canal único de alertas operacionais (não bolted-on, ver design §observabilidade).
 * Os jobs críticos e a sessão do WhatsApp emitem por aqui; o adapter é trocável
 * (log hoje; e-mail/WhatsApp ao admin depois) sem tocar nos call sites.
 */
export interface Alerter {
  alert(event: AlertEvent): void;
}

interface Logger {
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
}

/**
 * Alerter padrão: emite log estruturado com `alert: true` para que um coletor
 * (SIEM/log sink) possa rotear sem parsing. `critical` vira error; o resto warn.
 */
export function createLogAlerter(log: Logger): Alerter {
  return {
    alert({ event, severity, message, context, cause }) {
      const record = { alert: true, event, severity, ...context, err: cause };
      if (severity === 'critical') {
        log.error(record, message);
      } else {
        log.warn(record, message);
      }
    },
  };
}
