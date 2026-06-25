export type DevotionalStatus = 'published' | 'scheduled' | 'pending';

const LABELS: Record<DevotionalStatus, string> = {
  published: 'Publicado',
  scheduled: 'Agendado',
  pending: 'Pendente',
};

/**
 * Deriva o status de exibição a partir da data e de publishedAt.
 * - publicado: já saiu (publishedAt preenchido);
 * - pendente: a data chegou mas o job ainda não publicou;
 * - agendado: data futura, aguardando o dia.
 */
export function deriveStatus(
  publishedAt: string | null,
  date: string,
  today: string,
): DevotionalStatus {
  if (publishedAt) {
    return 'published';
  }
  return date <= today ? 'pending' : 'scheduled';
}

export function StatusBadge({ status }: { status: DevotionalStatus }) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="badge__dot" aria-hidden />
      {LABELS[status]}
    </span>
  );
}
