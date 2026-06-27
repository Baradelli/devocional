/**
 * Selos do herbário (insígnia semanal e prêmio mensal). A árvore em si agora é
 * desenhada por TreeCanvas (crescimento contínuo, ADR-012); aqui ficam só os
 * selos, strings constantes auto-contidas injetadas via dangerouslySetInnerHTML.
 */

const C = {
  stem: '#5E7B43',
  leafMid: '#4F7A4A',
  leafLight: '#6E8B4E',
  fruit: '#B9714B',
  gold: '#C9A24B',
};

const leaf = (cx: number, cy: number, deg: number, fill: string, rx = 11, ry = 5): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${deg} ${cx} ${cy})" fill="${fill}"/>`;

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
