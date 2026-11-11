import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  if (typeof matchMedia === 'undefined') return () => {};
  const mq = matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
const read = () => typeof matchMedia !== 'undefined' && matchMedia(QUERY).matches;

/**
 * True when the user asks for reduced motion (`prefers-reduced-motion: reduce`), and it updates live.
 * Renders false on the server; Ember's CSS stops motion under reduced motion on its own, so nothing depends on this to be safe.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}

/** The motion tokens every registered theme defines. Each theme zeroes the durations, tilt, lift, stagger and parallax under reduced motion. */
export const MOTION_TOKENS = [
  '--duration-fast', '--duration-base', '--duration-slow', '--duration-reveal', '--duration-ticker',
  '--ease-standard', '--ease-press', '--stagger', '--tilt', '--lift', '--parallax-scale', '--weight-shift', '--hue-shift',
] as const;
