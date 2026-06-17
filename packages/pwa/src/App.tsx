import type { UserPublic } from '@devocional/shared';
import { type ReactElement, useEffect, useState } from 'react';

import { fetchCurrentUser, logout } from './api/auth.js';
import { Garden } from './features/Garden.js';
import { Library } from './features/Library.js';
import { Login } from './features/Login.js';
import { Settings } from './features/Settings.js';
import { Today } from './features/Today.js';

type View = 'today' | 'garden' | 'library' | 'settings';

const TABS: { view: View; label: string }[] = [
  { view: 'today', label: 'Hoje' },
  { view: 'garden', label: 'Jardim' },
  { view: 'library', label: 'Anotações' },
  { view: 'settings', label: 'Lembretes' },
];

const VIEWS: Record<View, () => ReactElement> = {
  today: Today,
  garden: Garden,
  library: Library,
  settings: Settings,
};

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
          {TABS.map((tab) => (
            <button
              key={tab.view}
              type="button"
              className={view === tab.view ? 'tab active' : 'tab'}
              onClick={() => setView(tab.view)}
            >
              {tab.label}
            </button>
          ))}
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
      <main>{VIEWS[view]()}</main>
    </div>
  );
}
