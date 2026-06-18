import type { UserPublic } from '@devocional/shared';
import { useEffect, useState } from 'react';

import { fetchCurrentUser, logout } from './api/auth.js';
import { completeOnboarding } from './api/onboarding.js';
import { ContextualOnboarding } from './features/ContextualOnboarding.js';
import { Garden } from './features/Garden.js';
import { Library } from './features/Library.js';
import { Login } from './features/Login.js';
import { Settings } from './features/Settings.js';
import { Today } from './features/Today.js';
import { localOnboardingSeen } from './onboarding/onboardingSeen.js';
import { ThemeSwitch } from './theme/ThemeSwitch.js';

type View = 'today' | 'garden' | 'library' | 'settings';

const onboardingSeen = localOnboardingSeen();

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
          setView('today');
          setShowTour(current.onboardingCompletedAt === null && !onboardingSeen.hasSeen());
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
          setView('today');
          setShowTour(loggedIn.onboardingCompletedAt === null && !onboardingSeen.hasSeen());
        }}
      />
    );
  }

  // Conclui o tour: na primeira vez marca no servidor; rever depois só fecha.
  const finishTour = async () => {
    onboardingSeen.markSeen();
    if (user.onboardingCompletedAt === null) {
      try {
        setUser(await completeOnboarding());
      } catch {
        // best-effort: fechar o tour não pode travar por falha de rede.
      }
    }
    setShowTour(false);
  };

  const backToToday = () => setView('today');
  const reviewTour = () => {
    setView('today');
    setShowTour(true);
  };

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
          onReviewOnboarding={reviewTour}
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
      {showTour && (
        <ContextualOnboarding currentView={view} onRequestView={setView} onFinish={finishTour} />
      )}
      <ThemeSwitch />
    </>
  );
}
