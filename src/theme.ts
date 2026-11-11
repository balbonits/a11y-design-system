/** Theme and color mode (R-2). html[data-theme] picks the theme (absent = editorial);
 *  html[data-mode] picks light or dark (absent = follow prefers-color-scheme, shown as "Auto"). */
export type Theme = 'editorial' | 'bold' | 'tactile';
export type Mode = 'auto' | 'light' | 'dark';
export const THEMES: readonly Theme[] = ['editorial', 'bold', 'tactile'];
export const MODES: readonly Mode[] = ['auto', 'light', 'dark'];
/** Shared same-origin keys, so every app on the site keeps one choice. */
export const THEME_KEY = 'jdilig:theme';
export const MODE_KEY = 'jdilig:mode';

export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const safeStorage = (): ThemeStorage | undefined => {
  try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; }
};

export function readTheme(storage: ThemeStorage | undefined = safeStorage()): { theme: Theme; mode: Mode } {
  const t = storage?.getItem(THEME_KEY);
  const m = storage?.getItem(MODE_KEY);
  return {
    theme: THEMES.includes(t as Theme) ? (t as Theme) : 'editorial',
    mode: m === 'light' || m === 'dark' ? m : 'auto',
  };
}

/** Sets the two attributes on an element (html by default). Editorial and Auto remove theirs. */
export function applyTheme(theme: Theme, mode: Mode, el: HTMLElement = document.documentElement) {
  if (theme === 'editorial') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', theme);
  if (mode === 'auto') el.removeAttribute('data-mode'); else el.setAttribute('data-mode', mode);
}

/** Persists the choice. Editorial and Auto remove their keys. */
export function saveTheme(theme: Theme, mode: Mode, storage: ThemeStorage | undefined = safeStorage()) {
  if (!storage) return;
  try {
    if (theme === 'editorial') storage.removeItem(THEME_KEY); else storage.setItem(THEME_KEY, theme);
    if (mode === 'auto') storage.removeItem(MODE_KEY); else storage.setItem(MODE_KEY, mode);
  } catch { /* private mode or full storage: the choice just doesn't persist */ }
}

/** Inline this in <head> before any CSS so the first paint uses the saved choice. It only sets the
 *  two attributes. Allow it in a strict CSP by its sha256 hash. */
export const PREPAINT_SCRIPT =
  "try{var d=document.documentElement,t=localStorage.getItem('jdilig:theme'),m=localStorage.getItem('jdilig:mode');" +
  "if(t==='bold'||t==='tactile')d.setAttribute('data-theme',t);if(m==='light'||m==='dark')d.setAttribute('data-mode',m)}catch(e){}";
