/* ============================================================
   Hoje — uma jornada de várias telas
   - roteador leve (telas deslizam por cima da home)
   - leitura bíblica em stories (toque para avançar)
   - devocional em markdown fluido
   - editor de anotação estilo markdown (título + corpo)
   - etapas concluídas fazem a haste crescer
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------- Roteador (pilha) -------------------- */
const screens = {};
document.querySelectorAll('[data-screen]').forEach((s) => (screens[s.dataset.screen] = s));
const stack = [];
const topScreen = () => stack[stack.length - 1] || null;

function openScreen(name) {
  const el = screens[name];
  if (!el || name === 'home' || topScreen() === name) return;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-open'));
  document.documentElement.style.overflow = 'hidden';
  stack.push(name);
  history.pushState({ depth: stack.length }, '');
  const focusable = el.querySelector('[data-close], [contenteditable], input');
  if (focusable) setTimeout(() => focusable.focus(), 60);
  if (name === 'reading') startStories();
}

function closeTop() {
  const name = stack.pop();
  if (!name) return;
  const el = screens[name];
  el.classList.remove('is-open');
  if (stack.length === 0) document.documentElement.style.overflow = '';
  const done = () => {
    el.hidden = true;
    el.removeEventListener('transitionend', done);
  };
  el.addEventListener('transitionend', done);
  setTimeout(() => {
    if (!el.classList.contains('is-open')) el.hidden = true;
  }, 460);
}

function goBack() {
  if (stack.length) history.back();
}

window.addEventListener('popstate', () => {
  if (stack.length) closeTop();
});

document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open]');
  if (opener) {
    openScreen(opener.dataset.open);
    return;
  }
  const closer = e.target.closest('[data-close]');
  if (closer) {
    const step = closer.dataset.complete;
    if (step) markDone(step);
    goBack();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && stack.length) goBack();
});

/* ----------------------- Progresso da jornada ---------------------- */
const order = ['verse', 'reading', 'devotional', 'prayer', 'reflection'];
const done = new Set();
const journey = document.getElementById('journey');
const finishBtn = document.getElementById('finishBtn');
const finishHint = document.getElementById('finishHint');
const finishDone = document.getElementById('finishDone');

function setCurrent() {
  document.querySelectorAll('.station').forEach((s) => s.classList.remove('is-current'));
  const next = order.find((st) => !done.has(st));
  if (next) document.querySelector(`.station[data-step="${next}"]`)?.classList.add('is-current');
}

function growStem(toBottom = false) {
  const doneNodes = [...document.querySelectorAll('.station.is-done .station__node')];
  if (toBottom) {
    journey.style.setProperty('--grown', journey.offsetHeight - 42 + 'px');
    return;
  }
  if (!doneNodes.length) {
    journey.style.setProperty('--grown', '0px');
    return;
  }
  const jt = journey.getBoundingClientRect().top;
  const last = doneNodes[doneNodes.length - 1].getBoundingClientRect();
  journey.style.setProperty('--grown', Math.max(0, last.top + last.height / 2 - jt - 14) + 'px');
}

function updateFinish() {
  const all = order.every((s) => done.has(s));
  finishBtn.disabled = !all;
  if (all) {
    finishHint.textContent = 'Tudo pronto. Encerre o dia com gratidão.';
  } else {
    const left = order.filter((s) => !done.has(s)).length;
    finishHint.textContent = `Faltam ${left} etapa${left > 1 ? 's' : ''} para encerrar o dia.`;
  }
}

function markDone(step) {
  if (done.has(step)) return;
  done.add(step);
  const li = document.querySelector(`.station[data-step="${step}"]`);
  li?.classList.add('is-done');
  setCurrent();
  requestAnimationFrame(growStem);
  updateFinish();
}

setCurrent();
updateFinish();
window.addEventListener('resize', () => growStem());

