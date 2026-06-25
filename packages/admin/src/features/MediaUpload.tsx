import type { MediaType } from '@devocional/shared';
import { type ChangeEvent, useState } from 'react';
import { LuCheck } from 'react-icons/lu';

import { uploadMedia } from '../api/content.js';

type Status = 'idle' | 'uploading' | 'done' | 'error';

export function MediaUpload({
  label,
  type,
  accept,
  hasExisting = false,
  onUploaded,
}: {
  label: string;
  type: MediaType;
  accept: string;
  /** Edição: já existe um arquivo salvo neste campo. */
  hasExisting?: boolean;
  onUploaded: (mediaId: string) => void;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [name, setName] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setStatus('uploading');
    void uploadMedia(file, type).then(
      (media) => {
        onUploaded(media.id);
        setName(file.name);
        setStatus('done');
      },
      () => setStatus('error'),
    );
  };

  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="upload-row">
        <input type="file" accept={accept} onChange={handleChange} />
        {status === 'idle' && hasExisting && (
          <span className="ok">
            <LuCheck aria-hidden /> arquivo atual
          </span>
        )}
        {status === 'uploading' && <span className="muted">Enviando…</span>}
        {status === 'done' && (
          <span className="ok">
            <LuCheck aria-hidden /> {name}
          </span>
        )}
        {status === 'error' && <span className="field__error">Falha no envio.</span>}
      </div>
    </div>
  );
}
