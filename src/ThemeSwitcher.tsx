import { useEffect, useId, useRef, useState } from 'react';
import { applyTheme, MODES, readTheme, saveTheme, THEME_REGISTRY, type Mode, type Theme, type ThemeEntry, type ThemeStorage } from './theme';
import { cx } from './cx';

export type ThemeSwitcherProps = {
  /** Called after each change, with the new theme and mode. */
  onChange?: (theme: Theme, mode: Mode) => void;
  /** Storage override (tests). Defaults to localStorage. */
  storage?: ThemeStorage;
  /** Registered themes, default first. Defaults to Ember's registry. With one theme, only the mode group shows. */
  themes?: readonly ThemeEntry[];
  className?: string;
};

const MODE_LABEL: Record<Mode, string> = { auto: 'Auto', light: 'Light', dark: 'Dark' };
const systemDark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;

/** Two native radio groups (theme, color mode). Arrow keys move within a group, each change is
 *  announced politely, the choice persists to jdilig:theme / jdilig:mode, and Auto follows the OS. */
export function ThemeSwitcher({ onChange, storage, themes = THEME_REGISTRY, className }: ThemeSwitcherProps) {
  const id = useId();
  const [state, setState] = useState(() => readTheme(storage, themes));
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
    applyTheme(state.theme, state.mode, undefined, themes);
    if (first.current) { first.current = false; return; }
    const mode = state.mode === 'auto' ? `automatic (${dark ? 'dark' : 'light'})` : MODE_LABEL[state.mode].toLowerCase();
    setMessage(`Theme ${label(state.theme)}, ${mode} mode`);
  }, [state, dark]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (next: { theme: Theme; mode: Mode }) => {
    const swap = () => setState(next);
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = typeof document !== 'undefined' ? (document as Document & { startViewTransition?: (cb: () => void) => unknown }) : undefined;
    if (!reduce && doc?.startViewTransition) doc.startViewTransition(swap); else swap();
    saveTheme(next.theme, next.mode, storage, themes);
    onChange?.(next.theme, next.mode);
  };

  const label = (o: string) => themes.find((t) => t.id === o)?.label ?? MODE_LABEL[o as Mode] ?? o;
  const group = (key: 'theme' | 'mode', legend: string, options: readonly string[]) => (
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
            <span>{label(o)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className={cx('em-switch', className)}>
      {themes.length > 1 && group('theme', 'Theme', themes.map((t) => t.id))}
      {group('mode', 'Color mode', MODES)}
      <p className="em-sr-only" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
