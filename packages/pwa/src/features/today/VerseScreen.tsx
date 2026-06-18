import { AudioPlayer } from '../../components/AudioPlayer.js';
import { ScreenBar } from './ScreenBar.js';

interface VerseScreenProps {
  text: string;
  reference?: string;
  audioUrl?: string | null;
  onComplete: () => void;
  onClose: () => void;
}

/** A frase do dia — herói tipográfico para começar a jornada. */
export function VerseScreen({ text, reference, audioUrl, onComplete, onClose }: VerseScreenProps) {
  return (
    <section className="screen screen--overlay screen--verse" aria-label="Frase do dia">
      <ScreenBar title="Frase do dia" onClose={onClose} />
      <div className="verse-screen">
        <p className="verse-screen__text display">“{text}”</p>
        <img className="verse-screen__sprig" src="/sprig.svg" alt="" width={140} height={52} />
        {reference && <span className="label verse-screen__ref">{reference}</span>}
      </div>
      <div className="doc__foot">
        {audioUrl ? <AudioPlayer url={audioUrl} /> : <span />}
        <button
          type="button"
          className="btn"
          onClick={() => {
            onComplete();
            onClose();
          }}
        >
          Começar o dia
        </button>
      </div>
    </section>
  );
}
