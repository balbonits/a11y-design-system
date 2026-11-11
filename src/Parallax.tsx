import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from './cx';
import { useReducedMotion } from './motion';

export type ParallaxProps = {
  /** Decorative only: shapes, textures, images with empty alt. Never put content here that exists nowhere else. */
  children: ReactNode;
  className?: string;
};

/**
 * A decorative layer that drifts as the page scrolls. It moves with transform only, by the theme's --parallax-scale,
 * is aria-hidden and inert, and stays still under reduced motion (the scale is 0 and no scroll listener is added).
 */
export function Parallax({ children, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof window === 'undefined') return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--em-parallax-y', `${Math.round(window.innerHeight / 2 - (r.top + r.height / 2))}px`);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
      el.style.removeProperty('--em-parallax-y');
    };
  }, [reduced]);
  return (
    <div ref={ref} className={cx('em-parallax', className)} aria-hidden="true" inert>
      <div className="em-parallax-layer">{children}</div>
    </div>
  );
}
