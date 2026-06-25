import { type LoginRequest, loginRequestSchema, type UserPublic } from '@devocional/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LuSparkles } from 'react-icons/lu';

import { login } from '../api/auth.js';
import { ApiError } from '../api/client.js';
import { Banner } from '../ui/Banner.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/controls.js';
import { Field } from '../ui/Field.js';
import { Panel } from '../ui/Panel.js';

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
    <div className="full-center">
      <Panel className="auth">
        <div className="auth__head">
          <div className="auth__mark" aria-hidden>
            <LuSparkles />
          </div>
          <h1>Devocional</h1>
          <p>Entre para montar o devocional do dia.</p>
        </div>
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <Field label="E-mail" error={errors.email && 'Informe um e-mail válido.'}>
            <Input
              type="email"
              autoComplete="username"
              invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </Field>
          <Field label="Senha" error={errors.password && 'Informe sua senha.'}>
            <Input
              type="password"
              autoComplete="current-password"
              invalid={Boolean(errors.password)}
              {...register('password')}
            />
          </Field>
          {serverError && <Banner kind="error">{serverError}</Banner>}
          <Button type="submit" block loading={isSubmitting}>
            Entrar
          </Button>
        </form>
      </Panel>
    </div>
  );
}
