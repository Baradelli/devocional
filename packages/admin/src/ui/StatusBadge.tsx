export type DevotionalStatus = 'published' | 'scheduled';

const LABELS: Record<DevotionalStatus, string> = {
  published: 'Publicado',
  scheduled: 'Agendado',
};

/**
 * Deriva o status de exibição a partir da data. A disponibilidade é por data:
 * - publicado: a data já chegou (date <= hoje);
 * - agendado: data futura, aguardando o dia.
 */
export function deriveStatus(date: string, today: string): DevotionalStatus {
  return date <= today ? 'published' : 'scheduled';
}

export function StatusBadge({ status }: { status: DevotionalStatus }) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="badge__dot" aria-hidden />
      {LABELS[status]}
    </span>
  );
}
