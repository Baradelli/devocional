import type { TreeStageValue } from '@devocional/shared';

import { treeView } from '../gamification/treeView.js';

interface TreeProps {
  stage: TreeStageValue;
}

/**
 * Árvore-assinatura: cresce com o `treeStage` (autoridade do servidor). O
 * crescimento é parametrizado pelo nível; ao quebrar o streak, o servidor
 * devolve `SEED` e a árvore volta gentilmente à semente (sem punir).
 */
export function Tree({ stage }: TreeProps) {
  const { level, label, description } = treeView(stage);

  const trunkHeight = level === 0 ? 0 : 18 + level * 12;
  const trunkTop = 124 - trunkHeight;
  const trunkWidth = 4 + level * 1.4;
  const canopyRadius = level <= 1 ? 0 : 10 + level * 4;
  const hasRoots = level >= 4;
  const isFruiting = level === 6;

  return (
    <figure className="tree" aria-label={`Árvore no estágio: ${label}`}>
      <svg viewBox="0 0 120 140" role="img" className="tree-svg">
        {/* Terra */}
        <ellipse cx="60" cy="126" rx="44" ry="9" className="tree-ground" />

        {/* Raízes visíveis a partir do tronco firme */}
        {hasRoots && (
          <path
            d="M60 124 C50 130 42 130 36 132 M60 124 C70 130 78 130 84 132"
            className="tree-roots"
            fill="none"
          />
        )}

        {/* Semente recém-plantada */}
        {level === 0 && <ellipse cx="60" cy="120" rx="7" ry="5" className="tree-seed" />}

        {/* Tronco */}
        {trunkHeight > 0 && (
          <rect
            x={60 - trunkWidth / 2}
            y={trunkTop}
            width={trunkWidth}
            height={trunkHeight}
            rx={trunkWidth / 2}
            className="tree-trunk"
          />
        )}

        {/* Broto: duas folhinhas */}
        {level === 1 && (
          <>
            <ellipse cx="54" cy={trunkTop} rx="6" ry="3.5" className="tree-leaf" />
            <ellipse cx="66" cy={trunkTop - 2} rx="6" ry="3.5" className="tree-leaf" />
          </>
        )}

        {/* Copa: aglomerado de folhagem que adensa por nível */}
        {canopyRadius > 0 && (
          <g className="tree-canopy">
            <circle cx="60" cy={trunkTop} r={canopyRadius} />
            <circle cx={60 - canopyRadius * 0.6} cy={trunkTop + 4} r={canopyRadius * 0.7} />
            <circle cx={60 + canopyRadius * 0.6} cy={trunkTop + 4} r={canopyRadius * 0.7} />
            {level >= 5 && (
              <>
                <circle
                  cx={60 - canopyRadius * 0.4}
                  cy={trunkTop - canopyRadius * 0.6}
                  r={canopyRadius * 0.6}
                />
                <circle
                  cx={60 + canopyRadius * 0.4}
                  cy={trunkTop - canopyRadius * 0.6}
                  r={canopyRadius * 0.6}
                />
              </>
            )}
          </g>
        )}

        {/* Floração/frutos */}
        {isFruiting && (
          <g className="tree-bloom">
            <circle cx="48" cy={trunkTop - 2} r="3" />
            <circle cx="72" cy={trunkTop + 2} r="3" />
            <circle cx="60" cy={trunkTop - canopyRadius * 0.5} r="3" />
            <circle cx="66" cy={trunkTop + 10} r="3" />
          </g>
        )}
      </svg>
      <figcaption className="tree-caption">
        <span className="tree-stage">{label}</span>
        <span className="muted">{description}</span>
      </figcaption>
    </figure>
  );
}
