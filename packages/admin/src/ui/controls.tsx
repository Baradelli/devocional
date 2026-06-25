import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

function cx(invalid: boolean | undefined, className: string | undefined): string {
  return ['control', invalid && 'control--invalid', className].filter(Boolean).join(' ');
}

type WithInvalid<T> = T & { invalid?: boolean };

export const Input = forwardRef<
  HTMLInputElement,
  WithInvalid<InputHTMLAttributes<HTMLInputElement>>
>(function Input({ invalid, className, ...rest }, ref) {
  return <input ref={ref} className={cx(invalid, className)} {...rest} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  WithInvalid<TextareaHTMLAttributes<HTMLTextAreaElement>>
>(function Textarea({ invalid, className, ...rest }, ref) {
  return <textarea ref={ref} className={cx(invalid, className)} {...rest} />;
});

export const Select = forwardRef<
  HTMLSelectElement,
  WithInvalid<SelectHTMLAttributes<HTMLSelectElement>>
>(function Select({ invalid, className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx(invalid, className)} {...rest}>
      {children}
    </select>
  );
});
