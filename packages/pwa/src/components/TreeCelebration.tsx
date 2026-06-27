import { type CSSProperties, useMemo } from 'react';

/**
 * Efeitos de celebração da árvore, portados de docs/arvore-exemplo (ADR-012).
 * As partículas aleatórias são fixadas uma vez por montagem (useMemo) para não
 * recalcular a cada frame da animação de crescimento. Movem-se por @keyframes
 * gd-* (em styles/tree.css). Decorativos: aria-hidden, pointer-events: none.
 */

const COLORS = ['#c9a24b', '#e3c489', '#56a079', '#b9714b'];

type Styled = CSSProperties & Record<`--${string}`, string>;

/** Confete de "+1 dia": sobe e some. `big` quando muda de estágio ou bate semana. */
export function Confetti({ big, seed }: { big: boolean; seed: number }) {
  const parts = useMemo(() => {
    const n = big ? 18 : 12;
    return Array.from({ length: n }, (_, i) => {
      const leaf = Math.random() < 0.4;
      const size = 4 + Math.random() * 6;
      return {
        left: 22 + Math.random() * 56,
        bottom: 40 + Math.random() * 24,
        size,
        height: leaf ? size * 1.7 : size,
        dx: Math.random() * 64 - 32,
        dur: 1100 + Math.random() * 700,
        delay: Math.random() * 360,
        radius: leaf ? '60% 0 60% 0' : '50%',
        color: COLORS[i % COLORS.length] ?? COLORS[0]!,
      };
    });
  }, [seed, big]);

  return (
    <div className="tree-fx" aria-hidden="true">
      {parts.map((p, i) => (
        <span
          key={i}
          style={
            {
              position: 'absolute',
              left: `${p.left}%`,
              bottom: `${p.bottom}%`,
              width: `${p.size}px`,
              height: `${p.height}px`,
              background: p.color,
              borderRadius: p.radius,
              opacity: 0,
              '--dx': `${p.dx}px`,
              animation: `gd-float ${p.dur}ms cubic-bezier(.2,.6,.3,1) ${p.delay}ms forwards`,
            } as Styled
          }
        />
      ))}
    </div>
  );
}

/** Rótulo "+1 dia" subindo do alto da copa. */
export function PlusOne() {
  return (
    <div
      className="tree-fx__plus"
      aria-hidden="true"
      style={{ animation: 'gd-plus 1400ms cubic-bezier(.2,.6,.3,1) forwards' }}
    >
      +1 dia
    </div>
  );
}

/** Fruto dourado caindo da copa (prêmio mensal). */
export function FruitDrop() {
  return (
    <div
      className="tree-fx__fruit"
      aria-hidden="true"
      style={
        {
          '--fall': '178px',
          animation: 'gd-fall 1500ms cubic-bezier(.45,.05,.55,.95) forwards',
        } as Styled
      }
    >
      <div className="tree-fx__fruit-body" />
      <div className="tree-fx__fruit-leaf" />
    </div>
  );
}

const treeGlyph = (
  <svg
    width={26}
    height={26}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 22v-6" />
    <path d="M12 16c3.3 0 5.5-2.4 5.5-5.4 0-1.7-.9-3.3-2.3-4.2C15 4.1 13.7 2.5 12 2.5S9 4.1 8.8 6.4C7.4 7.3 6.5 8.9 6.5 10.6 6.5 13.6 8.7 16 12 16Z" />
  </svg>
);

const flowerGlyph = (
  <svg width={27} height={27} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <ellipse key={a} cx={12} cy={5.6} rx={2.2} ry={3.3} transform={`rotate(${a} 12 12)`} />
    ))}
    <circle cx={12} cy={12} r={2.3} fill="#9a7526" />
  </svg>
);

/** Chuva de pétalas do prêmio mensal. */
function PetalRain({ seed }: { seed: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => ({
        left: 14 + Math.random() * 72,
        dur: 1400 + Math.random() * 700,
        delay: Math.random() * 520,
        color: i % 2 ? '#c9a24b' : '#3f8560',
      })),
    [seed],
  );
  return (
    <>
      {petals.map((p, i) => (
        <div
          key={i}
          className="tree-fx__petal"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animation: `gd-petal ${p.dur}ms cubic-bezier(.3,.2,.5,1) ${p.delay}ms forwards`,
          }}
        />
      ))}
    </>
  );
}

/** Faíscas douradas da insígnia semanal. */
function Sparks({ seed }: { seed: number }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        left: 28 + Math.random() * 44,
        bottom: 42 + Math.random() * 16,
        dx: Math.random() * 52 - 26,
        dur: 1000 + Math.random() * 520,
        delay: Math.random() * 220,
        color: i % 2 ? '#c9a24b' : '#e3c489',
      })),
    [seed],
  );
  return (
    <>
      {sparks.map((p, i) => (
        <span
          key={i}
          className="tree-fx__spark"
          style={
            {
              left: `${p.left}%`,
              bottom: `${p.bottom}%`,
              background: p.color,
              '--dx': `${p.dx}px`,
              animation: `gd-float ${p.dur}ms ease-out ${p.delay}ms forwards`,
            } as Styled
          }
        />
      ))}
    </>
  );
}

/** Prensa do selo de marco: insígnia da semana (árvore) ou prêmio do mês (flor). */
export function MilestoneStamp({
  kind,
  label,
  seed,
}: {
  kind: 'WEEKLY_BADGE' | 'MONTHLY_PRIZE';
  label: string;
  seed: number;
}) {
  const isMonth = kind === 'MONTHLY_PRIZE';
  const dur = isMonth ? 2700 : 2000;

  return (
    <div className="tree-fx" aria-hidden="true">
      {isMonth && (
        <div
          className="tree-fx__wash"
          style={{ animation: `gd-wash ${dur}ms ease-out forwards` }}
        />
      )}
      <div
        className="tree-fx__ring"
        style={{
          animation: `gd-ring ${isMonth ? 1700 : 1300}ms cubic-bezier(.2,.6,.3,1) forwards`,
        }}
      />
      {isMonth && (
        <div
          className="tree-fx__ring tree-fx__ring--soft"
          style={{ animation: 'gd-ring 1700ms cubic-bezier(.2,.6,.3,1) 280ms forwards' }}
        />
      )}
      <div
        className={`tree-fx__seal${isMonth ? ' tree-fx__seal--month' : ''}`}
        style={{ animation: `gd-stamp ${dur}ms cubic-bezier(.2,.7,.3,1) forwards` }}
      >
        {isMonth ? flowerGlyph : treeGlyph}
      </div>
      <div
        className="tree-fx__mlabel"
        style={{ animation: `gd-mlabel ${dur}ms ease-out forwards` }}
      >
        <div className="tree-fx__mlabel-title">{label}</div>
        <div className="tree-fx__mlabel-sub">
          {isMonth ? 'Mês concluído' : 'Insígnia da semana'}
        </div>
      </div>
      {isMonth ? <PetalRain seed={seed} /> : <Sparks seed={seed} />}
    </div>
  );
}
