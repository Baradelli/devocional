import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { LuCheck } from 'react-icons/lu';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

/**
 * Checkbox padrão do app: caixa arredondada orgânica (musgo ao marcar) sobre o
 * input nativo escondido — acessível (foco, teclado) e bonito. Encaminha a ref
 * para o input, então funciona com `{...register()}` do react-hook-form. Use
 * este em vez do `<input type="checkbox">` cru.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, disabled, ...props },
  ref,
) {
  return (
    <label className={`check${disabled ? ' is-disabled' : ''}${className ? ` ${className}` : ''}`}>
      <input ref={ref} type="checkbox" className="check__input" disabled={disabled} {...props} />
      <span className="check__box" aria-hidden="true">
        <LuCheck className="check__tick" />
      </span>
      <span className="check__label">{label}</span>
    </label>
  );
});
