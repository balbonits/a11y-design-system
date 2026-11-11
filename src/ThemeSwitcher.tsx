import { useEffect, useId, useRef, useState } from 'react';
import { applyTheme, MODES, readTheme, saveTheme, THEMES, type Mode, type Theme, type ThemeStorage } from './theme';
import { cx } from './cx';

export type ThemeSwitcherProps = {
  /** Called after each change, with the new theme and mode. */
  onChange?: (theme: Theme, mode: Mode) => void;
  /** Storage override (tests). Defaults to localStorage. */
  storage?: ThemeStorage;
  className?: string;
};

const LABEL: Record<Theme | Mode, string> = { editorial: 'Editorial', bold: 'Bold', tactile: 'Tactile', auto: 'Auto', light: 'Light', dark: 'Dark' };
const systemDark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;

/** Two native radio groups (theme, color mode). Arrow keys move within a group, each change is
 *  announced politely, the choice persists to jdilig:theme / jdilig:mode, and Auto follows the OS. */
export function ThemeSwitcher({ onChange, storage, className }: ThemeSwitcherProps) {
  const id = useId();
  const [state, setState] = useState(() => readTheme(storage));
  const [dark, setDark] = useState(systemDark);
  const [message, setMessage] = useState('');
  const first = useRef(true);

  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    applyTheme(state.theme, state.mode);
    if (first.current) { first.current = false; return; }
    const mode = state.mode === 'auto' ? `automatic (${dark ? 'dark' : 'light'})` : LABEL[state.mode].toLowerCase();
    setMessage(`Theme ${LABEL[state.theme]}, ${mode} mode`);
  }, [state, dark]);

  const set = (next: { theme: Theme; mode: Mode }) => {
    const swap = () => setState(next);
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = typeof document !== 'undefined' ? (document as Document & { startViewTransition?: (cb: () => void) => unknown }) : undefined;
    if (!reduce && doc?.startViewTransition) doc.startViewTransition(swap); else swap();
    saveTheme(next.theme, next.mode, storage);
    onChange?.(next.theme, next.mode);
  };

  const group = <T extends Theme | Mode>(key: 'theme' | 'mode', legend: string, options: readonly T[]) => (
    <fieldset className="em-switch-group">
      <legend className="em-legend">{legend}</legend>
      <div className="em-switch-options">
        {options.map((o) => (
          <label key={o} className="em-switch-option">
            <input
              type="radio"
              name={`${id}-${key}`}
              value={o}
              checked={state[key] === o}
              onChange={() => set({ ...state, [key]: o })}
            />
            <span>{LABEL[o]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className={cx('em-switch', className)}>
      {group('theme', 'Theme', THEMES)}
      {group('mode', 'Color mode', MODES)}
      <p className="em-sr-only" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
