import type { UserPublic } from '@devocional/shared';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { fetchCurrentUser } from './api/auth.js';
import { AuthedApp } from './features/AuthedApp.js';
import { Login } from './features/Login.js';
import { Register } from './features/Register.js';

export function App() {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchCurrentUser()
      .then(
        (current) => setUser(current),
        () => setUser(null),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="muted center">Carregando…</p>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginRoute onAuthed={setUser} />}
      />
      <Route path="/register" element={<RegisterRoute onAuthed={setUser} />} />
      <Route
        path="/*"
        element={
          user ? <AuthedApp user={user} onUserChange={setUser} /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

function LoginRoute({ onAuthed }: { onAuthed: (user: UserPublic) => void }) {
  const navigate = useNavigate();
  return (
    <Login
      onLoggedIn={(loggedIn) => {
        onAuthed(loggedIn);
        void navigate('/', { replace: true });
      }}
    />
  );
}

function RegisterRoute({ onAuthed }: { onAuthed: (user: UserPublic) => void }) {
  const navigate = useNavigate();
  return (
    <Register
      onRegistered={(registered) => {
        onAuthed(registered);
        void navigate('/', { replace: true });
      }}
    />
  );
}
