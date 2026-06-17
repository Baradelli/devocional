import { useRef, useState } from 'react';

import { API_BASE } from '../api/client.js';

/**
 * Player simples de "escutar": play/pause. O texto do bloco fica visível
 * acompanhando o áudio (sem destaque por trecho — decisão de UX do v1).
 */
export function AudioPlayer({
  url,
  label = 'Escutar',
  onPlay,
  onPause,
}: {
  url: string;
  label?: string;
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

  return (
    <span className="audio-player">
      <button type="button" className="listen" onClick={toggle}>
        {playing ? '❚❚ Pausar' : `▶ ${label}`}
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
    </span>
  );
}
