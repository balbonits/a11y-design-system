import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

type Common = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** Shows a spinner, sets aria-busy and blocks clicks. */
  loading?: boolean;
};
/** Icon-only buttons must have an aria-label: the type makes it required. */
export type ButtonProps =
  | (Common & { iconOnly?: false; children: ReactNode })
  | (Common & { iconOnly: true; 'aria-label': string; children: ReactNode });

export function Button({ variant = 'primary', size = 'md', loading = false, iconOnly, className, children, disabled, type = 'button', onClick, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx('em-btn', `em-btn--${variant}`, size !== 'md' && `em-btn--${size}`, iconOnly && 'em-btn--icon', className)}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      {...rest}
    >
      {loading && <span className="em-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
