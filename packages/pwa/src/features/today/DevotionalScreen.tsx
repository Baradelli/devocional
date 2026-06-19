import { Markdown } from '@devocional/ui';

import { AudioPlayer } from '../../components/AudioPlayer.js';
import { ScreenBar } from './ScreenBar.js';

interface DevotionalScreenProps {
  text: string;
  audioUrl?: string | null;
  onComplete: () => void;
  onClose: () => void;
}

/** O devocional do dia, renderizado como documento de leitura tranquila. */
export function DevotionalScreen({ text, audioUrl, onComplete, onClose }: DevotionalScreenProps) {
  return (
    <section className="screen screen--overlay screen--doc" aria-label="Devocional">
      <ScreenBar title="Devocional" onClose={onClose} />
      <Markdown source={text} className="doc" />
      <div className="doc__foot">
        {audioUrl ? <AudioPlayer url={audioUrl} label="Escutar o devocional" /> : <span />}
        <button
          type="button"
          className="btn"
          onClick={() => {
            onComplete();
            onClose();
          }}
        >
          Concluir leitura
        </button>
      </div>
    </section>
  );
}
