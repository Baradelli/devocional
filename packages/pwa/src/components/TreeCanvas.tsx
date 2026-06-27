import { createElement as E, type ReactNode } from 'react';

import { interp } from '../gamification/treeGrowth.js';

/**
 * Árvore-assinatura desenhada a partir do crescimento contínuo `g` (0→6),
 * portada do protótipo de design (docs/arvore-exemplo, ADR-012). Tronco em
 * fita de largura variável, copa em camadas com luz vinda do canto superior
 * esquerdo, e estágios que emergem por escala/opacidade conforme `g` sobe.
 * Paleta hardcoded de propósito: a árvore é independente de tema.
 */

const C = {
  barkDark: '#3c2a1a',
  bark: '#6b4e34',
  barkLite: '#9a7449',
  barkSh: '#2a1d12',
  gDeep: '#1c5238',
  gMid: '#2f7150',
  gMid2: '#3f8560',
  gLite: '#5ba87f',
  gSheen: '#86c39a',
  fruit: '#b9714b',
  fruitLite: '#d7956c',
  gold: '#c9a24b',
  goldLite: '#ecd29a',
  blossom: '#f5e4d6',
  blossomSh: '#e8cdb8',
  blossomCtr: '#d9a85a',
  soil: '#b39a72',
  soilD: '#8f7551',
  soilL: '#cdb488',
  sprout: '#6aa15e',
} as const;

function gradient(id: string, hi: string, mid: string, lo: string): ReactNode {
  return E(
    'radialGradient',
    { id, cx: '42%', cy: '34%', r: '72%' },
    E('stop', { offset: '0%', stopColor: hi }),
    E('stop', { offset: '52%', stopColor: mid }),
    E('stop', { offset: '100%', stopColor: lo }),
  );
}

export interface TreeCanvasProps {
  /** Crescimento contínuo 0→6 (ver growthFor). */
  growth: number;
  /** Balanço suave ao vento (desligado em prefers-reduced-motion via CSS). */
  wind?: boolean;
  /** Realça o brilho dourado durante uma celebração. */
  celebrating?: boolean;
}