finishBtn.addEventListener('click', () => {
  if (finishBtn.disabled) return;
  finishBtn.hidden = true;
  finishHint.hidden = true;
  finishDone.hidden = false;
  growStem(true);
  if (!reduceMotion) finishDone.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

/* --------------------- Leitura bíblica (stories) ------------------- */
const verses = [
  {
    no: 'Versículo 8',
    ref: 'Efésios 2:8',
    text: 'Porque pela graça sois salvos, mediante a fé; e isto não vem de vós, é dom de Deus.',
  },
  { no: 'Versículo 9', ref: 'Efésios 2:9', text: 'Não de obras, para que ninguém se glorie.' },
  {
    no: 'Versículo 10',
    ref: 'Efésios 2:10',
    text: 'Pois somos feitura sua, criados em Cristo Jesus para boas obras, as quais Deus de antemão preparou para que andássemos nelas.',
  },
];
const storyBars = document.getElementById('storyBars');
const storyText = document.getElementById('storyText');
const storyNo = document.getElementById('storyNo');
const storyRef = document.getElementById('storyRef');
let storyIndex = 0;
let storyStarted = false;

storyBars.innerHTML = verses.map(() => '<span><i></i></span>').join('');
const barFills = [...storyBars.querySelectorAll('span')];

function renderStory() {
  const v = verses[storyIndex];
  storyText.textContent = v.text;
  storyNo.textContent = v.no;
  storyRef.textContent = v.ref;
  // reinicia a animação de entrada
  storyText.style.animation = 'none';
  void storyText.offsetWidth;
  storyText.style.animation = '';
  barFills.forEach((b, i) => b.style.setProperty('--fill', i <= storyIndex ? '100%' : '0%'));
}

function startStories() {
  if (!storyStarted) {
    storyStarted = true;
    storyIndex = 0;
  }
  renderStory();
}

function storyNext() {
  if (storyIndex < verses.length - 1) {
    storyIndex++;
    renderStory();
  } else {
    markDone('reading');
    goBack();
  }
}
function storyPrev() {
  if (storyIndex > 0) {
    storyIndex--;
    renderStory();
  }
}
document.getElementById('storyNext').addEventListener('click', storyNext);
document.getElementById('storyPrev').addEventListener('click', storyPrev);

/* ----------------------- Devocional (markdown) --------------------- */
const devotionalMd = `## Merecer ou receber?

Há uma diferença enorme entre **merecer** e *receber*. A gente cresce ouvindo que precisa ser bom o bastante — e leva isso para dentro da fé, como se Deus fosse um juiz à espera do nosso desempenho.

Mas Paulo escreve uma frase que desarma tudo:

> É dom de Deus. — Efésios 2:8

A salvação não é salário, é presente. Não há nada que você possa fazer hoje para ser **mais amado** do que já é. E não há nada que você tenha feito que te torne menos digno desse amor.

### Para levar com você
- Você já é amado, antes de qualquer esforço.
- O peso de provar o seu valor pode descer dos ombros agora.
- Hoje, descanse numa graça que já te alcançou.`;

function renderMarkdown(md) {
  const inline = (t) =>
    t
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  const lines = md.split('\n');
  let html = '';
  let list = false;
  const closeList = () => {
    if (list) {
      html += '</ul>';
      list = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith('### ')) {
      closeList();
      html += `<h3>${inline(line.slice(4))}</h3>`;
    } else if (line.startsWith('## ')) {
      closeList();
      html += `<h2>${inline(line.slice(3))}</h2>`;
    } else if (line.startsWith('> ')) {
      closeList();
      html += `<blockquote>${inline(line.slice(2))}</blockquote>`;
    } else if (line.startsWith('- ')) {
      if (!list) {
        html += '<ul>';
        list = true;
      }
      html += `<li>${inline(line.slice(2))}</li>`;
    } else {
      closeList();
      html += `<p>${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}
document.getElementById('devotionalBody').innerHTML = renderMarkdown(devotionalMd);

/* ----------------------- Áudio (mock visual) ----------------------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-audio], #prayerListen');
  if (!btn) return;
  const wasPlaying = btn.classList.contains('is-playing');
  document.querySelectorAll('.listen.is-playing').forEach((p) => p.classList.remove('is-playing'));
  if (!wasPlaying) btn.classList.add('is-playing');
});

/* ----------------------- Oração: som ambiente ---------------------- */
const ambienceBtn = document.getElementById('ambienceBtn');
let ambienceOn = true;
ambienceBtn?.addEventListener('click', () => {
  ambienceOn = !ambienceOn;
  ambienceBtn.innerHTML = `Som ambiente: <strong>${ambienceOn ? 'ligado' : 'desligado'}</strong>`;
});

/* ------------------- Semana + calendário de sequência -------------- */
const COMPLETED = new Set([3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16]);
const TODAY_DAY = 17;
const YEAR = 2026;
const MONTH = 5; // junho (0-based)
const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function dayClass(d) {
  if (d === TODAY_DAY) return 'today';
  if (COMPLETED.has(d)) return 'done';
  if (d >= 1 && d < TODAY_DAY) return 'miss';
  return 'future';
}

(function buildWeek() {
  const el = document.getElementById('weekDays');
  if (!el) return;
  const start = TODAY_DAY - new Date(YEAR, MONTH, TODAY_DAY).getDay(); // domingo da semana
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = start + i;
    const label = d >= 1 && d <= 30 ? d : '';
    html += `<li class="week__day ${dayClass(d)}"><span class="week__dow">${DOW[i]}</span><span class="week__dot">${label}</span></li>`;
  }
  el.innerHTML = html;
})();

(function buildCalendar() {
  const grid = document.getElementById('calGrid');
  if (!grid) return;
  const first = new Date(YEAR, MONTH, 1).getDay();
  const total = new Date(YEAR, MONTH + 1, 0).getDate();
  let html = '';
  for (let i = 0; i < first; i++) html += `<span class="cal__cell blank"></span>`;
  for (let d = 1; d <= total; d++) html += `<span class="cal__cell ${dayClass(d)}">${d}</span>`;
  grid.innerHTML = html;
})();
