import type { BlockView, DevotionalView, PassageReference } from '@devocional/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { ApiError } from '../api/client.js';
import { createDevotional, getDevotional, updateDevotional } from '../api/content.js';
import { formatLong, todayISO } from '../lib/date.js';
import { Banner } from '../ui/Banner.js';
import { Button } from '../ui/Button.js';
import { Input, Textarea } from '../ui/controls.js';
import { Field } from '../ui/Field.js';
import { Panel } from '../ui/Panel.js';
import { Skeleton } from '../ui/Skeleton.js';
import { useToast } from '../ui/Toast.js';
import { MarkdownField } from './MarkdownField.js';
import { MediaUpload } from './MediaUpload.js';
import { PassagePicker } from './PassagePicker.js';

const formSchema = z.object({
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

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; passage: PassageReference | null };

function block<T extends BlockView['type']>(
  view: DevotionalView,
  type: T,
): Extract<BlockView, { type: T }> | undefined {
  return view.blocks.find((b) => b.type === type) as Extract<BlockView, { type: T }> | undefined;
}

function mediaIdFromUrl(url: string | null): string | undefined {
  return url ? (url.split('/').pop() ?? undefined) : undefined;
}

function scheduleText(date: string, today: string): string {
  if (date > today) {
    return `Será publicado automaticamente em ${formatLong(date, true)}.`;
  }
  return `Publicado em ${formatLong(date, true)}.`;
}

export function DevotionalEditor() {
  const { date: routeDate } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const today = todayISO();
  const isEdit = Boolean(routeDate);

  const [date, setDate] = useState(routeDate ?? searchParams.get('date') ?? '');
  const [load, setLoad] = useState<LoadState>(
    isEdit ? { kind: 'loading' } : { kind: 'ready', passage: null },
  );
  const [passage, setPassage] = useState<PassageReference | null>(null);
  const [media, setMedia] = useState<MediaIds>({});
  const [existing, setExisting] = useState<Record<keyof MediaIds, boolean>>({} as never);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { questions: ['', '', ''], actions: ['', '', ''] },
  });

  useEffect(() => {
    if (!isEdit || !routeDate) {
      return;
    }
    void getDevotional(routeDate).then(
      (view) => {
        const quote = block(view, 'QUOTE');
        const passageBlock = block(view, 'PASSAGE');
        const devotional = block(view, 'DEVOTIONAL');
        const prayer = block(view, 'PRAYER');
        const reflection = block(view, 'REFLECTION');

        reset({
          theme: view.theme ?? '',
          quoteText: quote?.text ?? '',
          devotionalText: devotional?.text ?? '',
          prayerText: prayer?.text ?? '',
          questions: (reflection?.questions ?? ['', '', '']) as [string, string, string],
          actions: (reflection?.actions ?? ['', '', '']) as [string, string, string],
        });

        setMedia({
          passageAudio: mediaIdFromUrl(passageBlock?.audioUrl ?? null),
          devotionalAudio: mediaIdFromUrl(devotional?.audioUrl ?? null),
          prayerAudio: mediaIdFromUrl(prayer?.audioUrl ?? null),
          prayerGif: mediaIdFromUrl(prayer?.gifUrl ?? null),
          prayerSound: mediaIdFromUrl(prayer?.soundUrl ?? null),
          reflectionAudio: mediaIdFromUrl(reflection?.audioUrl ?? null),
        });
        setExisting({
          passageAudio: Boolean(passageBlock?.audioUrl),
          devotionalAudio: Boolean(devotional?.audioUrl),
          prayerAudio: Boolean(prayer?.audioUrl),
          prayerGif: Boolean(prayer?.gifUrl),
          prayerSound: Boolean(prayer?.soundUrl),
          reflectionAudio: Boolean(reflection?.audioUrl),
        });

        setLoad({
          kind: 'ready',
          passage: passageBlock?.reference ?? null,
        });
      },
      () => setLoad({ kind: 'error' }),
    );
  }, [isEdit, routeDate, reset]);

  const setMediaId = (key: keyof MediaIds) => (id: string) =>
    setMedia((current) => ({ ...current, [key]: id }));

  const submit = handleSubmit(async (values) => {
    setError(null);
    if (!isEdit && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Escolha a data de publicação.');
      return;
    }
    if (!passage) {
      setError('Selecione uma passagem válida antes de salvar.');
      return;
    }

    const content = {
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
      if (isEdit && routeDate) {
        await updateDevotional(routeDate, content);
        toast(`Devocional de ${formatLong(routeDate)} atualizado.`);
      } else {
        await createDevotional({ date, ...content });
        toast(`Devocional de ${formatLong(date)} criado.`);
      }
      void navigate('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    }
  });

  if (load.kind === 'loading') {
    return (
      <Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton width="16rem" height="1.6rem" />
          <Skeleton height="6rem" />
          <Skeleton height="9rem" />
          <Skeleton height="6rem" />
        </div>
      </Panel>
    );
  }

  if (load.kind === 'error') {
    return (
      <Panel>
        <Banner kind="error">Não foi possível carregar este devocional.</Banner>
        <div>
          <Button variant="secondary" onClick={() => void navigate('/')}>
            Voltar à agenda
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">{isEdit ? 'Editar devocional' : 'Novo devocional'}</h1>
          <p className="page-head__sub">
            {isEdit && routeDate
              ? scheduleText(routeDate, today)
              : 'Monte o conteúdo do dia. A data define quando ele é publicado.'}
          </p>
        </div>
        <div className="page-head__actions">
          <Button variant="ghost" onClick={() => void navigate('/')}>
            Cancelar
          </Button>
        </div>
      </div>

      <form
        className="editor"
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <Panel title="Publicação">
          <div className="editor__row">
            {isEdit ? (
              <Field label="Data" hint="A data não muda na edição.">
                <Input value={routeDate} disabled />
              </Field>
            ) : (
              <Field label="Data de publicação" required>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            )}
            <Field label="Tema (opcional)">
              <Input type="text" placeholder="Ex.: Graça" {...register('theme')} />
            </Field>
          </div>
        </Panel>

        <Panel title="Frase de abertura">
          <Field
            label="Frase / versículo"
            error={errors.quoteText && 'Escreva a frase de abertura.'}
          >
            <Textarea rows={2} invalid={Boolean(errors.quoteText)} {...register('quoteText')} />
          </Field>
        </Panel>

        <Panel title="Passagem" hint="Referência canônica — o texto é montado na exibição.">
          <PassagePicker onChange={setPassage} initial={load.passage} />
          <MediaUpload
            label="Áudio da passagem (opcional)"
            type="AUDIO"
            accept="audio/*"
            hasExisting={existing.passageAudio}
            onUploaded={setMediaId('passageAudio')}
          />
        </Panel>

        <Panel title="Devocional">
          <MarkdownField
            label="Texto do devocional"
            hint="Markdown — títulos, listas, citações, ênfase. Imagens entram só pela mídia."
            error={errors.devotionalText ? 'Escreva o devocional.' : undefined}
            invalid={Boolean(errors.devotionalText)}
            value={watch('devotionalText') ?? ''}
            rows={10}
            textareaProps={register('devotionalText')}
          />
          <MediaUpload
            label="Áudio do devocional (opcional)"
            type="AUDIO"
            accept="audio/*"
            hasExisting={existing.devotionalAudio}
            onUploaded={setMediaId('devotionalAudio')}
          />
        </Panel>

        <Panel title="Oração">
          <MarkdownField
            label="Texto da oração"
            hint="Markdown — a oração também é renderizada na tela do fiel."
            error={errors.prayerText ? 'Escreva a oração.' : undefined}
            invalid={Boolean(errors.prayerText)}
            value={watch('prayerText') ?? ''}
            rows={8}
            textareaProps={register('prayerText')}
          />
          <MediaUpload
            label="Áudio da oração (opcional)"
            type="AUDIO"
            accept="audio/*"
            hasExisting={existing.prayerAudio}
            onUploaded={setMediaId('prayerAudio')}
          />
          <div className="editor__row">
            <MediaUpload
              label="Animação de fundo (gif)"
              type="GIF"
              accept="image/gif"
              hasExisting={existing.prayerGif}
              onUploaded={setMediaId('prayerGif')}
            />
            <MediaUpload
              label="Som de fundo"
              type="SOUND"
              accept="audio/*"
              hasExisting={existing.prayerSound}
              onUploaded={setMediaId('prayerSound')}
            />
          </div>
        </Panel>

        <Panel title="Reflexão" hint="Três perguntas e três ações.">
          <div className="editor__reflection">
            <div className="editor__list">
              <h4>Perguntas</h4>
              {[0, 1, 2].map((i) => (
                <Input
                  key={`q${i}`}
                  placeholder={`Pergunta ${i + 1}`}
                  invalid={Boolean(errors.questions)}
                  {...register(`questions.${i}`)}
                />
              ))}
              {errors.questions && <span className="field__error">Preencha as 3 perguntas.</span>}
            </div>
            <div className="editor__list">
              <h4>Ações</h4>
              {[0, 1, 2].map((i) => (
                <Input
                  key={`a${i}`}
                  placeholder={`Ação ${i + 1}`}
                  invalid={Boolean(errors.actions)}
                  {...register(`actions.${i}`)}
                />
              ))}
              {errors.actions && <span className="field__error">Preencha as 3 ações.</span>}
            </div>
          </div>
          <MediaUpload
            label="Áudio da reflexão (opcional)"
            type="AUDIO"
            accept="audio/*"
            hasExisting={existing.reflectionAudio}
            onUploaded={setMediaId('reflectionAudio')}
          />
        </Panel>

        {error && <Banner kind="error">{error}</Banner>}

        <div className="editor__footer">
          <span className="editor__schedule">
            {!isEdit && /^\d{4}-\d{2}-\d{2}$/.test(date)
              ? scheduleText(date, today)
              : !isEdit
                ? 'Escolha uma data para ver quando será publicado.'
                : scheduleText(routeDate!, today)}
          </span>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Salvar alterações' : 'Criar devocional'}
          </Button>
        </div>
      </form>
    </>
  );
}