export function TreeCanvas({
  growth: g,
  wind = true,
  celebrating = false,
}: TreeCanvasProps): ReactNode {
  const c01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);
  const eoc = (t: number): number => 1 - Math.pow(1 - t, 3);
  const eob = (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const rev = (a: number, b: number): number => Math.max(0, eob(c01((g - a) / (b - a))));
  const ramp = (a: number, b: number): number => c01((g - a) / (b - a));
  const scaleAbout = (x: number, y: number, s: number): string =>
    `translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`;

  const tScale = interp(
    [
      [1.8, 0.3],
      [2.5, 0.46],
      [3, 0.57],
      [4, 0.73],
      [5, 0.9],
      [6, 1],
    ],
    g,
  );
  const seedOp = 1 - ramp(1.9, 2.6);

  /* ---- ground ---- */
  const shRx = interp(
    [
      [0, 30],
      [6, 104],
    ],
    g,
  );
  const shRy = interp(
    [
      [0, 8],
      [6, 17],
    ],
    g,
  );
  const grassOp = ramp(2.4, 3.4);
  const flowerOp = ramp(5.0, 5.7);
  const flowerSc = rev(5.0, 5.7);
  const blade = (x: number, h: number, lean: number, col: string, k: number): ReactNode =>
    E('path', {
      key: 'gb' + String(k),
      d: `M${x},301 Q${x + lean * 0.5},${301 - h * 0.6} ${x + lean},${301 - h}`,
      stroke: col,
      strokeWidth: 1.8,
      fill: 'none',
      strokeLinecap: 'round',
      opacity: grassOp,
    });
  const miniFlower = (x: number, y: number, col: string, k: number): ReactNode =>
    E(
      'g',
      {
        key: 'mf' + String(k),
        opacity: flowerOp,
        style: {
          transformBox: 'fill-box',
          transformOrigin: 'center',
          transform: `scale(${flowerSc})`,
        },
      },
      ...[0, 72, 144, 216, 288].map((a) =>
        E('ellipse', {
          key: a,
          cx: x,
          cy: y - 2.4,
          rx: 1.1,
          ry: 1.7,
          fill: col,
          transform: `rotate(${a} ${x} ${y})`,
        }),
      ),
      E('circle', { cx: x, cy: y, r: 1.1, fill: C.gold }),
    );
  const ground = E(
    'g',
    { key: 'gnd' },
    E('ellipse', { cx: 160, cy: 311, rx: shRx + 16, ry: shRy + 5, fill: 'rgba(18,38,24,0.05)' }),
    E('ellipse', { cx: 160, cy: 308, rx: shRx + 6, ry: shRy + 1, fill: 'rgba(18,38,24,0.09)' }),
    E('ellipse', { cx: 160, cy: 307, rx: shRx, ry: shRy, fill: 'rgba(18,38,24,0.14)' }),
    E('line', {
      x1: 52,
      y1: 301,
      x2: 268,
      y2: 301,
      stroke: 'rgba(120,108,78,0.24)',
      strokeWidth: 1,
      strokeDasharray: '2 6',
    }),
    E('ellipse', { cx: 160, cy: 301, rx: 58, ry: 13, fill: C.soilD }),
    E('ellipse', { cx: 160, cy: 300, rx: 56, ry: 12, fill: C.soil }),
    E('ellipse', { cx: 160, cy: 297, rx: 42, ry: 8, fill: C.soilL, opacity: 0.85 }),
    E('circle', { cx: 126, cy: 303, r: 2.2, fill: C.soilD }),
    E('circle', { cx: 196, cy: 304, r: 1.7, fill: C.soilD }),
    E('circle', { cx: 178, cy: 299, r: 1.3, fill: C.soilL }),
    blade(114, 12, -5, C.gMid, 1),
    blade(120, 17, 1, C.gDeep, 2),
    blade(128, 13, 4, C.gMid, 3),
    blade(150, 11, -4, C.gMid2, 4),
    blade(168, 10, 3, C.gMid, 5),
    blade(190, 15, 5, C.gDeep, 6),
    blade(196, 11, -2, C.gMid, 7),
    blade(204, 14, 4, C.gMid2, 8),
    miniFlower(120, 296, C.blossom, 1),
    miniFlower(202, 298, C.blossom, 2),
    miniFlower(176, 295, '#f0d9c4', 3),
    E(
      'g',
      { key: 'fallpetal', opacity: flowerOp },
      E('ellipse', {
        cx: 138,
        cy: 303,
        rx: 2.4,
        ry: 1.3,
        fill: C.blossomSh,
        transform: 'rotate(20 138 303)',
      }),
      E('ellipse', {
        cx: 186,
        cy: 305,
        rx: 2.4,
        ry: 1.3,
        fill: C.blossom,
        transform: 'rotate(-15 186 305)',
      }),
      E('ellipse', {
        cx: 160,
        cy: 306,
        rx: 2.2,
        ry: 1.2,
        fill: C.blossomSh,
        transform: 'rotate(8 160 306)',
      }),
    ),
  );

  /* ---- seedling (early stages) ---- */
  const stemT = eoc(c01((g - 0.4) / (1.3 - 0.4)));
  const topY = 300 - 56 * stemT;
  const leafT = rev(0.85, 1.6);
  const budT = rev(1.3, 1.9);
  const seedling = E(
    'g',
    { key: 'sd', opacity: seedOp, style: { display: seedOp <= 0.01 ? 'none' : 'block' } },
    E('ellipse', {
      cx: 163,
      cy: 295,
      rx: 5.5,
      ry: 8.5,
      fill: C.barkDark,
      transform: 'rotate(22 163 295)',
      opacity: 1 - ramp(0.5, 1.0),
    }),
    E('path', {
      d: `M160,301 Q157,${300 - 28 * stemT} 160,${topY}`,
      stroke: C.sprout,
      strokeWidth: 3.4,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    E(
      'g',
      { transform: scaleAbout(160, topY, leafT) },
      E('path', {
        d: `M160,${topY + 2} Q140,${topY - 2} 134,${topY - 12} Q150,${topY - 12} 160,${topY + 1} Z`,
        fill: '#6aa15e',
      }),
      E('path', {
        d: `M160,${topY + 2} Q180,${topY - 2} 186,${topY - 12} Q170,${topY - 12} 160,${topY + 1} Z`,
        fill: C.gLite,
      }),
      E('line', {
        x1: 160,
        y1: topY + 1,
        x2: 137,
        y2: topY - 9,
        stroke: C.gDeep,
        strokeWidth: 0.8,
        opacity: 0.35,
      }),
      E('line', {
        x1: 160,
        y1: topY + 1,
        x2: 183,
        y2: topY - 9,
        stroke: C.gDeep,
        strokeWidth: 0.8,
        opacity: 0.35,
      }),
    ),
    E(
      'g',
      { transform: scaleAbout(160, topY, budT) },
      E('path', {
        d: `M160,${topY - 4} Q156,${topY - 15} 160,${topY - 18} Q164,${topY - 15} 160,${topY - 4} Z`,
        fill: C.gLite,
      }),
    ),
  );

  /* ---- trunk (variable-width ribbon + bark) ---- */
  const trunkW = interp(
    [
      [1.8, 0.5],
      [3, 0.8],
      [4.5, 1.0],
      [6, 1.16],
    ],
    g,
  );
  const CLN: [number, number][] = [
    [160, 301],
    [159, 276],
    [161, 250],
    [158, 224],
    [160, 200],
    [161, 182],
    [160, 168],
  ];
  const HW = [16.5, 12.5, 9.8, 7.6, 5.8, 4.4, 3.2].map((w) => w * trunkW);
  const norm = (pts: [number, number][], i: number): [number, number] => {
    const a = pts[Math.max(0, i - 1)] ?? pts[i] ?? [0, 0];
    const b = pts[Math.min(pts.length - 1, i + 1)] ?? pts[i] ?? [0, 0];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    return [-dy / L, dx / L];
  };
  const smooth = (pts: [number, number][]): string => {
    const head = pts[0] ?? [0, 0];
    let d = head[0].toFixed(1) + ',' + head[1].toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      if (!p || !q) {
        continue;
      }
      const mx = ((p[0] + q[0]) / 2).toFixed(1);
      const my = ((p[1] + q[1]) / 2).toFixed(1);
      d += ' Q ' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ' ' + mx + ',' + my;
    }
    const last = pts[pts.length - 1] ?? [0, 0];
    d += ' L ' + last[0].toFixed(1) + ',' + last[1].toFixed(1);
    return d;
  };
  const sideA: [number, number][] = [];
  const sideB: [number, number][] = [];
  CLN.forEach((p, i) => {
    const n = norm(CLN, i);
    const w = HW[i] ?? 0;
    sideA.push([p[0] + n[0] * w, p[1] + n[1] * w]);
    sideB.push([p[0] - n[0] * w, p[1] - n[1] * w]);
  });
  const trunkPath = 'M ' + smooth(sideA) + ' L ' + smooth(sideB.slice().reverse()) + ' Z';
  const taper = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    w0: number,
    w1: number,
  ): string => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return `M${(x0 + nx * w0).toFixed(1)},${(y0 + ny * w0).toFixed(1)} L${(x1 + nx * w1).toFixed(1)},${(y1 + ny * w1).toFixed(1)} L${(x1 - nx * w1).toFixed(1)},${(y1 - ny * w1).toFixed(1)} L${(x0 - nx * w0).toFixed(1)},${(y0 - ny * w0).toFixed(1)} Z`;
  };
  const roots = E(
    'g',
    { key: 'rt' },
    E('path', { d: taper(150, 298, 120, 305, 7 * trunkW, 1.2 * trunkW), fill: C.bark }),
    E('path', { d: taper(154, 300, 132, 308, 6 * trunkW, 1 * trunkW), fill: C.barkDark }),
    E('path', { d: taper(170, 298, 202, 305, 7 * trunkW, 1.2 * trunkW), fill: C.bark }),
    E('path', { d: taper(166, 300, 188, 309, 6 * trunkW, 1 * trunkW), fill: C.barkDark }),
  );
  const woodGrp = E(
    'g',
    { key: 'wd' },
    roots,
    E('path', { key: 'tk', d: trunkPath, fill: 'url(#gdBark)' }),
    E('path', {
      key: 'thi',
      d: 'M ' + smooth(sideB),
      fill: 'none',
      stroke: C.barkLite,
      strokeWidth: Math.max(0.6, 2.0 * trunkW),
      strokeLinecap: 'round',
      opacity: 0.45,
    }),
    E('path', {
      key: 'tsh',
      d: 'M ' + smooth(sideA),
      fill: 'none',
      stroke: C.barkSh,
      strokeWidth: Math.max(0.6, 2.6 * trunkW),
      strokeLinecap: 'round',
      opacity: 0.3,
    }),
    E('line', {
      key: 'ln1',
      x1: 158,
      y1: 262,
      x2: 163,
      y2: 261,
      stroke: C.barkSh,
      strokeWidth: 1,
      opacity: 0.4,
    }),
    E('line', {
      key: 'ln2',
      x1: 157,
      y1: 238,
      x2: 162,
      y2: 237.5,
      stroke: C.barkSh,
      strokeWidth: 1,
      opacity: 0.35,
    }),
  );
  const branches = E(
    'g',
    { key: 'br', opacity: c01(ramp(2.6, 3.4)) },
    E('path', { d: taper(151, 214, 130, 194, 4.6 * trunkW, 2.4 * trunkW), fill: C.bark }),
    E('path', { d: taper(130, 194, 116, 176, 2.4 * trunkW, 1.1 * trunkW), fill: C.barkLite }),
    E('path', { d: taper(169, 210, 192, 190, 4.6 * trunkW, 2.4 * trunkW), fill: C.bark }),
    E('path', { d: taper(192, 190, 208, 174, 2.4 * trunkW, 1.1 * trunkW), fill: C.bark }),
  );

  /* ---- canopy (layered puffs with consistent light from upper-left) ---- */
  const puff = (
    cx: number,
    cy: number,
    r: number,
    grad: string,
    k: string,
    a: number,
    b: number,
  ): ReactNode =>
    E('circle', {
      key: k,
      cx,
      cy,
      r,
      fill: `url(#${grad})`,
      style: {
        transformBox: 'fill-box',
        transformOrigin: 'center',
        transform: `scale(${rev(a, b)})`,
        opacity: c01(ramp(a, a + 0.3)),
      },
    });
  const BACK: [number, number, number, string, number, number][] = [
    [160, 60, 33, 'gdDeep', 2.8, 3.6],
    [130, 72, 29, 'gdDeep', 2.6, 3.4],
    [190, 72, 29, 'gdDeep', 2.7, 3.5],
    [100, 98, 29, 'gdDeep', 2.3, 3.1],
    [220, 98, 29, 'gdDeep', 2.4, 3.2],
    [90, 130, 29, 'gdDeep', 2.1, 2.9],
    [230, 130, 29, 'gdDeep', 2.2, 3.0],
    [106, 160, 27, 'gdDeep', 2.2, 3.0],
    [214, 160, 27, 'gdDeep', 2.3, 3.1],
    [134, 174, 27, 'gdDeep', 2.4, 3.2],
    [186, 174, 27, 'gdDeep', 2.5, 3.3],
    [160, 178, 25, 'gdDeep', 2.6, 3.4],
    [160, 112, 55, 'gdDeep', 1.8, 2.6],
    [132, 128, 40, 'gdDeep', 1.9, 2.7],
    [188, 128, 40, 'gdDeep', 2.0, 2.8],
  ];
  const MID: [number, number, number, string, number, number][] = [
    [152, 106, 40, 'gdMid', 2.4, 3.2],
    [180, 120, 34, 'gdMid2', 2.6, 3.4],
    [124, 124, 30, 'gdMid', 2.5, 3.3],
    [196, 128, 28, 'gdMid2', 2.7, 3.5],
    [160, 150, 30, 'gdMid', 2.3, 3.1],
    [140, 86, 26, 'gdMid2', 2.9, 3.7],
    [184, 88, 26, 'gdMid', 3.0, 3.8],
    [110, 140, 22, 'gdMid2', 2.4, 3.2],
    [214, 142, 22, 'gdMid', 2.5, 3.3],
    [160, 108, 34, 'gdMid2', 2.2, 3.0],
  ];
  const LITE: [number, number, number, string, number, number][] = [
    [130, 90, 26, 'gdLite', 3.3, 4.1],
    [160, 96, 23, 'gdLite', 3.5, 4.3],
    [114, 114, 20, 'gdLite', 3.2, 4.0],
    [144, 118, 21, 'gdLite', 3.6, 4.4],
    [184, 106, 19, 'gdLite', 3.7, 4.5],
    [128, 138, 17, 'gdLite', 3.4, 4.2],
    [122, 104, 16, 'gdLite', 3.5, 4.3],
    [176, 126, 17, 'gdLite', 3.8, 4.6],
  ];
  const SHEEN: [number, number, number, string, number, number][] = [
    [124, 82, 14, 'gdSheen', 3.9, 4.7],
    [150, 86, 13, 'gdSheen', 4.0, 4.8],
    [110, 102, 12, 'gdSheen', 3.9, 4.7],
    [136, 106, 12, 'gdSheen', 4.2, 5.0],
    [166, 94, 11, 'gdSheen', 4.3, 5.1],
  ];
  const flecks: ReactNode[] = [];
  const FA = [-92, -68, -44, -22, -2, 18, 40, 64, 90, 116, 140, 164, 182, 200, 224, 250];
  FA.forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const wob = 0.92 + 0.08 * Math.sin(i * 1.3);
    const x = 160 + Math.cos(a) * 82 * wob;
    const y = 116 + Math.sin(a) * 72 * wob;
    const rot = deg + 96;
    const aa = 3.6 + (i % 6) * 0.08;
    const bb = 4.3 + (i % 6) * 0.08;
    flecks.push(
      E('ellipse', {
        key: 'fk' + String(i),
        cx: x.toFixed(1),
        cy: y.toFixed(1),
        rx: 3,
        ry: 6,
        fill: i % 2 ? C.gMid2 : C.gLite,
        style: {
          transformBox: 'fill-box',
          transformOrigin: 'center',
          transform: `rotate(${rot.toFixed(0)}deg) scale(${rev(aa, bb).toFixed(2)})`,
          opacity: c01(ramp(aa, aa + 0.3)),
        },
      }),
    );
  });
  const holes = E(
    'g',
    { key: 'holes', opacity: c01(ramp(4.6, 5.2)) * 0.5 },
    E('ellipse', {
      cx: 150,
      cy: 132,
      rx: 6,
      ry: 4,
      fill: C.gDeep,
      transform: 'rotate(20 150 132)',
    }),
    E('ellipse', { cx: 178, cy: 112, rx: 5, ry: 3.5, fill: C.gDeep }),
  );
  const undershade = E('ellipse', {
    key: 'usd',
    cx: 160,
    cy: 158,
    rx: 66,
    ry: 30,
    fill: C.gDeep,
    opacity: 0.22 * c01(ramp(3.6, 4.5)),
  });

  const BL: [number, number][] = [
    [118, 96],
    [140, 82],
    [166, 88],
    [104, 120],
    [128, 104],
    [152, 116],
    [184, 102],
    [198, 124],
    [120, 140],
    [172, 132],
  ];
  const blossoms = BL.map((o, i) => {
    const a = 4.9 + (i % 5) * 0.06;
    const b = 5.5 + (i % 5) * 0.06;
    return E(
      'g',
      {
        key: 'bl' + String(i),
        style: {
          transformBox: 'fill-box',
          transformOrigin: 'center',
          transform: `scale(${rev(a, b)})`,
          opacity: c01(ramp(a, a + 0.3)),
        },
      },
      ...[0, 72, 144, 216, 288].map((deg) =>
        E('ellipse', {
          key: deg,
          cx: o[0],
          cy: o[1] - 2.6,
          rx: 1.7,
          ry: 2.6,
          fill: i % 3 ? C.blossom : C.blossomSh,
          transform: `rotate(${deg} ${o[0]} ${o[1]})`,
        }),
      ),
      E('circle', { cx: o[0], cy: o[1], r: 1.5, fill: C.blossomCtr }),
    );
  });
  const FR: [number, number, number, string, number, number][] = [
    [116, 152, 5.5, 'gold', 5.4, 5.9],
    [204, 150, 5.5, 'gold', 5.6, 6.1],
    [152, 174, 5.5, 'gold', 5.7, 6.2],
    [132, 134, 4.3, 'gold', 5.5, 6.0],
    [190, 132, 4.3, 'gold', 5.8, 6.2],
    [104, 132, 5, 'fruit', 5.3, 5.8],
    [216, 134, 5, 'fruit', 5.5, 6.0],
    [168, 162, 4.5, 'fruit', 5.6, 6.1],
  ];
  const fruits = FR.map((o, i) => {
    const isGold = o[3] === 'gold';
    return E(
      'g',
      {
        key: 'fr' + String(i),
        style: {
          transformBox: 'fill-box',
          transformOrigin: 'center',
          transform: `scale(${rev(o[4], o[5])})`,
          opacity: c01(ramp(o[4], o[4] + 0.25)),
        },
      },
      E('path', {
        d: `M${o[0]},${o[1] - o[2]} q-1,-3 1.4,-4.2`,
        stroke: C.bark,
        strokeWidth: 1,
        fill: 'none',
        strokeLinecap: 'round',
      }),
      E('circle', {
        cx: o[0],
        cy: o[1],
        r: o[2],
        fill: isGold ? 'url(#gdFruitGold)' : 'url(#gdFruitRed)',
      }),
      E('circle', {
        cx: o[0] - o[2] * 0.32,
        cy: o[1] - o[2] * 0.34,
        r: o[2] * 0.32,
        fill: isGold ? C.goldLite : C.fruitLite,
        opacity: 0.85,
      }),
    );
  });

  const canopy = E(
    'g',
    { key: 'cp', className: 'gd-bob' },
    ...BACK.map((o, i) => puff(o[0], o[1], o[2], o[3], 'bk' + String(i), o[4], o[5])),
    undershade,
    ...MID.map((o, i) => puff(o[0], o[1], o[2], o[3], 'md' + String(i), o[4], o[5])),
    holes,
    ...LITE.map((o, i) => puff(o[0], o[1], o[2], o[3], 'lt' + String(i), o[4], o[5])),
    ...SHEEN.map((o, i) => puff(o[0], o[1], o[2], o[3], 'sn' + String(i), o[4], o[5])),
    ...flecks,
    ...blossoms,
    ...fruits,
  );

  const glowOp = c01((g - 4.4) / 1.6) * 0.18 + (celebrating ? 0.2 : 0);
  const glow = E(
    'g',
    { key: 'gl' },
    E('ellipse', { cx: 152, cy: 108, rx: 132, ry: 120, fill: 'url(#gdGlow)', opacity: glowOp }),
    E('ellipse', { cx: 150, cy: 96, rx: 70, ry: 62, fill: 'url(#gdGlow)', opacity: glowOp * 0.7 }),
  );

  const treeSystem = E(
    'g',
    { key: 'ts', transform: scaleAbout(160, 300, tScale) },
    glow,
    woodGrp,
    branches,
    canopy,
  );
  const sway = E('g', { key: 'sw', className: wind ? 'gd-sway' : '' }, treeSystem, seedling);

  return E(
    'svg',
    {
      viewBox: '0 0 320 330',
      width: '100%',
      height: '100%',
      preserveAspectRatio: 'xMidYMax meet',
      style: { overflow: 'visible', display: 'block', position: 'absolute', inset: 0 },
    },
    E(
      'defs',
      null,
      gradient('gdDeep', '#2a6a48', '#1c5238', '#133b29'),
      gradient('gdMid', '#4c9670', '#2f7150', '#21563c'),
      gradient('gdMid2', '#62a585', '#3f8560', '#2c694b'),
      gradient('gdLite', '#93cda9', '#5ba87f', '#418463'),
      gradient('gdSheen', '#cbe6cf', '#86c39a', '#5ba87f'),
      E(
        'linearGradient',
        { id: 'gdBark', gradientUnits: 'userSpaceOnUse', x1: 140, y1: 0, x2: 182, y2: 0 },
        E('stop', { offset: '0%', stopColor: '#8a6238' }),
        E('stop', { offset: '46%', stopColor: '#6b4e34' }),
        E('stop', { offset: '100%', stopColor: '#41301e' }),
      ),
      E(
        'radialGradient',
        { id: 'gdFruitGold', cx: '38%', cy: '32%', r: '72%' },
        E('stop', { offset: '0%', stopColor: '#f3dca0' }),
        E('stop', { offset: '55%', stopColor: '#c9a24b' }),
        E('stop', { offset: '100%', stopColor: '#8a6422' }),
      ),
      E(
        'radialGradient',
        { id: 'gdFruitRed', cx: '38%', cy: '32%', r: '72%' },
        E('stop', { offset: '0%', stopColor: '#e0a079' }),
        E('stop', { offset: '55%', stopColor: '#b9714b' }),
        E('stop', { offset: '100%', stopColor: '#7a3520' }),
      ),
      E(
        'radialGradient',
        { id: 'gdGlow' },
        E('stop', { offset: '0%', stopColor: '#ecd29a', stopOpacity: 0.9 }),
        E('stop', { offset: '70%', stopColor: '#c9a24b', stopOpacity: 0 }),
      ),
    ),
    ground,
    sway,
  );
}
