import { type CreateDevotionalRequest, type PassageReference } from '@devocional/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ApiError } from '../api/client.js';
import { createDevotional } from '../api/content.js';
import { MediaUpload } from './MediaUpload.js';
import { PassagePicker } from './PassagePicker.js';

// Schema do formulário (presentação). O contrato canônico é
// `createDevotionalSchema` no pacote compartilhado, revalidado no backend.
const formSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.'),
  theme: z.string().optional(),
  quoteText: z.string().trim().min(1),
  devotionalText: z.string().trim().min(1),
  prayerText: z.string().trim().min(1),
  questions: z.array(z.string().trim().min(1)).length(3),
  actions: z.array(z.string().trim().min(1)).length(3),
});
type FormValues = z.infer<typeof formSchema>;

interface MediaIds {
  passageAudio?: string;
  devotionalAudio?: string;
  prayerAudio?: string;
  prayerGif?: string;
  prayerSound?: string;
  reflectionAudio?: string;
}

export function DevotionalForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { questions: ['', '', ''], actions: ['', '', ''] },
  });

  const [passage, setPassage] = useState<PassageReference | null>(null);
  const [media, setMedia] = useState<MediaIds>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setMediaId = (key: keyof MediaIds) => (id: string) =>
    setMedia((current) => ({ ...current, [key]: id }));

  const submit = handleSubmit(async (values) => {
    setMessage(null);
    setError(null);
    if (!passage) {
      setError('Selecione uma passagem válida antes de salvar.');
      return;
    }

    const payload: CreateDevotionalRequest = {
      date: values.date,
      ...(values.theme?.trim() ? { theme: values.theme.trim() } : {}),
      quote: { text: values.quoteText },
      passage: {
        reference: passage,
        ...(media.passageAudio && { audioMediaId: media.passageAudio }),
      },
      devotional: {
        text: values.devotionalText,
        ...(media.devotionalAudio && { audioMediaId: media.devotionalAudio }),
      },
      prayer: {
        text: values.prayerText,
        ...(media.prayerAudio && { audioMediaId: media.prayerAudio }),
        ...(media.prayerGif && { gifMediaId: media.prayerGif }),
        ...(media.prayerSound && { soundMediaId: media.prayerSound }),
      },
      reflection: {
        questions: values.questions,
        actions: values.actions,
        ...(media.reflectionAudio && { audioMediaId: media.reflectionAudio }),
      },
    };

    try {
      const summary = await createDevotional(payload);
      setMessage(`Devocional de ${summary.date} salvo.`);
      reset();
      setMedia({});
      setPassage(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    }
  });

  return (
    <form
      className="devotional-form"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <h2>Montar devocional</h2>

      <div className="row">
        <label>
          Data
          <input type="date" {...register('date')} />
          {errors.date && <span className="field-error">{errors.date.message}</span>}
        </label>
        <label>
          Tema (opcional)
          <input type="text" {...register('theme')} />
        </label>
      </div>

      <fieldset>
        <legend>Frase / versículo de abertura</legend>
        <textarea rows={2} {...register('quoteText')} />
        {errors.quoteText && <span className="field-error">Escreva a frase de abertura.</span>}
      </fieldset>

      <fieldset>
        <legend>Passagem</legend>
        <PassagePicker onChange={setPassage} />
        <MediaUpload
          label="Áudio da passagem (opcional)"
          type="AUDIO"
          accept="audio/*"
          onUploaded={setMediaId('passageAudio')}
        />
      </fieldset>

      <fieldset>
        <legend>Devocional</legend>
        <textarea rows={6} {...register('devotionalText')} />
        {errors.devotionalText && <span className="field-error">Escreva o devocional.</span>}
        <MediaUpload
          label="Áudio do devocional (opcional)"
          type="AUDIO"
          accept="audio/*"
          onUploaded={setMediaId('devotionalAudio')}
        />
      </fieldset>

      <fieldset>
        <legend>Oração</legend>
        <textarea rows={4} {...register('prayerText')} />
        {errors.prayerText && <span className="field-error">Escreva a oração.</span>}
        <MediaUpload
          label="Áudio da oração (opcional)"
          type="AUDIO"
          accept="audio/*"
          onUploaded={setMediaId('prayerAudio')}
        />
        <MediaUpload
          label="Animação de fundo (gif)"
          type="GIF"
          accept="image/gif"
          onUploaded={setMediaId('prayerGif')}
        />
        <MediaUpload
          label="Som de fundo"
          type="SOUND"
          accept="audio/*"
          onUploaded={setMediaId('prayerSound')}
        />
      </fieldset>

      <fieldset>
        <legend>Reflexão — 3 perguntas e 3 ações</legend>
        {[0, 1, 2].map((i) => (
          <input key={`q${i}`} placeholder={`Pergunta ${i + 1}`} {...register(`questions.${i}`)} />
        ))}
        {errors.questions && <span className="field-error">Preencha as 3 perguntas.</span>}
        {[0, 1, 2].map((i) => (
          <input key={`a${i}`} placeholder={`Ação ${i + 1}`} {...register(`actions.${i}`)} />
        ))}
        {errors.actions && <span className="field-error">Preencha as 3 ações.</span>}
        <MediaUpload
          label="Áudio da reflexão (opcional)"
          type="AUDIO"
          accept="audio/*"
          onUploaded={setMediaId('reflectionAudio')}
        />
      </fieldset>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-ok">{message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando…' : 'Salvar devocional'}
      </button>
    </form>
  );
}
