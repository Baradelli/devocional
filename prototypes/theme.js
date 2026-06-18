/* ============================================================
   Troca de tema — botão flutuante (canto inferior esquerdo).
   Persiste a escolha em localStorage e aplica em todas as telas.
   ============================================================ */
(function () {
  const KEY = 'devo-theme';
  const THEMES = [
    { id: 'aconchego', name: 'Aconchego', swatch: '#f4efe4', accent: '#3e6b47' },
    { id: 'sereno', name: 'Sereno', swatch: '#eef1ed', accent: '#3f6e5e' },
    { id: 'claro', name: 'Claro', swatch: '#ffffff', accent: '#3c6b45' },
    { id: 'escuro', name: 'Escuro', swatch: '#1e2329', accent: '#6fa06a' },
  ];

  // aplica o tema o quanto antes (evita flash)
  let currentId = localStorage.getItem(KEY) || 'aconchego';
  document.documentElement.setAttribute('data-theme', currentId);

  function apply(id) {
    currentId = id;
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem(KEY, id);
    document.querySelectorAll('.theme-switch__menu button').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.themeId === id);
    });
  }

  function build() {
    if (document.querySelector('.theme-switch')) return;
    const wrap = document.createElement('div');
    wrap.className = 'theme-switch';
    wrap.innerHTML = `
      <button class="theme-switch__btn" aria-label="Mudar tema" aria-expanded="false">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/>
          <path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/>
        </svg>
      </button>
      <div class="theme-switch__menu" hidden role="menu">
        ${THEMES.map(
          (t) => `
          <button role="menuitem" data-theme-id="${t.id}"${t.id === currentId ? ' class="is-active"' : ''}>
            <span class="theme-switch__dot" style="--swatch:${t.swatch};--accent:${t.accent}"></span>
            ${t.name}
          </button>`,
        ).join('')}
      </div>`;
    document.body.appendChild(wrap);

    const btn = wrap.querySelector('.theme-switch__btn');
    const menu = wrap.querySelector('.theme-switch__menu');
    const toggle = (open) => {
      const show = open ?? menu.hidden;
      menu.hidden = !show;
      btn.setAttribute('aria-expanded', String(show));
    };
    btn.addEventListener('click', () => toggle());
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-theme-id]');
      if (!b) return;
      apply(b.dataset.themeId);
      toggle(false);
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) toggle(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) toggle(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
