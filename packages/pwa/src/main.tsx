// Fontes self-hosted (offline-first): Fraunces (display, eixos SOFT/opsz) e
// Mulish (corpo/UI). "full" traz todos os eixos variáveis do Fraunces.
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/mulish';
import '@fontsource-variable/mulish/wght-italic.css';
import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App.js';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Elemento #root não encontrado.');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
