import { useRef, useState } from 'react';

import { API_BASE } from '../api/client.js';

/**
 * Pílula "Escutar" com indicador de onda animado (.listen). Toca o áudio real
 * do bloco; `night` usa a variante clara sobre fundo escuro (leitura/oração).
 */
export function AudioPlayer({
  url,
  label = 'Escutar',
  night = false,
  onPlay,
  onPause,
}: {
  url: string;
  label?: string;
  night?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const audio = ref.current;
    if (!audio) {
      return;
    }
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const className = ['listen', night ? 'listen--night' : '', playing ? 'is-playing' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <button type="button" className={className} onClick={toggle}>
        <span className="listen__wave" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        {playing ? 'Pausar' : label}
      </button>
      <audio
        ref={ref}
        src={`${API_BASE}${url}`}
        crossOrigin="use-credentials"
        preload="none"
        onPlay={() => {
          setPlaying(true);
          onPlay?.();
        }}
        onPause={() => {
          setPlaying(false);
          onPause?.();
        }}
        onEnded={() => {
          setPlaying(false);
          onPause?.();
        }}
      />
    </>
  );
}
