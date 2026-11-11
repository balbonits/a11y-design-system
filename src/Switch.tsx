import { useId, type InputHTMLAttributes } from 'react';
import { cx } from './cx';

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id' | 'role'> & {
  label: string;
  hint?: string;
};

/** An on/off setting that applies right away. A native checkbox with role="switch", so Space toggles it and forms read it. */
export function Switch({ label, hint, disabled, className, ...rest }: SwitchProps) {
  const id = useId();
  return (
    <div className={cx('em-toggle', disabled && 'em-toggle--disabled', className)}>
      <input id={id} type="checkbox" role="switch" className="em-toggle-input" disabled={disabled} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      <span className="em-check-text">
        <label htmlFor={id}>{label}</label>
        {hint && <span className="em-hint" id={`${id}-hint`}>{hint}</span>}
      </span>
    </div>
  );
}
