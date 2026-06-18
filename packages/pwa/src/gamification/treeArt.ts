import type { TreeStageValue } from '@devocional/shared';

/**
 * Arte ilustrada dos 7 estágios da árvore (SVG inline, coeso com os tokens).
 * Porte do protótipo de validação. Strings constantes e auto-contidas — sem
 * entrada de usuário — então são injetadas via dangerouslySetInnerHTML.
 */

const C = {
  bark: '#7A5A3F',
  barkD: '#5E4632',
  stem: '#5E7B43',
  leafBack: '#34593B',
  leafMid: '#4F7A4A',
  leafLight: '#6E8B4E',
  fruit: '#B9714B',
  gold: '#C9A24B',
  ground: '#D9CBA9',
  groundLine: '#C6B488',
};

const GROUND = `
  <ellipse cx="120" cy="278" rx="84" ry="13" fill="#2B2922" opacity="0.06"/>
  <path d="M34 268 Q120 240 206 268 Q202 288 120 290 Q38 288 34 268Z" fill="${C.ground}"/>
  <path d="M40 267 Q120 242 200 267" fill="none" stroke="${C.groundLine}" stroke-width="2" stroke-linecap="round"/>
  <path d="M72 274 q5 -6 11 0" fill="none" stroke="${C.groundLine}" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M156 276 q5 -6 11 0" fill="none" stroke="${C.groundLine}" stroke-width="1.6" stroke-linecap="round"/>`;

const leaf = (cx: number, cy: number, deg: number, fill: string, rx = 11, ry = 5): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${deg} ${cx} ${cy})" fill="${fill}"/>`;

const svg = (inner: string): string =>
  `<svg viewBox="0 0 240 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${GROUND}${inner}</svg>`;

const canopy = (cx: number, cy: number, s: number): string => `
  <circle cx="${cx}" cy="${cy}" r="${34 * s}" fill="${C.leafBack}"/>
  <circle cx="${cx - 22 * s}" cy="${cy + 6 * s}" r="${22 * s}" fill="${C.leafMid}"/>
  <circle cx="${cx + 23 * s}" cy="${cy + 4 * s}" r="${23 * s}" fill="${C.leafMid}"/>
  <circle cx="${cx}" cy="${cy - 14 * s}" r="${24 * s}" fill="${C.leafMid}"/>
  <circle cx="${cx - 12 * s}" cy="${cy - 8 * s}" r="${14 * s}" fill="${C.leafLight}"/>
  <circle cx="${cx + 12 * s}" cy="${cy - 6 * s}" r="${13 * s}" fill="${C.leafLight}"/>`;

const flower = (x: number, y: number): string => `
  <g transform="translate(${x} ${y})">
    ${[0, 72, 144, 216, 288]
      .map(
        (a) =>
          `<circle cx="${5 * Math.cos((a * Math.PI) / 180)}" cy="${5 * Math.sin((a * Math.PI) / 180)}" r="3.6" fill="${C.gold}"/>`,
      )
      .join('')}
    <circle r="2.6" fill="${C.fruit}"/>
  </g>`;

export interface TreeStageArt {
  name: string;
  streak: number;
  hint: string;
  art: string;
}

