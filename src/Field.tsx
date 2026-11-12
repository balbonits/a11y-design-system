import { useId, type ReactNode } from 'react';
import { cx } from './cx';

export type FieldProps = { label: string; hint?: string; error?: string; required?: boolean };

/** Shared label / hint / error wiring for Input and Select. `appDescribedBy` (the app's own aria-describedby) is kept, first. */
export function useField({ hint, error }: FieldProps, appDescribedBy?: string) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = cx(appDescribedBy, hintId, errorId) || undefined;
  return { id, hintId, errorId, describedBy };
}

export function FieldShell({ id, hintId, errorId, label, hint, error, required, children }: FieldProps & { id: string; hintId?: string; errorId?: string; children: ReactNode }) {
  return (
    <div className="em-field">
      <label className="em-label" htmlFor={id}>
        {label}
        {required && <span className="em-required" aria-hidden="true">*</span>}
      </label>
      {hint && <p className="em-hint" id={hintId}>{hint}</p>}
      {children}
      {error && <p className="em-error" id={errorId}>Error: {error}</p>}
    </div>
  );
}
