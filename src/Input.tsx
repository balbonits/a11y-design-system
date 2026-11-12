import type { InputHTMLAttributes } from 'react';
import { FieldShell, useField, type FieldProps } from './Field';
import { cx } from './cx';

export type InputProps = FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;

export function Input({ label, hint, error, required, className, 'aria-describedby': appDescribedBy, ...rest }: InputProps) {
  const f = useField({ label, hint, error }, appDescribedBy);
  return (
    <FieldShell {...f} label={label} hint={hint} error={error} required={required}>
      <input
        id={f.id}
        className={cx('em-control', className)}
        aria-describedby={f.describedBy}
        aria-invalid={error ? true : undefined}
        required={required}
        {...rest}
      />
    </FieldShell>
  );
}
