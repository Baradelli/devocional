import {
  type NotificationSettings,
  type ReminderPreferenceInput,
  reminderPreferenceInputSchema,
  type WhatsappRegisterInput,
  whatsappRegisterSchema,
  type WhatsappVerifyInput,
  whatsappVerifySchema,
} from '@devocional/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { ApiError } from '../api/client.js';
import {
  fetchNotificationSettings,
  registerWhatsapp,
  saveReminderPreference,
  verifyWhatsapp,
} from '../api/notifications.js';
import { disablePush, enablePush, isPushSupported } from '../push/subscribe.js';

type Status = 'loading' | 'ready' | 'error';

export function Settings() {
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

  if (status === 'loading') {
    return <p className="muted center">Carregando seus lembretes…</p>;
  }
  if (status === 'error' || !settings) {
    return <p className="center">Não foi possível carregar agora. Tente novamente.</p>;
  }

  return (
    <section className="settings">
      <h2 className="settings-title">Lembretes</h2>
      <ReminderForm settings={settings} onSaved={reload} />
      <PushSection settings={settings} onChanged={reload} />
      <WhatsappSection settings={settings} onChanged={reload} />
    </section>
  );
}

function ReminderForm({
  settings,
  onSaved,
}: {
  settings: NotificationSettings;
  onSaved: () => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ReminderPreferenceInput>({
    resolver: zodResolver(reminderPreferenceInputSchema),
    defaultValues: {
      localTime: settings.reminder?.localTime ?? '07:00',
      pushEnabled: settings.reminder?.pushEnabled ?? true,
      whatsappEnabled: settings.reminder?.whatsappEnabled ?? false,
    },
  });

  const submit = handleSubmit(async (values) => {
    setSaved(false);
    await saveReminderPreference(values);
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
      <label>
        Horário do lembrete
        <input type="time" {...register('localTime')} />
      </label>
      <label className="checkbox">
        <input type="checkbox" {...register('pushEnabled')} />
        Notificação no aparelho
      </label>
      <label className="checkbox">
        <input type="checkbox" {...register('whatsappEnabled')} />
        WhatsApp (precisa validar o número)
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando…' : 'Salvar lembrete'}
      </button>
      {saved && <p className="muted">Lembrete salvo.</p>}
    </form>
  );
}

function PushSection({
  settings,
  onChanged,
}: {
  settings: NotificationSettings;
  onChanged: () => Promise<void>;
}) {
  const [message, setMessage] = useState<string | null>(null);

  if (!isPushSupported()) {
    return (
      <div className="card">
        <p className="muted">
          Para receber no iPhone, adicione o app à tela de início e abra por lá.
        </p>
      </div>
    );
  }

  const activate = async () => {
    setMessage(null);
    const ok = await enablePush();
    setMessage(ok ? 'Notificações ativadas neste aparelho.' : 'Permissão negada.');
    await onChanged();
  };

  const deactivate = async () => {
    await disablePush();
    setMessage('Notificações desativadas neste aparelho.');
    await onChanged();
  };

  return (
    <div className="card">
      <p>
        Aparelhos com notificação: <strong>{settings.pushDevices}</strong>
      </p>
      <div className="settings-actions">
        <button type="button" onClick={() => void activate()}>
          Ativar neste aparelho
        </button>
        {settings.pushDevices > 0 && (
          <button type="button" className="link" onClick={() => void deactivate()}>
            Desativar
          </button>
        )}
      </div>
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
    <div className="card">
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
