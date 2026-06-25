import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { promptInstall, useCanInstall } from '../lib/installPrompt.js';

type OnboardingView = 'today' | 'garden' | 'library' | 'settings';

interface CoachStep {
  id: string;
  view: OnboardingView;
  /** Seletor do elemento destacado. Ausente = card central informativo, sem spotlight. */
  target?: string;
  title: string;
  body: string;
}

const COACH_STEPS: CoachStep[] = [
  {
    id: 'open-settings',
    view: 'today',
    target: '[data-onboard="today-settings"]',
    title: 'Ajustes do seu ritmo',
    body: 'Comece por aqui para definir horário e canais dos seus lembretes.',
  },
  {
    id: 'reminder-time',
    view: 'settings',
    target: '[data-onboard="settings-reminder-time"]',
    title: 'Escolha o melhor horário',
    body: 'Defina a hora que combina com sua rotina para lembrar do devocional todos os dias.',
  },
  {
    id: 'whatsapp-setup',
    view: 'settings',
    target: '[data-onboard="settings-whatsapp"]',
    title: 'Ative também no WhatsApp',
    body: 'Cadastre seu número e valide o código para receber lembretes por WhatsApp.',
  },
  {
    id: 'back-home',
    view: 'settings',
    target: '[data-onboard="settings-back"]',
    title: 'Volte para a tela de hoje',
    body: 'Depois de ajustar os lembretes, este botão te traz de volta ao seu devocional.',
  },
  {
    id: 'daily-journey',
    view: 'today',
    target: '[data-onboard="today-journey"]',
    title: 'Siga sua jornada do dia',
    body: 'Abra as etapas em sequência para ler ou escutar no seu tempo.',
  },
  {
    id: 'notes-library',
    view: 'today',
    target: '[data-onboard="today-library"]',
    title: 'Guarde o que Deus falou com você',
    body: 'Em Anotações você registra seus aprendizados e revisita depois, por data.',
  },
  {
    id: 'finish-day',
    view: 'today',
    target: '[data-onboard="today-finish"]',
    title: 'Conclua seu dia',
    body: 'Quando terminar as etapas, conclua o dia para avançar sua sequência e sua árvore.',
  },
  {
    id: 'install-iphone',
    view: 'today',
    title: 'Instale na tela de início',
    body: 'No iPhone, toque em Compartilhar e em "Adicionar à Tela de Início". Abrir o app por ali é o que permite receber as notificações.',
  },
];

interface ContextualOnboardingProps {
  onFinish: () => void | Promise<void>;
}

function viewFromPath(pathname: string): OnboardingView {
  if (pathname.startsWith('/garden')) {
    return 'garden';
  }
  if (pathname.startsWith('/library')) {
    return 'library';
  }
  if (pathname.startsWith('/settings')) {
    return 'settings';
  }
  return 'today';
}

function currentViewport() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/** Onboarding contextual com spotlight: guia o fiel nas telas reais do app. */
export function ContextualOnboarding({ onFinish }: ContextualOnboardingProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = viewFromPath(location.pathname);
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState(currentViewport);
  const canInstall = useCanInstall();
  const step = COACH_STEPS[index];
  const isLast = index === COACH_STEPS.length - 1;
  const isInstall = step?.id === 'install-iphone';

  useEffect(() => {
    if (step && currentView !== step.view) {
      void navigate(`/${step.view}`);
    }
  }, [currentView, navigate, step]);

  useLayoutEffect(() => {
    if (!step) {
      return;
    }

    let retry = 0;
    let attempts = 0;
    let scrolled = false;

    const measure = () => {
      setViewport(currentViewport());

      if (!step.target) {
        setTargetRect(null);
        return;
      }

      const element = document.querySelector<HTMLElement>(step.target);
      if (element) {
        if (!scrolled) {
          // Traz o alvo para o centro da tela antes de ancorar o card.
          scrolled = true;
          element.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        setTargetRect(element.getBoundingClientRect());
        return;
      }

      // Alvo ainda não montou (ex.: Settings carregando). Tenta de novo até aparecer.
      setTargetRect(null);
      if (attempts < 40) {
        attempts += 1;
        retry = window.setTimeout(measure, 100);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      window.clearTimeout(retry);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [index, step]);

  const spotlightStyle = useMemo<CSSProperties | undefined>(() => {
    if (!targetRect) {
      return undefined;
    }
    const padding = 8;
    return {
      top: `${Math.max(8, Math.round(targetRect.top - padding))}px`,
      left: `${Math.max(8, Math.round(targetRect.left - padding))}px`,
      width: `${Math.round(targetRect.width + padding * 2)}px`,
      height: `${Math.round(targetRect.height + padding * 2)}px`,
    };
  }, [targetRect]);

  const cardStyle = useMemo<CSSProperties>(() => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const width = Math.min(360, Math.max(260, viewport.width - 32));
    const estimatedHeight = 250;
    const offset = 14;
    const spaceBelow = viewport.height - targetRect.bottom;
    const top =
      spaceBelow > estimatedHeight + offset
        ? targetRect.bottom + offset
        : targetRect.top - estimatedHeight - offset;
    const left = Math.min(
      viewport.width - width - 16,
      Math.max(16, targetRect.left + targetRect.width / 2 - width / 2),
    );

    return {
      width: `${Math.round(width)}px`,
      top: `${Math.max(16, Math.round(top))}px`,
      left: `${Math.round(left)}px`,
    };
  }, [targetRect, viewport.height, viewport.width]);

  const finish = () => {
    setFinishing(true);
    void Promise.resolve(onFinish());
  };

  if (!step) {
    return null;
  }

  return (
    <div className="coachmark" role="dialog" aria-modal="true" aria-label="Introdução guiada">
      {spotlightStyle ? (
        <div className="coachmark__spotlight" style={spotlightStyle} aria-hidden="true" />
      ) : (
        <div className="coachmark__backdrop" aria-hidden="true" />
      )}

      <div className="coachmark__card" style={cardStyle}>
        <button
          type="button"
          className="link coachmark__skip"
          onClick={finish}
          disabled={finishing}
        >
          Pular
        </button>

        <p className="coachmark__step">
          Passo {index + 1} de {COACH_STEPS.length}
        </p>
        <h2 className="coachmark__title">{step.title}</h2>
        <p className="coachmark__body">
          {isInstall && canInstall
            ? 'Adicione o Devocional à sua tela inicial para abrir rápido e receber os lembretes.'
            : step.body}
        </p>
        {step.target && !targetRect && (
          <p className="coachmark__wait muted">Preparando esta tela…</p>
        )}
        {isInstall && canInstall && (
          <button
            type="button"
            className="btn btn--block coachmark__install"
            onClick={() => void promptInstall()}
          >
            Instalar agora
          </button>
        )}

        <div className="coachmark__actions">
          {index > 0 && (
            <button type="button" className="link" onClick={() => setIndex((i) => i - 1)}>
              Voltar
            </button>
          )}
          {isLast ? (
            <button type="button" onClick={finish} disabled={finishing}>
              Concluir
            </button>
          ) : (
            <button type="button" onClick={() => setIndex((i) => i + 1)}>
              Próximo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
