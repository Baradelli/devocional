import type { UserPublic } from '@devocional/shared';
import { lazy, Suspense, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { logout } from '../api/auth.js';
import { completeOnboarding } from '../api/onboarding.js';
import { localOnboardingSeen } from '../onboarding/onboardingSeen.js';
import { ContextualOnboarding } from './ContextualOnboarding.js';
import { Garden } from './Garden.js';
import { Library } from './Library.js';
import { Settings } from './Settings.js';
import { Today } from './Today.js';
import { CalendarScreen } from './today/CalendarScreen.js';

// O editor carrega o TipTap (pesado): fica num chunk separado, fora do bundle inicial.
const NoteEditorScreen = lazy(() =>
  import('./NoteEditorScreen.js').then((m) => ({ default: m.NoteEditorScreen })),
);

const onboardingSeen = localOnboardingSeen();

/** App do fiel já autenticado: rotas das telas + onboarding. O roteamento público
 * (login/cadastro) e o gate de sessão vivem no App. */
export function AuthedApp({
  user,
  onUserChange,
}: {
  user: UserPublic;
  onUserChange: (user: UserPublic | null) => void;
}) {
  const navigate = useNavigate();
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

  const reviewTour = () => {
    void navigate('/today');
    setShowTour(true);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<Today />} />
        <Route path="/garden" element={<Garden />} />
        <Route path="/library" element={<Library />} />
        <Route
          path="/settings"
          element={
            <Settings
              user={user}
              initialTab={showTour ? 'lembretes' : 'perfil'}
              onReviewOnboarding={reviewTour}
              onAccountDeleted={() => onUserChange(null)}
              onLogout={() => {
                void logout().then(() => onUserChange(null));
              }}
            />
          }
        />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route
          path="/notes/:id/edit"
          element={
            <Suspense fallback={<section className="screen screen--overlay screen--note" />}>
              <NoteEditorScreen />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
      {showTour && <ContextualOnboarding onFinish={finishTour} />}
    </>
  );
}
