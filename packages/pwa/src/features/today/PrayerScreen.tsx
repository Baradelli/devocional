import { useRef, useState } from 'react';

import { API_BASE } from '../../api/client.js';
import { AudioPlayer } from '../../components/AudioPlayer.js';

interface PrayerScreenProps {
  text: string;
  audioUrl?: string | null;
  soundUrl?: string | null;
  onComplete: () => void;
  onClose: () => void;
}

/** Oração imersiva (tema noite): ambiência, narração com ducking, "Amém". */
export function PrayerScreen({ text, audioUrl, soundUrl, onComplete, onClose }: PrayerScreenProps) {
  const ambienceRef = useRef<HTMLAudioElement>(null);
  const [ambienceOn, setAmbienceOn] = useState(false);

  // Ducking: a ambiência abaixa enquanto a narração toca e volta ao terminar.
  const duck = (narrating: boolean) => {
    if (ambienceRef.current) {
      ambienceRef.current.volume = narrating ? 0.15 : 0.5;
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
      setAmbienceOn(true);
    } else {
      ambience.pause();
      setAmbienceOn(false);
    }
  };

  return (
    <section className="screen screen--overlay screen--prayer" aria-label="Oração">
      <div className="prayer__bg" aria-hidden="true" />
      <div className="prayer__veil" aria-hidden="true" />
      <button
        type="button"
        className="iconbtn iconbtn--light prayer__close"
        onClick={onClose}
        aria-label="Sair da oração"
      >
        ×
      </button>
      <div className="prayer__content">
        <span className="eyebrow prayer__kicker">Oração</span>
        <p className="prayer__text display">{text}</p>
        {audioUrl && (
          <AudioPlayer
            url={audioUrl}
            night
            label="Escutar a oração"
            onPlay={() => duck(true)}
            onPause={() => duck(false)}
          />
        )}
        {soundUrl && (
          <>
            <button type="button" className="prayer__ambience" onClick={toggleAmbience}>
              Som ambiente: <strong>{ambienceOn ? 'ligado' : 'desligado'}</strong>
            </button>
            <audio
              ref={ambienceRef}
              src={`${API_BASE}${soundUrl}`}
              crossOrigin="use-credentials"
              loop
              preload="none"
            />
          </>
        )}
        <button
          type="button"
          className="btn prayer__amen"
          onClick={() => {
            onComplete();
            onClose();
          }}
        >
          Amém
        </button>
      </div>
    </section>
  );
}
