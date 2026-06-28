import {
  type NotificationSettings,
  type ReminderPreferenceInput,
  reminderPreferenceInputSchema,
  type UserPublic,
  type WhatsappRegisterInput,
  whatsappRegisterSchema,
  type WhatsappVerifyInput,
  whatsappVerifySchema,
} from '@devocional/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { LuArrowLeft, LuCheck, LuMoon, LuSun } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';

import { deleteAccount } from '../api/auth.js';
import { ApiError } from '../api/client.js';
import {
  fetchNotificationSettings,
  registerWhatsapp,
  saveReminderPreference,
  sendTestNotification,
  verifyWhatsapp,
} from '../api/notifications.js';
import { Checkbox } from '../components/Checkbox.js';
import { promptInstall, useCanInstall } from '../lib/installPrompt.js';
import {
  disablePush,
  enablePush,
  getPushStatus,
  type PushStatus,
  showLocalTestNotification,
} from '../push/subscribe.js';
import { applyTheme, readStoredTheme, type ThemeId, THEMES } from '../theme/theme.js';
import { APP_VERSION } from '../version.js';
import { readNoteToolbarEnabled, setNoteToolbarEnabled } from './note/noteToolbarPreference.js';

/** Contexto seguro (https ou localhost) é pré-requisito do navegador para SW,
 * instalação e push. IP da rede via http não conta. */
function isSecureContextAvailable(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext;
}

type Status = 'loading' | 'ready' | 'error';
type TabId = 'perfil' | 'lembretes' | 'conta';

const TABS: { id: TabId; label: string }[] = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'lembretes', label: 'Lembretes' },
  { id: 'conta', label: 'Conta' },
];

interface SettingsProps {
  user: UserPublic;
  initialTab?: TabId;
  onReviewOnboarding?: () => void;
  onAccountDeleted?: () => void;
  onLogout?: () => void;
}

