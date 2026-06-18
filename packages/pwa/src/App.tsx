import type { UserPublic } from '@devocional/shared';
import { useEffect, useState } from 'react';

import { fetchCurrentUser, logout } from './api/auth.js';
import { completeOnboarding } from './api/onboarding.js';
import { Garden } from './features/Garden.js';
import { Library } from './features/Library.js';
import { Login } from './features/Login.js';
import { Onboarding } from './features/Onboarding.js';
import { Settings } from './features/Settings.js';
import { Today } from './features/Today.js';
import { ThemeSwitch } from './theme/ThemeSwitch.js';

type View = 'today' | 'garden' | 'library' | 'settings';

export function App() {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('today');
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    void fetchCurrentUser()
      .then(
        (current) => {
          setUser(current);
          setShowTour(current.onboardingCompletedAt === null);
        },
        () => setUser(null),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="muted center">Carregando…</p>;
  }

  if (!user) {
    return (
      <Login
        onLoggedIn={(loggedIn) => {
          setUser(loggedIn);
          setShowTour(loggedIn.onboardingCompletedAt === null);
        }}
      />
    );
  }

  // Conclui o tour: na primeira vez marca no servidor; rever depois só fecha.
  const finishTour = async () => {
    if (user.onboardingCompletedAt === null) {
      try {
        setUser(await completeOnboarding());
      } catch {
        // best-effort: fechar o tour não pode travar por falha de rede.
      }
    }
    setShowTour(false);
  };

  if (showTour) {
    return <Onboarding onFinish={finishTour} />;
  }

  const backToToday = () => setView('today');

  return (
    <>
      {view === 'today' && (
        <Today
          onOpenGarden={() => setView('garden')}
          onOpenLibrary={() => setView('library')}
          onOpenSettings={() => setView('settings')}
        />
      )}
      {view === 'garden' && <Garden onBack={backToToday} />}
      {view === 'library' && <Library onBack={backToToday} />}
      {view === 'settings' && (
        <Settings
          onBack={backToToday}
          onReviewOnboarding={() => setShowTour(true)}
          onAccountDeleted={() => {
            setUser(null);
            setView('today');
          }}
          onLogout={() => {
            void logout().then(() => {
              setUser(null);
              setView('today');
            });
          }}
        />
      )}
      <ThemeSwitch />
    </>
  );
}
