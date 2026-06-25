import type { RosterEntry } from '@devocional/shared';
import { useEffect, useState } from 'react';

import { getRoster } from '../api/stats.js';
import { formatLong } from '../lib/date.js';
import { Banner } from '../ui/Banner.js';
import { Button } from '../ui/Button.js';
import { Panel } from '../ui/Panel.js';
import { Skeleton } from '../ui/Skeleton.js';

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; people: RosterEntry[] };

export function PeopleScreen() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  function load() {
    setState({ kind: 'loading' });
    void getRoster().then(
      (people) => setState({ kind: 'ready', people }),
      () => setState({ kind: 'error' }),
    );
  }

  useEffect(load, []);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Pessoas</h1>
          <p className="page-head__sub">
            Quem está cadastrado e como está o hábito de cada um. Apenas leitura.
          </p>
        </div>
      </div>

      {state.kind === 'error' && (
        <Panel>
          <Banner kind="error">Não foi possível carregar as pessoas.</Banner>
          <div>
            <Button variant="secondary" size="sm" onClick={load}>
              Tentar de novo
            </Button>
          </div>
        </Panel>
      )}

      {state.kind === 'loading' && (
        <Panel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height="2.6rem" />
            ))}
          </div>
        </Panel>
      )}

      {state.kind === 'ready' && <PeopleTable people={state.people} />}
    </>
  );
}

function PeopleTable({ people }: { people: RosterEntry[] }) {
  if (people.length === 0) {
    return (
      <Panel>
        <div className="empty">
          <span className="empty__mark" aria-hidden>
            🌿
          </span>
          <span className="empty__title">Ninguém cadastrado ainda</span>
          <p>Gere um convite para que a primeira pessoa entre.</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <table className="dev-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Entrou</th>
            <th>Onboarding</th>
            <th>Streak</th>
            <th>Último dia</th>
            <th>Hoje?</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id}>
              <td className="dev-row__date">{person.name}</td>
              <td className="dev-row__theme">{person.email}</td>
              <td className="dev-row__weekday">{formatLong(person.joinedAt.slice(0, 10), true)}</td>
              <td>{person.onboardingCompleted ? '✓' : '—'}</td>
              <td>{person.currentStreak > 0 ? `${person.currentStreak} 🔥` : '0'}</td>
              <td className="dev-row__weekday">
                {person.lastCompletedDate ? formatLong(person.lastCompletedDate, true) : '—'}
              </td>
              <td>{person.completedToday ? '✓' : '—'}</td>
              <td>{person.totalCompletions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
