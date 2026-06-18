import type { UserPublic } from '@devocional/shared';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { fetchCurrentUser, logout } from './api/auth.js';
import { AgendaScreen } from './features/AgendaScreen.js';
import { DevotionalEditor } from './features/DevotionalEditor.js';
import { Login } from './features/Login.js';
import { AppShell } from './ui/AppShell.js';
import { Skeleton } from './ui/Skeleton.js';
import { ToastProvider } from './ui/Toast.js';

export function App() {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchCurrentUser()
      .then(setUser, () => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="full-center">
        <Skeleton width="14rem" height="2rem" />
      </div>
    );
  }

  if (!user) {
    return <Login onLoggedIn={setUser} />;
  }

  const handleLogout = () => {
    void logout().then(() => setUser(null));
  };

  return (
    <ToastProvider>
      <Routes>
        <Route element={<AppShell user={user} onLogout={handleLogout} />}>
          <Route index element={<AgendaScreen />} />
          <Route path="novo" element={<DevotionalEditor />} />
          <Route path="dia/:date" element={<DevotionalEditor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