export function Settings({
  user,
  initialTab = 'perfil',
  onReviewOnboarding,
  onAccountDeleted,
  onLogout,
}: SettingsProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const reload = () =>
    fetchNotificationSettings().then(
      (data) => {
        setSettings(data);
        setStatus('ready');
      },
      () => setStatus('error'),
    );

  useEffect(() => {
    void reload();
  }, []);

  return (
    <section className="screen screen--settings">
      <header className="topbar">
        <button
          type="button"
          className="topbar__icon"
          onClick={() => void navigate('/today')}
          aria-label="Voltar para hoje"
          data-onboard="settings-back"
        >
          <LuArrowLeft />
        </button>
        <span className="eyebrow">Configurações</span>
        <span className="topbar__icon" aria-hidden="true" />
      </header>

      <div className="segmented" role="tablist" aria-label="Seções das configurações">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`segmented__btn${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="settings">
        {tab === 'perfil' && <ProfileTab user={user} onReviewOnboarding={onReviewOnboarding} />}

        {tab === 'lembretes' && (
          <>
            {status === 'loading' && <p className="muted center">Carregando seus lembretes…</p>}
            {status === 'error' && (
              <p className="center">Não foi possível carregar agora. Tente novamente.</p>
            )}
            {status === 'ready' && settings && (
              <RemindersTab settings={settings} onChanged={reload} />
            )}
          </>
        )}

        {tab === 'conta' && <AccountTab onLogout={onLogout} onAccountDeleted={onAccountDeleted} />}
      </div>
    </section>
  );
}

function formatMemberSince(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

function ProfileTab({
  user,
  onReviewOnboarding,
}: {
  user: UserPublic;
  onReviewOnboarding?: () => void;
}) {
  const initial = user.name.trim().charAt(0).toUpperCase() || '·';

  return (
    <>
      <div className="card profile-card">
        <div className="profile-id">
          <span className="profile-avatar" aria-hidden="true">
            {initial}
          </span>
          <div className="profile-id__text">
            <p className="profile-name">{user.name}</p>
            <p className="muted">{user.email}</p>
          </div>
        </div>
        <dl className="profile-rows">
          <div className="profile-row">
            <dt>Membro desde</dt>
            <dd>{formatMemberSince(user.createdAt)}</dd>
          </div>
          <div className="profile-row">
            <dt>Fuso horário</dt>
            <dd>{user.timezone}</dd>
          </div>
          <div className="profile-row">
            <dt>Versão do app</dt>
            <dd>v{APP_VERSION}</dd>
          </div>
        </dl>
      </div>

      <InstallCard />

      {onReviewOnboarding && (
        <div className="card">
          <h3 className="card-title">Introdução guiada</h3>
          <p className="muted">Refaça o passo a passo de boas-vindas quando quiser.</p>
          <button type="button" className="link" onClick={onReviewOnboarding}>
            Repetir a introdução
          </button>
        </div>
      )}
    </>
  );
}

/** Botão de instalar na tela inicial. Só aparece quando o navegador ofereceu a
 * instalação (Android/Chrome em contexto seguro) — caso contrário, orienta. */
function InstallCard() {
  const canInstall = useCanInstall();
  const [done, setDone] = useState(false);

  if (done) {
    return null;
  }

  if (!canInstall) {
    if (!isSecureContextAvailable()) {
      return (
        <div className="card">
          <h3 className="card-title">Instalar na tela inicial</h3>
          <p className="muted">
            A instalação só fica disponível por uma conexão segura (https) ou em localhost. Você
            está abrindo por um endereço http da rede local.
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="card">
      <h3 className="card-title">Instalar na tela inicial</h3>
      <p className="muted">
        Instale o app para abrir mais rápido e receber as notificações dos lembretes.
      </p>
      <button
        type="button"
        onClick={() => {
          void promptInstall().then((accepted) => setDone(accepted));
        }}
      >
        Adicionar à tela inicial
      </button>
    </div>
  );
}

function RemindersTab({
  settings,
  onChanged,
}: {
  settings: NotificationSettings;
  onChanged: () => Promise<void>;
}) {
  return (
    <>
      <ReminderForm settings={settings} onSaved={onChanged} />
      <PushDeviceCard settings={settings} onChanged={onChanged} />
      <WhatsappSection settings={settings} onChanged={onChanged} />
    </>
  );
}

function AccountTab({
  onLogout,
  onAccountDeleted,
}: {
  onLogout?: () => void;
  onAccountDeleted?: () => void;
}) {
  return (
    <>
      <ThemeCard />
      <NoteToolbarCard />
      {onLogout && (
        <div className="card">
          <button type="button" className="link" onClick={onLogout}>
            Sair
          </button>
        </div>
      )}
      <DangerZone onAccountDeleted={onAccountDeleted} />
    </>
  );
}

function DangerZone({ onAccountDeleted }: { onAccountDeleted?: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setError(null);
    setDeleting(true);
    try {
      await deleteAccount();
      onAccountDeleted?.();
    } catch {
      setError('Não foi possível excluir agora. Tente novamente.');
      setDeleting(false);
    }
  };

  return (
    <div className="card danger">
      <h3 className="card-title">Excluir minha conta</h3>
      <p className="muted">
        Apaga permanentemente sua conta e todos os seus dados (anotações, streak, conquistas e
        lembretes). Esta ação não pode ser desfeita.
      </p>
      {confirming ? (
        <div className="settings-actions">
          <button
            type="button"
            className="danger-btn"
            disabled={deleting}
            onClick={() => void remove()}
          >
            {deleting ? 'Excluindo…' : 'Excluir definitivamente'}
          </button>
          <button
            type="button"
            className="link"
            disabled={deleting}
            onClick={() => setConfirming(false)}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button type="button" className="danger-btn" onClick={() => setConfirming(true)}>
          Excluir minha conta
        </button>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function ThemeCard() {
  const [current, setCurrent] = useState<ThemeId>(readStoredTheme);

  const choose = (id: ThemeId) => {
    setCurrent(id);
    applyTheme(id);
  };

  return (
    <div className="card">
      <h3 className="card-title">Tema</h3>
      <div className="theme-choice">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`theme-choice__btn${current === theme.id ? ' is-active' : ''}`}
            aria-pressed={current === theme.id}
            onClick={() => choose(theme.id)}
          >
            {theme.id === 'escuro' ? <LuMoon aria-hidden="true" /> : <LuSun aria-hidden="true" />}
            {theme.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Liga/desliga a barra fixa de blocos no editor de anotações (ligada por
 * padrão). Desligada, os blocos continuam acessíveis pelo menu "/". */
function NoteToolbarCard() {
  const [enabled, setEnabled] = useState<boolean>(readNoteToolbarEnabled);

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      setNoteToolbarEnabled(next);
      return next;
    });
  };

  return (
    <div className="card">
      <h3 className="card-title">Anotações</h3>
      <p className="muted">
        Mostra uma barra fixa no topo da anotação com os mesmos blocos do menu “/”. Desligada, use
        só o “/”.
      </p>
      <Checkbox checked={enabled} onChange={toggle} label="Mostrar a barra de blocos" />
    </div>
  );
}

/** Formulário só do horário (+ canal WhatsApp). O push deste aparelho é
 * controlado pelo PushDeviceCard, então `pushEnabled` é preservado do estado
 * atual ao salvar — nunca sobrescrito por este formulário. */
type ReminderFormValues = Omit<ReminderPreferenceInput, 'pushEnabled'>;

function ReminderForm({
  settings,
  onSaved,
}: {
  settings: NotificationSettings;
  onSaved: () => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const whatsappVerified = settings.whatsapp.status === 'VERIFIED';
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderPreferenceInputSchema.omit({ pushEnabled: true })),
    defaultValues: {
      localTime: settings.reminder?.localTime ?? '07:00',
      whatsappEnabled: settings.reminder?.whatsappEnabled ?? false,
    },
  });

  const submit = handleSubmit(async (values) => {
    setSaved(false);
    await saveReminderPreference({
      localTime: values.localTime,
      // Preserva a escolha de push feita no cartão do aparelho.
      pushEnabled: settings.reminder?.pushEnabled ?? false,
      whatsappEnabled: whatsappVerified ? values.whatsappEnabled : false,
    });
    setSaved(true);
    await onSaved();
  });

  return (
    <form
      className="card"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <h3 className="card-title">Horário do lembrete</h3>
      <label data-onboard="settings-reminder-time">
        <span>Receber todo dia às</span>
        <input type="time" {...register('localTime')} />
      </label>
      <Checkbox
        disabled={!whatsappVerified}
        label="Avisar também pelo WhatsApp"
        {...register('whatsappEnabled')}
      />
      {!whatsappVerified && (
        <p className="muted">Valide seu número de WhatsApp abaixo para ativar este canal.</p>
      )}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando…' : 'Salvar horário'}
      </button>
      {saved && <p className="muted">Horário salvo.</p>}
    </form>
  );
}

const PUSH_STATUS_COPY: Record<PushStatus, { badge: string; tone: string }> = {
  unsupported: { badge: 'Indisponível', tone: 'off' },
  default: { badge: 'Desativada', tone: 'off' },
  'granted-unsubscribed': { badge: 'Desativada', tone: 'off' },
  'granted-subscribed': { badge: 'Ativada', tone: 'ok' },
  denied: { badge: 'Bloqueada', tone: 'denied' },
};

/** Estado real do push neste aparelho + ações + testes. Unifica o antigo
 * checkbox "pushEnabled" com o "ativar aparelho": ativar aqui já liga o canal. */
function PushDeviceCard({
  settings,
  onChanged,
}: {
  settings: NotificationSettings;
  onChanged: () => Promise<void>;
}) {
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const refresh = () => getPushStatus().then(setPushStatus);

  useEffect(() => {
    void refresh();
  }, []);

  const activate = async () => {
    setBusy(true);
    setMessage(null);
    const ok = await enablePush();
    if (ok) {
      await saveReminderPreference({
        localTime: settings.reminder?.localTime ?? '07:00',
        pushEnabled: true,
        whatsappEnabled: settings.reminder?.whatsappEnabled ?? false,
      });
      setMessage('Notificações ativadas neste aparelho.');
    } else {
      setMessage('Não foi possível ativar. Verifique a permissão do navegador.');
    }
    await refresh();
    await onChanged();
    setBusy(false);
  };

  const deactivate = async () => {
    setBusy(true);
    setMessage(null);
    await disablePush();
    setMessage('Notificações desativadas neste aparelho.');
    await refresh();
    await onChanged();
    setBusy(false);
  };

  const testLocal = async () => {
    setTestMsg(null);
    const ok = await showLocalTestNotification();
    setTestMsg(
      ok ? 'Notificação de teste enviada — veja na tela.' : 'Ative as notificações primeiro.',
    );
  };

  const testReal = async () => {
    setTestMsg('Enviando teste pelo servidor…');
    try {
      const { delivered } = await sendTestNotification();
      setTestMsg(
        delivered > 0
          ? `Teste enviado para ${String(delivered)} aparelho(s). Se chegou, seus lembretes vão chegar.`
          : 'Nenhum aparelho inscrito recebeu. Ative as notificações neste aparelho.',
      );
    } catch {
      setTestMsg('Não foi possível enviar o teste pelo servidor. Tente novamente.');
    }
  };

  const renderBody = () => {
    if (pushStatus === null) {
      return <p className="muted">Verificando este aparelho…</p>;
    }
    if (pushStatus === 'unsupported') {
      if (!isSecureContextAvailable()) {
        return (
          <p className="muted">
            Para autorizar notificações, abra o app por uma conexão segura (https) ou instalado na
            tela inicial. Pelo endereço http da rede local o navegador não permite.
          </p>
        );
      }
      return (
        <p className="muted">
          Para receber no iPhone, adicione o app à tela de início e abra por lá.
        </p>
      );
    }
    if (pushStatus === 'denied') {
      return (
        <p className="muted">
          As notificações estão bloqueadas pelo navegador. Reative nas configurações do site (ou do
          sistema) e volte aqui.
        </p>
      );
    }
    if (pushStatus === 'granted-subscribed') {
      return (
        <>
          <p className="muted">
            Este aparelho está recebendo.{' '}
            {settings.pushDevices > 1 ? `${String(settings.pushDevices)} aparelhos no total.` : ''}
          </p>
          <div className="settings-actions">
            <button type="button" className="btn-soft" onClick={() => void testLocal()}>
              Testar neste aparelho
            </button>
            <button type="button" onClick={() => void testReal()}>
              Enviar teste real
            </button>
            <button
              type="button"
              className="link"
              disabled={busy}
              onClick={() => void deactivate()}
            >
              Desativar
            </button>
          </div>
          {testMsg && <p className="muted">{testMsg}</p>}
        </>
      );
    }
    // default | granted-unsubscribed
    return (
      <>
        <p className="muted">Ative para receber o lembrete diário como notificação aqui.</p>
        <button type="button" disabled={busy} onClick={() => void activate()}>
          {busy ? 'Ativando…' : 'Ativar neste aparelho'}
        </button>
      </>
    );
  };

  const tone = pushStatus ? PUSH_STATUS_COPY[pushStatus].tone : 'off';
  const badge = pushStatus ? PUSH_STATUS_COPY[pushStatus].badge : '…';

  return (
    <div className="card">
      <div className="card-head">
        <h3 className="card-title">Notificação neste aparelho</h3>
        <span className={`push-badge push-badge--${tone}`}>
          {tone === 'ok' && <LuCheck aria-hidden="true" />}
          {badge}
        </span>
      </div>
      {renderBody()}
      {message && <p className="muted">{message}</p>}
    </div>
  );
}

function WhatsappSection({
  settings,
  onChanged,
}: {
  settings: NotificationSettings;
  onChanged: () => Promise<void>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const registerForm = useForm<WhatsappRegisterInput>({
    resolver: zodResolver(whatsappRegisterSchema),
    defaultValues: { phone: settings.whatsapp.phone ?? '' },
  });
  const verifyForm = useForm<WhatsappVerifyInput>({ resolver: zodResolver(whatsappVerifySchema) });

  const submitRegister = registerForm.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerWhatsapp(values);
      await onChanged();
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Não foi possível enviar o código.',
      );
    }
  });

  const submitVerify = verifyForm.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await verifyWhatsapp(values);
      await onChanged();
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Não foi possível validar.');
    }
  });

  return (
    <div className="card" data-onboard="settings-whatsapp">
      <h3 className="card-title">WhatsApp</h3>
      {settings.whatsapp.status === 'VERIFIED' ? (
        <p className="muted">Número validado: {settings.whatsapp.phone}</p>
      ) : (
        <>
          <form
            onSubmit={(event) => {
              void submitRegister(event);
            }}
          >
            <label>
              Número (com DDI)
              <input type="tel" placeholder="+5511999998888" {...registerForm.register('phone')} />
              {registerForm.formState.errors.phone && (
                <span className="field-error">Use o formato +5511999998888.</span>
              )}
            </label>
            <button type="submit" disabled={registerForm.formState.isSubmitting}>
              {settings.whatsapp.status === 'PENDING' ? 'Reenviar código' : 'Enviar código'}
            </button>
          </form>

          {settings.whatsapp.status === 'PENDING' && (
            <form
              onSubmit={(event) => {
                void submitVerify(event);
              }}
            >
              <label>
                Código recebido
                <input inputMode="numeric" {...verifyForm.register('code')} />
                {verifyForm.formState.errors.code && (
                  <span className="field-error">Informe o código.</span>
                )}
              </label>
              <button type="submit" disabled={verifyForm.formState.isSubmitting}>
                Validar número
              </button>
            </form>
          )}
        </>
      )}
      {serverError && <p className="form-error">{serverError}</p>}
    </div>
  );
}
