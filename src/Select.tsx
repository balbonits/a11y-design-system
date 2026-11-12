import type { SelectHTMLAttributes } from 'react';
import { FieldShell, useField, type FieldProps } from './Field';
import { cx } from './cx';

export type SelectProps = FieldProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'>;

/** A styled native select: the browser handles the listbox, keyboard and screen reader behavior. */
export function Select({ label, hint, error, required, className, 'aria-describedby': appDescribedBy, children, ...rest }: SelectProps) {
  const f = useField({ label, hint, error }, appDescribedBy);
  return (
    <FieldShell {...f} label={label} hint={hint} error={error} required={required}>
      <select
        id={f.id}
        className={cx('em-control', className)}
        aria-describedby={f.describedBy}
        aria-invalid={error ? true : undefined}
        required={required}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}
