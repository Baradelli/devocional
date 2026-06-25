import { LuArrowLeft } from 'react-icons/lu';

/** Barra superior das telas de leitura (voltar + rótulo centrado). */
export function ScreenBar({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <header className="screen__bar">
      <button type="button" className="iconbtn" onClick={onClose} aria-label="Voltar">
        <LuArrowLeft />
      </button>
      <span className="eyebrow">{title}</span>
      <span className="iconbtn iconbtn--ghost" aria-hidden="true" />
    </header>
  );
}
