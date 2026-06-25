import { type RegisterRequest, registerRequestSchema, type UserPublic } from '@devocional/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';

import { register as registerAccount } from '../api/auth.js';
import { ApiError } from '../api/client.js';

// Fuso do dispositivo: o servidor é a autoridade do dia/streak, então capturamos
// o timezone do navegador no cadastro para ele reconciliar corretamente.
const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function Register({ onRegistered }: { onRegistered: (user: UserPublic) => void }) {
  const [params] = useSearchParams();
  const codeFromLink = params.get('code') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: { inviteCode: codeFromLink, timezone: deviceTimezone },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      onRegistered(await registerAccount(values));
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Não foi possível criar sua conta.',
      );
    }
  });

  return (
    <div className="auth">
      <h1>Criar conta</h1>
      <p className="muted">Você precisa de um convite para entrar.</p>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <label>
          Código do convite
          <input type="text" autoComplete="off" {...register('inviteCode')} />
          {errors.inviteCode && <span className="field-error">Informe o código do convite.</span>}
        </label>
        <label>
          Nome
          <input type="text" autoComplete="name" {...register('name')} />
          {errors.name && <span className="field-error">Informe seu nome.</span>}
        </label>
        <label>
          E-mail
          <input type="email" autoComplete="username" {...register('email')} />
          {errors.email && <span className="field-error">Informe um e-mail válido.</span>}
        </label>
        <label>
          Senha
          <input type="password" autoComplete="new-password" {...register('password')} />
          {errors.password && (
            <span className="field-error">Use uma senha de pelo menos 8 caracteres.</span>
          )}
        </label>
        {serverError && <p className="form-error">{serverError}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando…' : 'Criar conta'}
        </button>
      </form>
      <p className="muted center">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
