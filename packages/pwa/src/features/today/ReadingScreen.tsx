import type { PassageVerseView } from '@devocional/shared';
import { useState } from 'react';

import { AudioPlayer } from '../../components/AudioPlayer.js';

interface ReadingScreenProps {
  refLabel: string;
  chapterLabel: string;
  verses: PassageVerseView[];
  fallbackText: string;
  audioUrl?: string | null;
  onComplete: () => void;
  onClose: () => void;
}

/**
 * Leitura bíblica em "stories": um versículo por tela, toque para avançar,
 * barras de progresso no topo. Ao passar do último versículo, conclui a etapa.
 */
export function ReadingScreen({
  refLabel,
  chapterLabel,
  verses,
  fallbackText,
  audioUrl,
  onComplete,
  onClose,
}: ReadingScreenProps) {
  // Sem versículos individuais (passagem legada), cai para um único cartão.
  const items: PassageVerseView[] = verses.length > 0 ? verses : [{ verse: 0, text: fallbackText }];
  const [index, setIndex] = useState(0);

  const next = () => {
    if (index < items.length - 1) {
      setIndex(index + 1);
    } else {
      onComplete();
      onClose();
    }
  };
  const prev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const current = items[index] ?? items[0]!;

  return (
    <section className="screen screen--overlay screen--stories" aria-label="Leitura bíblica">
      <div className="stories__bars" aria-hidden="true">
        {items.map((v, i) => (
          <span key={v.verse} style={{ ['--fill' as string]: i <= index ? '100%' : '0%' }}>
            <i />
          </span>
        ))}
      </div>
      <header className="stories__head">
        <span className="label">{chapterLabel}</span>
        <button
          type="button"
          className="iconbtn iconbtn--light"
          onClick={onClose}
          aria-label="Fechar leitura"
        >
          ×
        </button>
      </header>
      <button
        type="button"
        className="stories__zone stories__zone--prev"
        onClick={prev}
        aria-label="Versículo anterior"
      />
      <button
        type="button"
        className="stories__zone stories__zone--next"
        onClick={next}
        aria-label="Próximo versículo"
      />
      <div className="stories__stage">
        {current.verse > 0 && <p className="stories__verseno label">Versículo {current.verse}</p>}
        <p className="stories__text display" key={index}>
          {current.text}
        </p>
      </div>
      <div className="stories__foot">
        {audioUrl && <AudioPlayer url={audioUrl} night label={`Escutar ${refLabel}`} />}
        <span className="stories__hint">toque para avançar</span>
      </div>
    </section>
  );
}
