import type { UserPublic } from '@devocional/shared';
import { useEffect, useState } from 'react';

import { fetchCurrentUser, logout } from './api/auth.js';
import { Login } from './features/Login.js';
import { PassageSelector } from './features/PassageSelector.js';

export function App() {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

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
        <strong>Devocional — Admin</strong>
        <span className="muted">
          {user.name}
          <button
            type="button"
            className="link"
            onClick={() => {
              void logout().then(() => setUser(null));
            }}
          >
            Sair
          </button>
        </span>
      </header>
      <main>
        <PassageSelector />
      </main>
    </div>
  );
}
