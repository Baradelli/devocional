import { useState } from 'react';

import { TOUR_STEPS } from '../onboarding/tour.js';

interface OnboardingProps {
  /** Chamado ao concluir ou pular o tour. */
  onFinish: () => void | Promise<void>;
}

/** Tour inicial em tela cheia. Navega pelos passos versionados (PT-BR). */
export function Onboarding({ onFinish }: OnboardingProps) {
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const step = TOUR_STEPS[index];
  const isLast = index === TOUR_STEPS.length - 1;

  const finish = () => {
    setFinishing(true);
    void Promise.resolve(onFinish());
  };

  if (!step) {
    return null;
  }

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Introdução">
      <div className="tour-card">
        <button type="button" className="link tour-skip" onClick={finish} disabled={finishing}>
          Pular
        </button>

        <div className="tour-body">
          <h2 className="tour-title">{step.title}</h2>
          <p>{step.body}</p>
        </div>

        <div className="tour-dots" aria-hidden="true">
          {TOUR_STEPS.map((tourStep, i) => (
            <span key={tourStep.title} className={i === index ? 'dot active' : 'dot'} />
          ))}
        </div>

        <div className="tour-nav">
          {index > 0 && (
            <button type="button" className="link" onClick={() => setIndex((i) => i - 1)}>
              Voltar
            </button>
          )}
          {isLast ? (
            <button type="button" onClick={finish} disabled={finishing}>
              Começar
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
