/* ============================================================
   Anotações (página) — a biblioteca é a base; o editor abre
   por cima. Inclui o editor markdown e a abertura via ?new=1.
   ============================================================ */

/* --- roteador: editor sobre a biblioteca -------------------- */
const stack = [];
const topScreen = () => stack[stack.length - 1] || null;

function screenEl(name) {
  return document.querySelector(`[data-screen="${name}"]`);
}

function openScreen(name) {
  const el = screenEl(name);
  if (!el || topScreen() === name) return;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-open'));
  document.documentElement.style.overflow = 'hidden';
  stack.push(name);
  history.pushState({ depth: stack.length }, '');
  const focusable = el.querySelector('input, [contenteditable], [data-close]');
  if (focusable) setTimeout(() => focusable.focus(), 60);
}

function closeTop() {
  const name = stack.pop();
  if (!name) return;
  const el = screenEl(name);
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

/* --- preenche o editor: nota existente (data-note-*) ou nova - */
const noteTitle = document.getElementById('noteTitle');
const noteBody = document.getElementById('noteBody');

function prepareEditor(opener) {
  if (opener && opener.dataset.noteTitle != null) {
    noteTitle.value = opener.dataset.noteTitle;
    noteBody.innerHTML = opener.dataset.noteBody || '';
  } else {
    noteTitle.value = '';
    noteBody.innerHTML = '';
  }
}

document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open="note"]');
  if (opener) {
    prepareEditor(opener);
    openScreen('note');
    return;
  }
  if (e.target.closest('[data-close]')) goBack();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && stack.length) goBack();
});

/* --- editor markdown ---------------------------------------- */
const toolbar = document.querySelector('.note__toolbar');

toolbar?.addEventListener('mousedown', (e) => e.preventDefault()); // mantém a seleção
toolbar?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-cmd]');
  if (!btn) return;
  noteBody.focus();
  const cmd = btn.dataset.cmd;
  if (cmd === 'bold') document.execCommand('bold');
  else if (cmd === 'italic') document.execCommand('italic');
  else if (cmd === 'h2') document.execCommand('formatBlock', false, 'h2');
  else if (cmd === 'h3') document.execCommand('formatBlock', false, 'h3');
  else if (cmd === 'quote') document.execCommand('formatBlock', false, 'blockquote');
  else if (cmd === 'list') document.execCommand('insertUnorderedList');
  else if (cmd === 'highlight') toggleHighlight();
  refreshToolbar();
});

function toggleHighlight() {
  const sel = window.getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const existing = range.commonAncestorContainer.parentElement?.closest('mark');
  if (existing) {
    const parent = existing.parentNode;
    while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
    parent.removeChild(existing);
    return;
  }
  const mark = document.createElement('mark');
  try {
    range.surroundContents(mark);
  } catch {
    mark.appendChild(range.extractContents());
    range.insertNode(mark);
  }
  sel.removeAllRanges();
}

function refreshToolbar() {
  const state = { bold: 'bold', italic: 'italic' };
  toolbar?.querySelectorAll('button[data-cmd]').forEach((b) => {
    const cmd = state[b.dataset.cmd];
    if (cmd) b.classList.toggle('is-active', document.queryCommandState(cmd));
  });
}
document.addEventListener('selectionchange', () => {
  if (topScreen() === 'note') refreshToolbar();
});

/* --- abrir o editor em branco quando vier de ?new=1 --------- */
if (new URLSearchParams(location.search).get('new')) {
  prepareEditor(null);
  openScreen('note');
}
