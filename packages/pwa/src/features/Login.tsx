import { type LoginRequest, loginRequestSchema, type UserPublic } from '@devocional/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { login } from '../api/auth.js';
import { ApiError } from '../api/client.js';

export function Login({ onLoggedIn }: { onLoggedIn: (user: UserPublic) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({ resolver: zodResolver(loginRequestSchema) });
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      onLoggedIn(await login(values));
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Não foi possível entrar.');
    }
  });

  return (
    <div className="auth">
      <h1>Devocional</h1>
      <p className="muted">Entre para começar o dia.</p>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <label>
          E-mail
          <input type="email" autoComplete="username" {...register('email')} />
          {errors.email && <span className="field-error">Informe um e-mail válido.</span>}
        </label>
        <label>
          Senha
          <input type="password" autoComplete="current-password" {...register('password')} />
          {errors.password && <span className="field-error">Informe sua senha.</span>}
        </label>
        {serverError && <p className="form-error">{serverError}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="muted center">
        Tem um convite? <Link to="/register">Criar conta</Link>
      </p>
    </div>
  );
}
