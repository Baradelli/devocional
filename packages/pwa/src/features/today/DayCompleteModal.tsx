import type { AchievementView } from '@devocional/shared';
import { useEffect, useRef, useState } from 'react';

import { TreeCanvas } from '../../components/TreeCanvas.js';
import { Confetti, FruitDrop, MilestoneStamp, PlusOne } from '../../components/TreeCelebration.js';
import { growthFor, stageForStreak } from '../../gamification/treeGrowth.js';
import { treeView } from '../../gamification/treeView.js';
import { useGrowthAnimation } from '../../gamification/useGrowthAnimation.js';

/** Brotar do zero até a árvore de ontem (lead-in dramático). */
const OPEN_MS = 2550;
/** O passo de hoje: de ontem até o estado novo. */
const STEP_MS = 1400;

/** Maior marco recém-concedido (prêmio do mês ganha da insígnia da semana). */
function topAchievement(achievements: AchievementView[]): AchievementView | null {
  const monthly = achievements.find((a) => a.type === 'MONTHLY_PRIZE');
  if (monthly) {
    return monthly;
  }
  return achievements.find((a) => a.type === 'WEEKLY_BADGE') ?? null;
}

export interface DayCompleteModalProps {
  /** Streak antes da conclusão de hoje. */
  from: number;
  /** Streak alvo: número do servidor (online) ou otimista; null enquanto pendente. */
  to: number | null;
  /** Conquistas recém-concedidas pelo servidor (vazio offline). */
  achievements: AchievementView[];
  onClose: () => void;
  onGoToGarden: () => void;
}

/**
 * Modal de conclusão do dia (ADR-012): a vitrine do crescimento. A árvore brota
 * do zero até a árvore de ontem (lead-in), dá o passo de hoje até o alvo (com
 * confete/"+1" e o selo do marco quando o servidor concede um) e só então revela
 * "Continuar". Não fecha sozinho.
 */
export function DayCompleteModal({
  from,
  to,
  achievements,
  onClose,
  onGoToGarden,
}: DayCompleteModalProps) {
  const { growth, set, animateTo, reduced } = useGrowthAnimation(0);
  const [celebrating, setCelebrating] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [openComplete, setOpenComplete] = useState(false);
  const stepped = useRef(false);

  const achievement = topAchievement(achievements);
  const grew = to !== null && to > from;
  const targetStreak = to ?? from;
  const view = treeView(stageForStreak(targetStreak));

  // Lead-in: a árvore brota do zero até o estado de ontem enquanto o servidor responde.
  useEffect(() => {
    if (reduced) {
      setOpenComplete(true);
      return;
    }
    animateTo(growthFor(from), OPEN_MS, () => setOpenComplete(true));
  }, [from, reduced, animateTo]);

  // Passo de hoje: assim que o lead-in termina e o alvo chega, cresce até o novo estado.
  useEffect(() => {
    if (!openComplete || to === null || stepped.current) {
      return;
    }
    stepped.current = true;
    const target = growthFor(to);
    if (reduced) {
      set(target);
      setRevealed(true);
      return;
    }
    if (!grew) {
      // Servidor disse que nada mudou (reenvio idempotente): sem "+1" falso.
      animateTo(target, STEP_MS, () => setRevealed(true));
      return;
    }
    const milestoneMs = achievement ? (achievement.type === 'MONTHLY_PRIZE' ? 2700 : 2000) : 0;
    const holdMs = Math.max(STEP_MS, milestoneMs);
    setCelebrating(true);
    animateTo(target, STEP_MS);
    const settle = window.setTimeout(() => {
      setCelebrating(false);
      setRevealed(true);
    }, holdMs);
    return () => clearTimeout(settle);
  }, [openComplete, to, grew, achievement, reduced, set, animateTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && revealed) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, onClose]);

  return (
    <div className="day-complete" role="dialog" aria-modal="true" aria-label="Dia concluído">
      <div
        className="day-complete__backdrop"
        onClick={() => revealed && onClose()}
        aria-hidden="true"
      />
      <div className="day-complete__card">
        <span className="day-complete__eyebrow">Dia concluído</span>

        <div className="day-complete__stage">
          <div className="tree-canvas tree-canvas--modal">
            <TreeCanvas growth={growth} celebrating={celebrating} />
          </div>
          {celebrating && <Confetti big={!!achievement} seed={targetStreak} />}
          {celebrating && grew && <PlusOne />}
          {celebrating && achievement && (
            <>
              {achievement.type === 'MONTHLY_PRIZE' && <FruitDrop />}
              <MilestoneStamp
                kind={achievement.type}
                label={`${String(achievement.milestone)} dias`}
                seed={achievement.milestone}
              />
            </>
          )}
        </div>

        <div className="day-complete__streak">
          <b>{targetStreak}</b>
          <span>{targetStreak === 1 ? 'dia seguido' : 'dias seguidos'}</span>
        </div>
        <p className="day-complete__name">{view.label}</p>
        <p className="day-complete__hint">{view.description}</p>

        <div className="day-complete__actions">
          {revealed ? (
            <>
              <button type="button" className="btn btn--block" onClick={onClose}>
                Continuar
              </button>
              <button type="button" className="day-complete__link" onClick={onGoToGarden}>
                Ver meu jardim
              </button>
            </>
          ) : (
            <p className="day-complete__hint" aria-live="polite">
              Sua árvore está crescendo…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