/** Ordem espelha TREE_STAGES (SEED → FRUITING). */
export const TREE_ART: Record<TreeStageValue, TreeStageArt> = {
  SEED: {
    name: 'Semente',
    streak: 0,
    hint: 'Tudo começa aqui. Faça o devocional de hoje para plantar.',
    art: svg(`
      <ellipse cx="120" cy="260" rx="13" ry="9.5" fill="${C.bark}"/>
      <ellipse cx="115" cy="256" rx="4.5" ry="3" fill="#93714F"/>
      <path d="M120 251 q4 5 0 10" fill="none" stroke="${C.barkD}" stroke-width="1.6" stroke-linecap="round"/>`),
  },
  SPROUT: {
    name: 'Broto',
    streak: 1,
    hint: 'O primeiro dia. Um broto delicado rompe a terra.',
    art: svg(`
      <path d="M120 262 C120 246 119 236 120 226" stroke="${C.stem}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      ${leaf(104, 222, -38, C.leafLight)}
      ${leaf(136, 226, 38, C.leafMid)}`),
  },
  SEEDLING: {
    name: 'Muda',
    streak: 3,
    hint: 'Dois, três dias. As primeiras folhas se abrem.',
    art: svg(`
      <path d="M120 264 C120 232 119 206 120 184" stroke="${C.stem}" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${leaf(104, 236, -36, C.leafMid)} ${leaf(136, 240, 36, C.leafLight)}
      ${leaf(105, 214, -36, C.leafLight)} ${leaf(135, 218, 36, C.leafMid)}
      ${leaf(110, 190, -42, C.leafMid, 9, 4)} ${leaf(130, 190, 42, C.leafLight, 9, 4)}`),
  },
  BRANCHES: {
    name: 'Galhos',
    streak: 5,
    hint: 'Quatro a seis dias. Os galhos se ramificam — falta pouco para a primeira insígnia.',
    art: svg(`
      <path d="M113 268 C115 228 116 198 120 176 C124 198 125 228 127 268Z" fill="${C.bark}"/>
      <path d="M120 200 C110 196 102 190 96 183" stroke="${C.bark}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M120 210 C132 206 141 200 147 194" stroke="${C.bark}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="120" cy="164" r="24" fill="${C.leafBack}"/>
      <circle cx="104" cy="170" r="15" fill="${C.leafMid}"/>
      <circle cx="136" cy="168" r="16" fill="${C.leafMid}"/>
      <circle cx="120" cy="154" r="15" fill="${C.leafLight}"/>`),
  },
  TRUNK: {
    name: 'Tronco firme',
    streak: 8,
    hint: 'Uma semana. As raízes aparecem e você ganhou a insígnia da semana.',
    art: svg(`
      <path d="M120 270 C112 273 97 275 86 281" stroke="${C.bark}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M120 270 C128 273 145 275 156 281" stroke="${C.bark}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M120 270 C119 276 118 280 120 285" stroke="${C.bark}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M110 272 C112 226 114 198 120 172 C126 198 128 226 130 272Z" fill="${C.bark}"/>
      <path d="M120 266 V178" stroke="${C.barkD}" stroke-width="1.4" opacity="0.35"/>
      ${canopy(120, 150, 1)}`),
  },
  YOUNG_TREE: {
    name: 'Árvore jovem',
    streak: 16,
    hint: 'Duas semanas. Uma copa jovem e frondosa.',
    art: svg(`
      <path d="M120 272 C110 275 94 277 82 283" stroke="${C.bark}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      <path d="M120 272 C130 275 148 277 160 283" stroke="${C.bark}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      <path d="M108 274 C110 222 113 190 120 160 C127 190 130 222 132 274Z" fill="${C.bark}"/>
      <path d="M120 268 V166" stroke="${C.barkD}" stroke-width="1.6" opacity="0.35"/>
      ${canopy(120, 132, 1.32)}`),
  },
  FRUITING: {
    name: 'Em flor',
    streak: 34,
    hint: 'Mais de um mês. Sua árvore floresce e dá frutos — prêmio do mês.',
    art: svg(`
      <path d="M120 272 C110 275 92 277 80 283" stroke="${C.bark}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      <path d="M120 272 C130 275 150 277 162 283" stroke="${C.bark}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      <path d="M107 274 C109 220 112 188 120 158 C128 188 131 220 133 274Z" fill="${C.bark}"/>
      <path d="M120 268 V162" stroke="${C.barkD}" stroke-width="1.6" opacity="0.35"/>
      ${canopy(120, 130, 1.36)}
      <circle cx="96" cy="120" r="4.5" fill="${C.gold}"/>
      <circle cx="146" cy="128" r="4.5" fill="${C.fruit}"/>
      <circle cx="120" cy="104" r="4.5" fill="${C.gold}"/>
      <circle cx="132" cy="150" r="4.5" fill="${C.fruit}"/>
      <circle cx="104" cy="146" r="4.5" fill="${C.gold}"/>
      ${flower(80, 270)} ${flower(162, 272)}`),
  },
};

export const weeklyStamp = (earned: boolean): string => `
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="32" cy="32" r="29" fill="${earned ? '#EAF0E4' : '#F2EDE1'}" stroke="${C.leafMid}" stroke-width="1.5"/>
    <path d="M32 48 C32 40 32 30 32 21" stroke="${C.stem}" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${leaf(22, 40, -38, C.leafMid, 8, 4)} ${leaf(42, 40, 38, C.leafLight, 8, 4)}
    ${leaf(23, 30, -38, C.leafLight, 7, 3.5)} ${leaf(41, 30, 38, C.leafMid, 7, 3.5)}
    ${leaf(28, 21, -46, C.leafMid, 6, 3)} ${leaf(36, 21, 46, C.leafLight, 6, 3)}
  </svg>`;

export const monthlyStamp = (earned: boolean): string => `
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="32" cy="32" r="29" fill="${earned ? '#F7ECD4' : '#F2EDE1'}" stroke="${C.gold}" stroke-width="1.5"/>
    <g transform="translate(32 31)">
      ${[0, 60, 120, 180, 240, 300]
        .map(
          (a) =>
            `<ellipse cx="${11 * Math.cos((a * Math.PI) / 180)}" cy="${11 * Math.sin((a * Math.PI) / 180)}" rx="7" ry="4.4" transform="rotate(${a} ${11 * Math.cos((a * Math.PI) / 180)} ${11 * Math.sin((a * Math.PI) / 180)})" fill="${C.gold}"/>`,
        )
        .join('')}
      <circle r="6" fill="${C.fruit}"/>
    </g>
  </svg>`;
