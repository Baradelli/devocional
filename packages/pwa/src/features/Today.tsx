import type {
  BlockView,
  DevotionalView,
  ProgressSnapshot,
  StreakStateView,
} from '@devocional/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { ApiError } from '../api/client.js';
import { fetchToday } from '../api/devotional.js';
import { fetchCalendar, fetchProgress } from '../api/progress.js';
import { GardenIcon, PencilIcon, SettingsIcon } from '../components/icons.js';
import { WeekStrip } from '../components/WeekStrip.js';
import { buildWeek, formatDateline, toMonthKey } from '../lib/dates.js';
import { useScreenStack } from '../navigation/useScreenStack.js';
import { localStorageQueue } from '../offline/queue.js';
import { flushQueue } from '../offline/sync.js';
import { NoteEditorScreen } from './NoteEditorScreen.js';
import { CalendarScreen } from './today/CalendarScreen.js';
import { DevotionalScreen } from './today/DevotionalScreen.js';
import { PrayerScreen } from './today/PrayerScreen.js';
import { ReadingScreen } from './today/ReadingScreen.js';
import { ReflectionScreen } from './today/ReflectionScreen.js';
import { VerseScreen } from './today/VerseScreen.js';

type Status = 'loading' | 'ready' | 'empty' | 'error';
type Step = 'verse' | 'reading' | 'devotional' | 'prayer' | 'reflection';
type Overlay = Step | 'calendar' | 'note';

const STEP_ORDER: Step[] = ['verse', 'reading', 'devotional', 'prayer', 'reflection'];

interface TodayProps {
  onOpenGarden: () => void;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
}

function find<T extends BlockView['type']>(
  blocks: BlockView[],
  type: T,
): Extract<BlockView, { type: T }> | undefined {
  return blocks.find((b) => b.type === type) as Extract<BlockView, { type: T }> | undefined;
}

function firstHeading(markdown: string): string | null {
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      return line.slice(3);
    }
    if (line.startsWith('### ')) {
      return line.slice(4);
    }
  }
  return null;
}

interface StationDef {
  step: Step;
  kicker: string;
  title: string;
  meta: string;
  prayer?: boolean;
}

