import { Markdown } from '@devocional/ui';
import type { TextareaHTMLAttributes } from 'react';

import { Textarea } from '../ui/controls.js';
import { Field } from '../ui/Field.js';

interface MarkdownFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  value: string;
  invalid?: boolean;
  rows?: number;
  textareaProps: TextareaHTMLAttributes<HTMLTextAreaElement>;
}

/**
 * Campo de autoria em Markdown: fonte à esquerda, prévia renderizada à direita
 * com o mesmo `<Markdown>` que o fiel vê. Não é um editor — só cole o texto.
 */
export function MarkdownField({
  label,
  hint,
  error,
  required,
  value,
  invalid,
  rows = 10,
  textareaProps,
}: MarkdownFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <div className="md-field">
        <div className="md-field__col">
          <span className="md-field__tag">Markdown</span>
          <Textarea rows={rows} invalid={invalid} className="md-field__src" {...textareaProps} />
        </div>
        <div className="md-field__col">
          <span className="md-field__tag">Prévia — como o fiel lê</span>
          {value.trim() ? (
            <Markdown source={value} className="md-preview" />
          ) : (
            <div className="md-preview md-preview--empty">
              Cole o texto em Markdown ao lado para ver a prévia.
            </div>
          )}
        </div>
      </div>
    </Field>
  );
}
