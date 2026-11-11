import type { ReactNode } from 'react';
import { cx } from './cx';

export type AnimatedIconProps = {
  /** An inline SVG or glyph. */
  children: ReactNode;
  /** spin: a full turn; pulse: a soft opacity and scale beat; nudge: a small sideways shift. */
  motion?: 'spin' | 'pulse' | 'nudge';
  /** Set false to show it still. Change `key` to play it again. */
  active?: boolean;
  /** Give a label only when the icon carries meaning; otherwise it is aria-hidden. */
  label?: string;
  className?: string;
};

/**
 * A CSS-animated icon. It plays at most 3 cycles of 1 to 1.6s each, so it always stops by 4.8s (2.2.2),
 * never cycles more than once a second (2.3.1), and shows still under reduced motion.
 */
export function AnimatedIcon({ children, motion = 'pulse', active = true, label, className }: AnimatedIconProps) {
  return (
    <span
      className={cx('em-icon', active && `em-icon--${motion}`, className)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {children}
    </span>
  );
}
