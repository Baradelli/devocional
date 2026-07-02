import type { DevotionalSummary } from '@devocional/shared';
import { useEffect, useMemo, useState } from 'react';
import { LuSprout } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';

import { listDevotionals } from '../api/content.js';
import {
  addMonths,
  formatLong,
  monthLabel,
  monthMatrix,
  parseISO,
  todayISO,
  WEEKDAY_HEADERS,
  weekdayShort,
} from '../lib/date.js';
import { Banner } from '../ui/Banner.js';
import { Button } from '../ui/Button.js';
import { Panel } from '../ui/Panel.js';
import { Skeleton } from '../ui/Skeleton.js';
import { deriveStatus, StatusBadge } from '../ui/StatusBadge.js';

type View = 'calendar' | 'list';
type State =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; summaries: DevotionalSummary[] };

export function AgendaScreen() {
  const navigate = useNavigate();
  const today = todayISO();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [view, setView] = useState<View>('calendar');
  const initial = parseISO(today);
  const [cursor, setCursor] = useState({ year: initial.year, month: initial.month });

  function load() {
    setState({ kind: 'loading' });
    void listDevotionals().then(
      (summaries) => setState({ kind: 'ready', summaries }),
      () => setState({ kind: 'error' }),
    );
  }

  useEffect(load, []);

  const byDate = useMemo(() => {
    const map = new Map<string, DevotionalSummary>();
    if (state.kind === 'ready') {
      for (const s of state.summaries) {
        map.set(s.date, s);
      }
    }
    return map;
  }, [state]);

  const openDay = (iso: string, exists: boolean) => {
    void navigate(exists ? `/dia/${iso}` : `/novo?date=${iso}`);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Agenda</h1>
          <p className="page-head__sub">
            Veja o que já foi publicado, o que está agendado e quais dias ainda faltam.
          </p>
        </div>
        <div className="page-head__actions">
          <div className="segmented" role="group" aria-label="Modo de visualização">
            <button aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>
              Calendário
            </button>
            <button aria-pressed={view === 'list'} onClick={() => setView('list')}>
              Lista
            </button>
          </div>
          <Button onClick={() => void navigate('/novo')}>Novo devocional</Button>
        </div>
      </div>

      {state.kind === 'error' && (
        <Panel>
          <Banner kind="error">Não foi possível carregar a agenda.</Banner>
          <div>
            <Button variant="secondary" size="sm" onClick={load}>
              Tentar de novo
            </Button>
          </div>
        </Panel>
      )}

      {state.kind === 'loading' && <AgendaSkeleton view={view} />}

      {state.kind === 'ready' &&
        (view === 'calendar' ? (
          <CalendarView
            year={cursor.year}
            month={cursor.month}
            today={today}
            byDate={byDate}
            onMove={(delta) => setCursor(addMonths(cursor.year, cursor.month, delta))}
            onToday={() => setCursor({ year: initial.year, month: initial.month })}
            onOpen={openDay}
          />
        ) : (
          <ListView summaries={state.summaries} today={today} onOpen={openDay} />
        ))}
    </>
  );
}

function CalendarView({
  year,
  month,
  today,
  byDate,
  onMove,
  onToday,
  onOpen,
}: {
  year: number;
  month: number;
  today: string;
  byDate: Map<string, DevotionalSummary>;
  onMove: (delta: number) => void;
  onToday: () => void;
  onOpen: (iso: string, exists: boolean) => void;
}) {
  const weeks = monthMatrix(year, month);
  const monthCount = [...byDate.keys()].filter((iso) => {
    const p = parseISO(iso);
    return p.year === year && p.month === month;
  }).length;

  return (
    <Panel>
      <div className="cal__bar">
        <span className="cal__month">{monthLabel(year, month)}</span>
        <div className="cal__nav">
          <button className="icon-btn" aria-label="Mês anterior" onClick={() => onMove(-1)}>
            ‹
          </button>
          <button className="icon-btn" aria-label="Próximo mês" onClick={() => onMove(1)}>
            ›
          </button>
        </div>
        <Button variant="secondary" size="sm" onClick={onToday}>
          Hoje
        </Button>
        <span className="cal__spacer" />
        <span className="cal__count">
          {monthCount} {monthCount === 1 ? 'devocional' : 'devocionais'} no mês
        </span>
      </div>

      <div className="cal__weekdays" aria-hidden>
        {WEEKDAY_HEADERS.map((w) => (
          <span key={w} className="cal__weekday">
            {w}
          </span>
        ))}
      </div>

      <div className="cal__grid">
        {weeks.flat().map((cell) => {
          const summary = byDate.get(cell.iso);
          const isToday = cell.iso === today;
          if (!cell.inMonth) {
            return (
              <div key={cell.iso} className="cal__cell cal__cell--out" aria-hidden>
                <span className="cal__daynum">{cell.day}</span>
              </div>
            );
          }
          const status = summary ? deriveStatus(summary.date, today) : null;
          return (
            <button
              key={cell.iso}
              className={[
                'cal__cell',
                isToday && 'cal__cell--today',
                !summary && 'cal__cell--empty',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onOpen(cell.iso, Boolean(summary))}
              aria-label={`${formatLong(cell.iso, true)}${summary ? ` — ${summary.theme ?? 'devocional'}` : ' — sem devocional'}`}
            >
              <span className="cal__daynum">{cell.day}</span>
              {status && <span className="badge__dot" data-status={status} aria-hidden />}
              {summary && <span className="cal__theme">{summary.theme ?? 'Sem tema'}</span>}
              {!summary && (
                <span className="cal__add" aria-hidden>
                  +
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="cal__legend">
        <StatusBadge status="published" />
        <StatusBadge status="scheduled" />
      </div>
    </Panel>
  );
}

function ListView({
  summaries,
  today,
  onOpen,
}: {
  summaries: DevotionalSummary[];
  today: string;
  onOpen: (iso: string, exists: boolean) => void;
}) {
  if (summaries.length === 0) {
    return (
      <Panel>
        <div className="empty">
          <span className="empty__mark" aria-hidden>
            <LuSprout />
          </span>
          <span className="empty__title">Nenhum devocional ainda</span>
          <p>Crie o primeiro devocional ou escolha um dia no calendário para começar.</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <table className="dev-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Dia</th>
            <th>Tema</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((s) => (
            <tr key={s.date} className="dev-row" onClick={() => onOpen(s.date, true)}>
              <td className="dev-row__date">{formatLong(s.date, true)}</td>
              <td className="dev-row__weekday">{weekdayShort(s.date)}</td>
              <td className="dev-row__theme">{s.theme ?? '—'}</td>
              <td>
                <StatusBadge status={deriveStatus(s.date, today)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function AgendaSkeleton({ view }: { view: View }) {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Skeleton width="14rem" height="1.4rem" />
        {view === 'calendar' ? (
          <div className="cal__grid" style={{ marginTop: '0.5rem' }}>
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} height="86px" radius="11px" />
            ))}
          </div>
        ) : (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height="2.6rem" />)
        )}
      </div>
    </Panel>
  );
}
