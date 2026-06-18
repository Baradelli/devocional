import type { WeekDay } from '../lib/dates.js';

interface WeekStripProps {
  week: WeekDay[];
  onOpenCalendar: () => void;
}

/** Faixa da semana no topo de Hoje: dias feitos / hoje / faltou. */
export function WeekStrip({ week, onOpenCalendar }: WeekStripProps) {
  return (
    <section className="week card">
      <div className="week__head">
        <span className="label">Esta semana</span>
        <button type="button" className="week__cal" onClick={onOpenCalendar}>
          Ver calendário →
        </button>
      </div>
      <ol className="week__days">
        {week.map((d) => (
          <li key={d.iso} className={`week__day ${d.status}`}>
            <span className="week__dow">{d.dow}</span>
            <span className="week__dot">{d.day}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
