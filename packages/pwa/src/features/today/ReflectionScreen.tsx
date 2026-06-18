import { AudioPlayer } from '../../components/AudioPlayer.js';
import { ScreenBar } from './ScreenBar.js';

interface ReflectionScreenProps {
  questions: string[];
  actions: string[];
  audioUrl?: string | null;
  onComplete: () => void;
  onClose: () => void;
  onWriteNote: () => void;
}

/** Reflexão: perguntas para refletir, ações para praticar e atalho de anotação. */
export function ReflectionScreen({
  questions,
  actions,
  audioUrl,
  onComplete,
  onClose,
  onWriteNote,
}: ReflectionScreenProps) {
  return (
    <section className="screen screen--overlay screen--reflection" aria-label="Reflexão">
      <ScreenBar title="Reflexão" onClose={onClose} />
      <div className="reflect">
        <div className="reflect__col">
          <span className="label">Para refletir</span>
          <ol className="reflect__list">
            {questions.map((q, i) => (
              <li key={`q${String(i)}`}>{q}</li>
            ))}
          </ol>
        </div>
        <div className="reflect__col">
          <span className="label">Para praticar</span>
          <ul className="reflect__list reflect__list--actions">
            {actions.map((a, i) => (
              <li key={`a${String(i)}`}>{a}</li>
            ))}
          </ul>
        </div>
        <button type="button" className="note-prompt" onClick={onWriteNote}>
          <span>
            Guarde o que pensou hoje — <b>escrever anotação</b>
          </span>
          <span className="note-prompt__icon" aria-hidden="true">
            ✎
          </span>
        </button>
      </div>
      <div className="doc__foot">
        {audioUrl ? <AudioPlayer url={audioUrl} label="Escutar a reflexão" /> : <span />}
        <button
          type="button"
          className="btn"
          onClick={() => {
            onComplete();
            onClose();
          }}
        >
          Concluir reflexão
        </button>
      </div>
    </section>
  );
}
