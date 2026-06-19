import type { CoverageStats, SectionKey } from '@devocional/shared';
import { useEffect, useState } from 'react';

import { getCoverageStats } from '../api/stats.js';
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

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; stats: CoverageStats };

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

export function DashboardScreen() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    void getCoverageStats().then(
      (stats) => setState({ kind: 'ready', stats }),
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

  const { stats } = state;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Painel</h1>
          <p className="page-head__sub">
            Cobertura da Bíblia pelos devocionais — régua {stats.rulerTranslationCode}.
          </p>
        </div>
      </div>

      <div className="dash">
        <div className="dash__kpis">
          <Panel>
            <div className="kpi">
              <span className="kpi__value">{stats.coveragePct}%</span>
              <span className="kpi__label">da Bíblia coberta</span>
              <span className="kpi__meta">
                {stats.coveredVerses.toLocaleString('pt-BR')} de{' '}
                {stats.totalVerses.toLocaleString('pt-BR')} versículos
              </span>
            </div>
          </Panel>
          <Panel>
            <div className="kpi">
              <span className="kpi__value">{stats.devotionalCount}</span>
              <span className="kpi__label">devocionais</span>
              <span className="kpi__meta">{stats.unusedBooks.length} livros ainda não usados</span>
            </div>
          </Panel>
          <Panel title="Antigo × Novo Testamento">
            <div className="split">
              {(['OLD', 'NEW'] as const).map((t) => {
                const g = stats.testaments[t];
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
            {stats.sections.map((s) => (
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
            {stats.topBooks.length === 0 ? (
              <p className="dash__empty">Nenhum devocional ainda.</p>
            ) : (
              <ol className="rank">
                {stats.topBooks.map((b) => (
                  <li key={b.bookReferenceId}>
                    <span>{b.name}</span>
                    <span className="rank__count">{b.citations}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
          <Panel title="Passagens mais usadas">
            {stats.topPassages.length === 0 ? (
              <p className="dash__empty">Nenhum devocional ainda.</p>
            ) : (
              <ol className="rank">
                {stats.topPassages.map((p) => (
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
          <CoverageHeatmap books={stats.books} />
        </Panel>

        {stats.unusedBooks.length > 0 && (
          <Panel
            title="Livros nunca usados"
            hint={`${String(stats.unusedBooks.length)} livros sem nenhum devocional.`}
          >
            <div className="chips">
              {stats.unusedBooks.map((b) => (
                <span className="chip" key={b.bookReferenceId}>
                  {b.name}
                </span>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
