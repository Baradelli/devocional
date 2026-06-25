import type { UserPublic } from '@devocional/shared';
import { useState } from 'react';

import { logout } from '../api/auth.js';
import { completeOnboarding } from '../api/onboarding.js';
import { localOnboardingSeen } from '../onboarding/onboardingSeen.js';
import { ThemeSwitch } from '../theme/ThemeSwitch.js';
import { ContextualOnboarding } from './ContextualOnboarding.js';
import { Garden } from './Garden.js';
import { Library } from './Library.js';
import { Settings } from './Settings.js';
import { Today } from './Today.js';

type View = 'today' | 'garden' | 'library' | 'settings';

const onboardingSeen = localOnboardingSeen();

/** App do fiel já autenticado: telas + onboarding. O roteamento público
 * (login/cadastro) e o gate de sessão vivem no App. */
export function AuthedApp({
  user,
  onUserChange,
}: {
  user: UserPublic;
  onUserChange: (user: UserPublic | null) => void;
}) {
  const [view, setView] = useState<View>('today');
  const [showTour, setShowTour] = useState(
    user.onboardingCompletedAt === null && !onboardingSeen.hasSeen(),
  );

  // Conclui o tour: na primeira vez marca no servidor; rever depois só fecha.
  const finishTour = async () => {
    onboardingSeen.markSeen();
    if (user.onboardingCompletedAt === null) {
      try {
        onUserChange(await completeOnboarding());
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
          onAccountDeleted={() => onUserChange(null)}
          onLogout={() => {
            void logout().then(() => onUserChange(null));
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
