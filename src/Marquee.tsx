import { useState, type ReactNode } from 'react';
import { cx } from './cx';
import { useReducedMotion } from './motion';

export type MarqueeProps = {
  /** Names the region, e.g. "Release notes". The Pause button reads "Pause {label}". */
  label: string;
  /** The items that scroll. Keep them short; screen readers read them once. */
  children: ReactNode;
  className?: string;
};

/**
 * A scrolling ticker (WCAG 2.2.2). A visible Pause/Play button comes before the content, it pauses on hover and focus,
 * the looped copy is aria-hidden and inert, and under reduced motion it starts paused.
 */
export function Marquee({ label, children, className }: MarqueeProps) {
  const reduced = useReducedMotion();
  const [choice, setChoice] = useState<'play' | 'pause' | null>(null);
  const paused = choice ? choice === 'pause' : reduced;
  return (
    <section className={cx('em-marquee', paused && 'em-marquee--paused', choice === 'play' && 'em-marquee--playing', className)} aria-label={label}>
      <button
        type="button"
        className="em-btn em-btn--secondary em-btn--sm em-marquee-toggle"
        aria-label={`${paused ? 'Play' : 'Pause'} ${label}`}
        onClick={() => setChoice(paused ? 'play' : 'pause')}
      >
        <span className="em-marquee-glyph" aria-hidden="true">{paused ? '\u25B6' : '\u275A\u275A'}</span>
        {paused ? 'Play' : 'Pause'}
      </button>
      <div className="em-marquee-viewport">
        <div className="em-marquee-track">
          <div className="em-marquee-group">{children}</div>
          <div className="em-marquee-group" aria-hidden="true" inert>{children}</div>
        </div>
      </div>
    </section>
  );
}
