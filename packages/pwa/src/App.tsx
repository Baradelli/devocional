import type { UserPublic } from '@devocional/shared';
import { useEffect, useState } from 'react';

import { fetchCurrentUser, logout } from './api/auth.js';
import { Library } from './features/Library.js';
import { Login } from './features/Login.js';
import { Today } from './features/Today.js';

type View = 'today' | 'library';

export function App() {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('today');

  useEffect(() => {
    void fetchCurrentUser()
      .then(setUser, () => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="muted center">Carregando…</p>;
  }

  if (!user) {
    return <Login onLoggedIn={setUser} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <nav className="tabs">
          <button
            type="button"
            className={view === 'today' ? 'tab active' : 'tab'}
            onClick={() => setView('today')}
          >
            Hoje
          </button>
          <button
            type="button"
            className={view === 'library' ? 'tab active' : 'tab'}
            onClick={() => setView('library')}
          >
            Anotações
          </button>
        </nav>
        <button
          type="button"
          className="link"
          onClick={() => {
            void logout().then(() => setUser(null));
          }}
        >
          Sair
        </button>
      </header>
      <main>{view === 'today' ? <Today /> : <Library />}</main>
    </div>
  );
}
