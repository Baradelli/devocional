import type { CoverageStats, EngagementStats, SectionKey } from '@devocional/shared';
import { useEffect, useState } from 'react';

import { getCoverageStats, getEngagementStats } from '../api/stats.js';
import { formatLong } from '../lib/date.js';
import { Banner } from '../ui/Banner.js';
import { Panel } from '../ui/Panel.js';
import { Skeleton } from '../ui/Skeleton.js';
import { CoverageHeatmap } from './CoverageHeatmap.js';

const SECTION_LABELS: Record<SectionKey, string> = {
  PENTATEUCH: 'Pentateuco',
  HISTORICAL: 'Históricos',
  POETIC: 'Poéticos',
  PROPHETS: 'Profetas',
  GOSPELS: 'Evangelhos e Atos',
  EPISTLES: 'Cartas',
  REVELATION: 'Apocalipse',
};

type State =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; coverage: CoverageStats; engagement: EngagementStats };

function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function Bar({ value }: { value: number }) {
  return (
    <div className="bar" role="presentation">
      <div className="bar__fill" style={{ width: `${String(value)}%` }} />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

export function DashboardScreen() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    void Promise.all([getCoverageStats(), getEngagementStats()]).then(
      ([coverage, engagement]) => setState({ kind: 'ready', coverage, engagement }),
      () => setState({ kind: 'error' }),
    );
  }, []);

  if (state.kind === 'loading') {
    return (
      <Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton width="14rem" height="1.6rem" />
          <Skeleton height="7rem" />
          <Skeleton height="12rem" />
        </div>
      </Panel>
    );
  }

  if (state.kind === 'error') {
    return <Banner kind="error">Não foi possível carregar os indicadores.</Banner>;
  }

  const { coverage, engagement } = state;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Painel</h1>
          <p className="page-head__sub">
            Cobertura da Bíblia e engajamento — régua {coverage.rulerTranslationCode}.
          </p>
        </div>
      </div>

      <div className="dash">
        <h2 className="dash__section">Cobertura da Bíblia</h2>
        <div className="dash__kpis">
          <Panel>
            <div className="kpi">
              <span className="kpi__value">{coverage.coveragePct}%</span>
              <span className="kpi__label">da Bíblia coberta</span>
              <span className="kpi__meta">
                {coverage.coveredVerses.toLocaleString('pt-BR')} de{' '}
                {coverage.totalVerses.toLocaleString('pt-BR')} versículos
              </span>
            </div>
          </Panel>
          <Panel>
            <div className="kpi">
              <span className="kpi__value">{coverage.devotionalCount}</span>
              <span className="kpi__label">devocionais</span>
              <span className="kpi__meta">
                {coverage.unusedBooks.length} livros ainda não usados
              </span>
            </div>
          </Panel>
          <Panel title="Antigo × Novo Testamento">
            <div className="split">
              {(['OLD', 'NEW'] as const).map((t) => {
                const g = coverage.testaments[t];
                return (
                  <div className="split__row" key={t}>
                    <span className="split__name">{t === 'OLD' ? 'Antigo' : 'Novo'}</span>
                    <Bar value={pct(g.coveredVerses, g.totalVerses)} />
                    <span className="split__meta">
                      {pct(g.coveredVerses, g.totalVerses)}% · {g.devotionalCount} dev.
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <Panel title="Distribuição por seção">
          <div className="sections">
            {coverage.sections.map((s) => (
              <div className="split__row" key={s.key}>
                <span className="split__name">{SECTION_LABELS[s.key]}</span>
                <Bar value={pct(s.coveredVerses, s.totalVerses)} />
                <span className="split__meta">
                  {pct(s.coveredVerses, s.totalVerses)}% · {s.devotionalCount} dev.
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <div className="dash__cols">
          <Panel title="Livros mais usados">
            {coverage.topBooks.length === 0 ? (
              <p className="dash__empty">Nenhum devocional ainda.</p>
            ) : (
              <ol className="rank">
                {coverage.topBooks.map((b) => (
                  <li key={b.bookReferenceId}>
                    <span>{b.name}</span>
                    <span className="rank__count">{b.citations}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
          <Panel title="Passagens mais usadas">
            {coverage.topPassages.length === 0 ? (
              <p className="dash__empty">Nenhum devocional ainda.</p>
            ) : (
              <ol className="rank">
                {coverage.topPassages.map((p) => (
                  <li key={p.label}>
                    <span>{p.label}</span>
                    <span className="rank__count">{p.citations}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <Panel title="Mapa de cobertura" hint="Intensidade = vezes que o capítulo foi citado.">
          <CoverageHeatmap books={coverage.books} />
        </Panel>

        {coverage.unusedBooks.length > 0 && (
          <Panel
            title="Livros nunca usados"
            hint={`${String(coverage.unusedBooks.length)} livros sem nenhum devocional.`}
          >
            <div className="chips">
              {coverage.unusedBooks.map((b) => (
                <span className="chip" key={b.bookReferenceId}>
                  {b.name}
                </span>
              ))}
            </div>
          </Panel>
        )}

        <h2 className="dash__section">Engajamento</h2>
        <div className="dash__kpis">
          <Panel>
            <div className="kpi">
              <span className="kpi__value">{engagement.activeUsers7d}</span>
              <span className="kpi__label">ativos nos últimos 7 dias</span>
              <span className="kpi__meta">de {engagement.registeredUsers} fiéis cadastrados</span>
            </div>
          </Panel>
          <Panel title="Conclusão diária">
            <div className="statgrid">
              <Stat value={`${engagement.dailyCompletionRate.today}%`} label="hoje" />
              <Stat value={`${engagement.dailyCompletionRate.avg7}%`} label="média 7d" />
              <Stat value={`${engagement.dailyCompletionRate.avg30}%`} label="média 30d" />
            </div>
          </Panel>
          <Panel title="Retenção semanal">
            <div className="kpi">
              <span className="kpi__value">{engagement.retention.retentionPct}%</span>
              <span className="kpi__meta">
                {engagement.retention.retained} de {engagement.retention.lastWeekActive} voltaram
                esta semana
              </span>
            </div>
          </Panel>
        </div>

        <div className="dash__cols">
          <Panel title="Streaks">
            <div className="statgrid">
              <Stat value={String(engagement.streaks.averageCurrent)} label="média atual" />
              <Stat value={String(engagement.streaks.longest)} label="maior de todos" />
            </div>
          </Panel>
          <Panel title="Devocionais mais concluídos">
            {engagement.mostCompleted.length === 0 ? (
              <p className="dash__empty">Nenhuma conclusão ainda.</p>
            ) : (
              <ol className="rank">
                {engagement.mostCompleted.map((d) => (
                  <li key={d.devotionalId}>
                    <span>{d.theme ?? formatLong(d.date)}</span>
                    <span className="rank__count">{d.completions}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
