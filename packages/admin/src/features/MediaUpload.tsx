import type { MediaType } from '@devocional/shared';
import { type ChangeEvent, useState } from 'react';

import { uploadMedia } from '../api/content.js';

type Status = 'idle' | 'uploading' | 'done' | 'error';

export function MediaUpload({
  label,
  type,
  accept,
  onUploaded,
}: {
  label: string;
  type: MediaType;
  accept: string;
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
    <label className="upload">
      {label}
      <input type="file" accept={accept} onChange={handleChange} />
      {status === 'uploading' && <span className="muted">Enviando…</span>}
      {status === 'done' && <span className="ok">✓ {name}</span>}
      {status === 'error' && <span className="field-error">Falha no envio.</span>}
    </label>
  );
}
