import {
  type CreateInviteRequest,
  createInviteRequestSchema,
  type Invite,
} from '@devocional/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { ApiError } from '../api/client.js';
import { createInvite, listInvites, revokeInvite } from '../api/identity.js';
import { formatLong } from '../lib/date.js';
import { Banner } from '../ui/Banner.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/controls.js';
import { Field } from '../ui/Field.js';
import { Modal } from '../ui/Modal.js';
import { Panel } from '../ui/Panel.js';
import { Skeleton } from '../ui/Skeleton.js';
import { useToast } from '../ui/Toast.js';

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; invites: Invite[] };

type InviteView = 'pendente' | 'usado' | 'expirado' | 'revogado';

const VIEW_LABELS: Record<InviteView, string> = {
  pendente: 'Pendente',
  usado: 'Usado',
  expirado: 'Expirado',
  revogado: 'Revogado',
};

function inviteView(invite: Invite, now: number): InviteView {
  if (invite.status === 'USED') return 'usado';
  if (invite.status === 'REVOKED') return 'revogado';
  if (new Date(invite.expiresAt).getTime() <= now) return 'expirado';
  return 'pendente';
}

export function InvitesScreen() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  function load() {
    setState({ kind: 'loading' });
    void listInvites().then(
      (invites) => setState({ kind: 'ready', invites }),
      () => setState({ kind: 'error' }),
    );
  }

  useEffect(load, []);

  const onCreated = (invite: Invite) => {
    setState((current) =>
      current.kind === 'ready' ? { kind: 'ready', invites: [invite, ...current.invites] } : current,
    );
  };

  const onRevoked = (revoked: Invite) => {
    setState((current) =>
      current.kind === 'ready'
        ? {
            kind: 'ready',
            invites: current.invites.map((i) => (i.id === revoked.id ? revoked : i)),
          }
        : current,
    );
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Convites</h1>
          <p className="page-head__sub">
            Gere um link de convite para um novo membro. Cadastro só acontece com convite válido.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
        <CreateInviteForm onCreated={onCreated} />

        {state.kind === 'error' && (
          <Panel>
            <Banner kind="error">Não foi possível carregar os convites.</Banner>
            <div>
              <Button variant="secondary" size="sm" onClick={load}>
                Tentar de novo
              </Button>
            </div>
          </Panel>
        )}

        {state.kind === 'loading' && (
          <Panel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height="2.6rem" />
              ))}
            </div>
          </Panel>
        )}

        {state.kind === 'ready' && <InvitesTable invites={state.invites} onRevoked={onRevoked} />}
      </div>
    </>
  );
}

function CreateInviteForm({ onCreated }: { onCreated: (invite: Invite) => void }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInviteRequest>({
    resolver: zodResolver(createInviteRequestSchema),
    defaultValues: { expiresInDays: 1 },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const invite = await createInvite(values);
      onCreated(invite);
      reset({ email: undefined, expiresInDays: 1 });
      toast('Convite criado.');
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Não foi possível criar o convite.',
      );
    }
  });

  return (
    <Panel title="Novo convite">
      <form
        className="invite-form"
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <Field
          label="E-mail (opcional)"
          hint="Se informado, o cadastro só aceita esse e-mail."
          error={errors.email && 'Informe um e-mail válido ou deixe em branco.'}
        >
          <Input
            type="email"
            placeholder="convidado@exemplo.com"
            invalid={Boolean(errors.email)}
            {...register('email', { setValueAs: (v: string) => (v === '' ? undefined : v) })}
          />
        </Field>
        <Field label="Expira em (dias)" error={errors.expiresInDays && 'Use um número de 1 a 365.'}>
          <Input
            type="number"
            min={1}
            max={365}
            invalid={Boolean(errors.expiresInDays)}
            {...register('expiresInDays', { valueAsNumber: true })}
          />
        </Field>
        <div className="invite-form__action">
          <Button type="submit" loading={isSubmitting}>
            Gerar convite
          </Button>
        </div>
      </form>
      {serverError && <Banner kind="error">{serverError}</Banner>}
    </Panel>
  );
}

function InvitesTable({
  invites,
  onRevoked,
}: {
  invites: Invite[];
  onRevoked: (invite: Invite) => void;
}) {
  const toast = useToast();
  const now = Date.now();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (invites.length === 0) {
    return (
      <Panel>
        <div className="empty">
          <span className="empty__mark" aria-hidden>
            ✉️
          </span>
          <span className="empty__title">Nenhum convite ainda</span>
          <p>Gere o primeiro convite acima para liberar o cadastro de um novo membro.</p>
        </div>
      </Panel>
    );
  }

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copiado.`);
    } catch {
      toast('Não foi possível copiar.', 'error');
    }
  };

  const revoke = async (invite: Invite) => {
    setBusyId(invite.id);
    try {
      onRevoked(await revokeInvite(invite.id));
      toast('Convite cancelado.');
    } catch (error) {
      toast(error instanceof ApiError ? error.message : 'Não foi possível cancelar.', 'error');
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  const confirming = invites.find((invite) => invite.id === confirmingId) ?? null;

  return (
    <Panel>
      <table className="dev-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Status</th>
            <th>E-mail / Quem usou</th>
            <th>Expira</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => {
            const view = inviteView(invite, now);
            return (
              <tr key={invite.id}>
                <td className="dev-row__date">
                  <code>{invite.code}</code>
                </td>
                <td>
                  <span className={`badge badge--invite-${view}`}>
                    <span className="badge__dot" aria-hidden />
                    {VIEW_LABELS[view]}
                  </span>
                </td>
                <td className="dev-row__theme">
                  {invite.usedBy ? (
                    <span title={invite.usedBy.email}>
                      {invite.usedBy.name} <span className="muted">({invite.usedBy.email})</span>
                    </span>
                  ) : (
                    (invite.email ?? '—')
                  )}
                </td>
                <td className="dev-row__weekday">
                  {formatLong(invite.expiresAt.slice(0, 10), true)}
                </td>
                <td>
                  <div className="invite-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Copiar link"
                      aria-label="Copiar link"
                      onClick={() => void copy(invite.registerUrl, 'Link')}
                    >
                      🔗
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Copiar código"
                      aria-label="Copiar código"
                      onClick={() => void copy(invite.code, 'Código')}
                    >
                      📋
                    </button>
                    {invite.status === 'PENDING' && (
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        title="Cancelar convite"
                        aria-label="Cancelar convite"
                        onClick={() => setConfirmingId(invite.id)}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {confirming && (
        <Modal
          title="Cancelar convite"
          onClose={() => setConfirmingId(null)}
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingId(null)}>
                Voltar
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={busyId === confirming.id}
                onClick={() => void revoke(confirming)}
              >
                Sim, cancelar
              </Button>
            </>
          }
        >
          O convite <code>{confirming.code}</code> deixará de funcionar e não poderá mais ser usado
          para cadastro. Esta ação não pode ser desfeita.
        </Modal>
      )}
    </Panel>
  );
}
