import type { BlockView } from '@devocional/shared';
import { useRef } from 'react';

import { API_BASE } from '../api/client.js';
import { AudioPlayer } from './AudioPlayer.js';

function QuoteBlock({ text }: { text: string }) {
  return (
    <section className="block quote">
      <p>{text}</p>
    </section>
  );
}

function PassageBlock({ block }: { block: Extract<BlockView, { type: 'PASSAGE' }> }) {
  return (
    <section className="block passage">
      <span className="ref-label">{block.label}</span>
      <p className="passage-text">{block.text}</p>
      {block.audioUrl && <AudioPlayer url={block.audioUrl} label="Escutar a passagem" />}
    </section>
  );
}

function DevotionalTextBlock({ block }: { block: Extract<BlockView, { type: 'DEVOTIONAL' }> }) {
  return (
    <section className="block devotional">
      <p>{block.text}</p>
      {block.audioUrl && <AudioPlayer url={block.audioUrl} label="Escutar o devocional" />}
    </section>
  );
}

function PrayerBlock({ block }: { block: Extract<BlockView, { type: 'PRAYER' }> }) {
  const ambienceRef = useRef<HTMLAudioElement>(null);

  // Ducking: o som ambiente abaixa quando a narração toca e volta ao terminar.
  const duck = (narrating: boolean) => {
    const ambience = ambienceRef.current;
    if (ambience) {
      ambience.volume = narrating ? 0.15 : 0.5;
    }
  };

  const toggleAmbience = () => {
    const ambience = ambienceRef.current;
    if (!ambience) {
      return;
    }
    if (ambience.paused) {
      ambience.volume = 0.5;
      void ambience.play();
    } else {
      ambience.pause();
    }
  };

  const style = block.gifUrl ? { backgroundImage: `url(${API_BASE}${block.gifUrl})` } : undefined;

  return (
    <section className="block prayer" style={style}>
      <div className="prayer-inner">
        <p>{block.text}</p>
        <div className="prayer-controls">
          {block.audioUrl && (
            <AudioPlayer
              url={block.audioUrl}
              label="Escutar a oração"
              onPlay={() => duck(true)}
              onPause={() => duck(false)}
            />
          )}
          {block.soundUrl && (
            <>
              <button type="button" className="listen" onClick={toggleAmbience}>
                Som ambiente
              </button>
              <audio
                ref={ambienceRef}
                src={`${API_BASE}${block.soundUrl}`}
                crossOrigin="use-credentials"
                loop
                preload="none"
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ReflectionBlock({ block }: { block: Extract<BlockView, { type: 'REFLECTION' }> }) {
  return (
    <section className="block reflection">
      <h2>Para refletir</h2>
      <ol className="questions">
        {block.questions.map((q, i) => (
          <li key={`q${i}`}>{q}</li>
        ))}
      </ol>
      <h3>Para praticar</h3>
      <ul className="actions">
        {block.actions.map((a, i) => (
          <li key={`a${i}`}>{a}</li>
        ))}
      </ul>
      {block.audioUrl && <AudioPlayer url={block.audioUrl} label="Escutar a reflexão" />}
    </section>
  );
}

export function Block({ block }: { block: BlockView }) {
  switch (block.type) {
    case 'QUOTE':
      return <QuoteBlock text={block.text} />;
    case 'PASSAGE':
      return <PassageBlock block={block} />;
    case 'DEVOTIONAL':
      return <DevotionalTextBlock block={block} />;
    case 'PRAYER':
      return <PrayerBlock block={block} />;
    case 'REFLECTION':
      return <ReflectionBlock block={block} />;
  }
}
