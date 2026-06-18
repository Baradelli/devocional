import { useEffect, useState } from 'react';

import { fetchCalendar } from '../../api/progress.js';
import { StreakStats } from '../../components/StreakStats.js';
import { buildMonthGrid, formatMonthTitle, toMonthKey, WEEKDAY_SHORT } from '../../lib/dates.js';
import { ScreenBar } from './ScreenBar.js';

interface CalendarScreenProps {
  current: number;
  longest: number;
  today: Date;
  initialCompleted: string[];
  onClose: () => void;
}

function shiftMonth(monthKey: string, delta: number): string {
  const parts = monthKey.split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1 + delta, 1);
  return toMonthKey(d);
}

/** Calendário de sequência: totalizador + grade mensal navegável. */
export function CalendarScreen({
  current,
  longest,
  today,
  initialCompleted,
  onClose,
}: CalendarScreenProps) {
  const thisMonth = toMonthKey(today);
  const [month, setMonth] = useState(thisMonth);
  const [completed, setCompleted] = useState<string[]>(initialCompleted);

  useEffect(() => {
    if (month === thisMonth) {
      setCompleted(initialCompleted);
      return;
    }
    let active = true;
    void fetchCalendar(month).then(
      (view) => active && setCompleted(view.completedDates),
      () => active && setCompleted([]),
    );
    return () => {
      active = false;
    };
  }, [month, thisMonth, initialCompleted]);

  const grid = buildMonthGrid(month, today, completed);

  return (
    <section
      className="screen screen--overlay screen--calendar"
      aria-label="Calendário de sequência"
    >
      <ScreenBar title="Sua sequência" onClose={onClose} />
      <div className="cal">
        <StreakStats current={current} longest={longest} />
        <div className="cal__month">
          <button
            type="button"
            className="iconbtn"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <span className="display">{formatMonthTitle(month)}</span>
          <button
            type="button"
            className="iconbtn"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label="Próximo mês"
            disabled={month >= thisMonth}
          >
            ›
          </button>
        </div>
        <div className="cal__dows">
          {WEEKDAY_SHORT.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="cal__grid">
          {grid.map((cell, i) =>
            cell.day === null ? (
              <span key={`b${String(i)}`} className="cal__cell blank" />
            ) : (
              <span key={cell.iso} className={`cal__cell ${cell.status ?? ''}`}>
                {cell.day}
              </span>
            ),
          )}
        </div>
        <div className="cal__legend">
          <span>
            <i className="dot dot--done" />
            Concluído
          </span>
          <span>
            <i className="dot dot--today" />
            Hoje
          </span>
          <span>
            <i className="dot dot--miss" />
            Faltou
          </span>
        </div>
      </div>
    </section>
  );
}