export function Today({ onOpenGarden, onOpenLibrary, onOpenSettings }: TodayProps) {
  const queue = useRef(localStorageQueue()).current;
  const today = useRef(new Date()).current;
  const [devotional, setDevotional] = useState<DevotionalView | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [done, setDone] = useState<Set<Step>>(new Set());
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [finished, setFinished] = useState(false);
  const [streak, setStreak] = useState<StreakStateView | null>(null);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const { top, open, close } = useScreenStack<Overlay>();
  const journeyRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    void fetchToday().then(
      (view) => {
        setDevotional(view);
        setStatus('ready');
      },
      (error: unknown) => {
        setStatus(error instanceof ApiError && error.status === 404 ? 'empty' : 'error');
      },
    );
    void fetchProgress().then(
      (p) => setStreak(p.streak),
      () => undefined,
    );
    void fetchCalendar(toMonthKey(today)).then(
      (c) => setCompletedDates(c.completedDates),
      () => undefined,
    );
    void flushQueue(queue).then(
      (s) => s && setSnapshot(s),
      () => undefined,
    );
  }, [queue, today]);

  useEffect(() => {
    const reconcile = () => {
      void flushQueue(queue).then(
        (s) => s && setSnapshot(s),
        () => undefined,
      );
    };
    window.addEventListener('online', reconcile);
    return () => window.removeEventListener('online', reconcile);
  }, [queue]);

  const blocks = devotional ? [...devotional.blocks].sort((a, b) => a.order - b.order) : [];
  const quote = find(blocks, 'QUOTE');
  const passage = find(blocks, 'PASSAGE');
  const devo = find(blocks, 'DEVOTIONAL');
  const prayer = find(blocks, 'PRAYER');
  const reflection = find(blocks, 'REFLECTION');

  const present: Record<Step, boolean> = {
    verse: !!quote,
    reading: !!passage,
    devotional: !!devo,
    prayer: !!prayer,
    reflection: !!reflection,
  };
  const steps = STEP_ORDER.filter((s) => present[s]);
  const currentStep = steps.find((s) => !done.has(s)) ?? null;
  const allDone = steps.length > 0 && steps.every((s) => done.has(s));

  // Haste viva: cresce até o centro do último nó concluído (ou até o fim ao finalizar).
  useLayoutEffect(() => {
    const j = journeyRef.current;
    if (!j) {
      return;
    }
    if (finished) {
      j.style.setProperty('--grown', `${String(j.offsetHeight - 42)}px`);
      return;
    }
    const nodes = j.querySelectorAll('.station.is-done .station__node');
    if (nodes.length === 0) {
      j.style.setProperty('--grown', '0px');
      return;
    }
    const lastNode = nodes[nodes.length - 1];
    if (!lastNode) {
      return;
    }
    const jTop = j.getBoundingClientRect().top;
    const last = lastNode.getBoundingClientRect();
    j.style.setProperty(
      '--grown',
      `${String(Math.max(0, last.top + last.height / 2 - jTop - 14))}px`,
    );
  }, [done, finished, status]);

  const markDone = (step: Step) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(step);
      return next;
    });
  };

  const finish = () => {
    queue.enqueue({ idempotencyKey: crypto.randomUUID(), completedAt: new Date().toISOString() });
    setFinished(true);
    void flushQueue(queue).then(
      (s) => s && setSnapshot(s),
      () => undefined,
    );
  };

  if (status === 'loading') {
    return <p className="muted center">Carregando o devocional de hoje…</p>;
  }
  if (status === 'empty') {
    return (
      <div className="center empty">
        <p>O devocional de hoje ainda não está disponível.</p>
        <p className="muted">Volte um pouco mais tarde — ele chega à meia-noite.</p>
      </div>
    );
  }
  if (status === 'error' || !devotional) {
    return <p className="center">Não foi possível carregar agora. Tente novamente.</p>;
  }

  const stationDefs: Record<Step, StationDef> = {
    verse: {
      step: 'verse',
      kicker: 'Para começar',
      title: 'A frase do dia',
      meta: 'uma palavra · 30s',
    },
    reading: {
      step: 'reading',
      kicker: 'Leitura bíblica',
      title: passage?.label ?? 'Leitura do dia',
      meta: passage
        ? `${String(Math.max(passage.verses.length, 1))} versículos · ler ou escutar`
        : 'ler ou escutar',
    },
    devotional: {
      step: 'devotional',
      kicker: 'Devocional',
      title: (devo && firstHeading(devo.text)) ?? devotional.theme ?? 'Devocional de hoje',
      meta: 'leitura · 2 min',
    },
    prayer: {
      step: 'prayer',
      kicker: 'Oração',
      title: 'Um momento de quietude',
      meta: 'imersivo · 2 min',
      prayer: true,
    },
    reflection: {
      step: 'reflection',
      kicker: 'Reflexão',
      title: 'Para refletir e praticar',
      meta: reflection
        ? `${String(reflection.questions.length)} perguntas · ${String(reflection.actions.length)} ações`
        : '',
    },
  };

  const week = buildWeek(today, completedDates);
  const finishStreak = snapshot?.streak.currentStreak ?? streak?.currentStreak;

  return (
    <>
      <section className="screen screen--home">
        <header className="topbar">
          <button
            type="button"
            className="topbar__icon"
            onClick={onOpenSettings}
            aria-label="Ajustes"
          >
            <SettingsIcon />
          </button>
          <span className="eyebrow">{formatDateline(today)}</span>
          <span className="topbar__icon" aria-hidden="true" />
        </header>

        <main className="home">
          <WeekStrip week={week} onOpenCalendar={() => open('calendar')} />

          <nav className="home__nav">
            <button type="button" className="home__nav-btn" onClick={onOpenGarden}>
              <GardenIcon />
              Seu jardim
            </button>
            <button type="button" className="home__nav-btn" onClick={onOpenLibrary}>
              <PencilIcon />
              Anotações
            </button>
          </nav>

          <ol className="journey" ref={journeyRef}>
            {steps.map((step) => {
              const def = stationDefs[step];
              const isDone = done.has(step);
              const isCurrent = step === currentStep;
              return (
                <li
                  key={step}
                  className={`station${isDone ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
                >
                  <span className="station__node" aria-hidden="true" />
                  <button
                    type="button"
                    className={`station__card${def.prayer ? ' station__card--prayer' : ''}`}
                    onClick={() => open(step)}
                  >
                    <span className="station__kicker">{def.kicker}</span>
                    <span className="station__title">{def.title}</span>
                    <span className="station__meta">{def.meta}</span>
                    <span className="station__chev" aria-hidden="true">
                      {isDone ? '✓' : '→'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <footer className="finish">
            {finished ? (
              <div className="finish__done">
                <span className="finish__bloom" aria-hidden="true">
                  ✿
                </span>
                <p className="finish__title display">Dia concluído</p>
                {finishStreak !== undefined ? (
                  <p className="muted">
                    Sua sequência é de <strong>{finishStreak} dia(s)</strong>.
                  </p>
                ) : (
                  <p className="muted">Salvo. Sincroniza quando você estiver online.</p>
                )}
              </div>
            ) : (
              <>
                <p className="finish__hint muted">
                  {allDone
                    ? 'Tudo pronto. Encerre o dia com gratidão.'
                    : `Faltam ${String(steps.filter((s) => !done.has(s)).length)} etapa(s) para encerrar o dia.`}
                </p>
                <button
                  type="button"
                  className="btn btn--block"
                  onClick={finish}
                  disabled={!allDone}
                >
                  Concluir o dia
                </button>
              </>
            )}
          </footer>
        </main>
      </section>

      {top === 'verse' && quote && (
        <VerseScreen
          text={quote.text}
          reference={passage?.label}
          onComplete={() => markDone('verse')}
          onClose={close}
        />
      )}
      {top === 'reading' && passage && (
        <ReadingScreen
          refLabel={passage.label}
          chapterLabel={passage.label}
          verses={passage.verses}
          fallbackText={passage.text}
          audioUrl={passage.audioUrl}
          onComplete={() => markDone('reading')}
          onClose={close}
        />
      )}
      {top === 'devotional' && devo && (
        <DevotionalScreen
          text={devo.text}
          audioUrl={devo.audioUrl}
          onComplete={() => markDone('devotional')}
          onClose={close}
        />
      )}
      {top === 'prayer' && prayer && (
        <PrayerScreen
          text={prayer.text}
          audioUrl={prayer.audioUrl}
          soundUrl={prayer.soundUrl}
          onComplete={() => markDone('prayer')}
          onClose={close}
        />
      )}
      {top === 'reflection' && reflection && (
        <ReflectionScreen
          questions={reflection.questions}
          actions={reflection.actions}
          audioUrl={reflection.audioUrl}
          onComplete={() => markDone('reflection')}
          onClose={close}
          onWriteNote={() => open('note')}
        />
      )}
      {top === 'calendar' && (
        <CalendarScreen
          current={streak?.currentStreak ?? 0}
          longest={streak?.longestStreak ?? 0}
          today={today}
          initialCompleted={completedDates}
          onClose={close}
        />
      )}
      {top === 'note' && (
        <NoteEditorScreen
          devotionalId={devotional.id}
          dateLabel={formatDateline(today)}
          onClose={close}
        />
      )}
    </>
  );
}
