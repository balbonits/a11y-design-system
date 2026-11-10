import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> & {
  label: string;
  hint?: string;
  error?: string;
  /** Mixed state, e.g. a "select all" when only some items are checked. */
  indeterminate?: boolean;
};

export function Checkbox({ label, hint, error, indeterminate = false, disabled, className, ...rest }: CheckboxProps) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cx('em-check', disabled && 'em-check--disabled', className)}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        aria-checked={indeterminate ? 'mixed' : undefined}
        {...rest}
      />
      <span className="em-check-text">
        <label htmlFor={id}>{label}</label>
        {hint && <span className="em-hint" id={`${id}-hint`}>{hint}</span>}
        {error && <span className="em-error" id={`${id}-error`}>Error: {error}</span>}
      </span>
    </div>
  );
}

export function CheckboxGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="em-fieldset">
      <legend className="em-legend">{legend}</legend>
      {children}
    </fieldset>
  );
}
