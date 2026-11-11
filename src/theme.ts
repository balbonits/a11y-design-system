/** Theme and color mode (R-2). html[data-theme] takes a registered theme id (absent = the first
 *  registered theme, the default); html[data-mode] picks light or dark (absent = follow
 *  prefers-color-scheme, shown as "Auto"). Ember ships the themes in src/themes/registry.json; an app
 *  can register its own (its token file plus an entry) and pass them to these helpers and ThemeSwitcher. */
import registry from './themes/registry.json';

export type ThemeEntry = { id: string; label: string };
export type Theme = string;
export type Mode = 'auto' | 'light' | 'dark';
/** Ember's registered themes, default first. Never hardcode a theme name; read it from here. */
export const THEME_REGISTRY: readonly ThemeEntry[] = registry;
export const THEMES: readonly Theme[] = THEME_REGISTRY.map((t) => t.id);
export const DEFAULT_THEME: Theme = THEMES[0];
export const MODES: readonly Mode[] = ['auto', 'light', 'dark'];
/** Shared same-origin keys, so every app on the site keeps one choice. */
export const THEME_KEY = 'jdilig:theme';
export const MODE_KEY = 'jdilig:mode';

export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const safeStorage = (): ThemeStorage | undefined => {
  try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; }
};
const ids = (themes: readonly ThemeEntry[]) => themes.map((t) => t.id);

export function readTheme(
  storage: ThemeStorage | undefined = safeStorage(),
  themes: readonly ThemeEntry[] = THEME_REGISTRY,
): { theme: Theme; mode: Mode } {
  const t = storage?.getItem(THEME_KEY);
  const m = storage?.getItem(MODE_KEY);
  return {
    theme: t && ids(themes).includes(t) ? t : themes[0].id,
    mode: m === 'light' || m === 'dark' ? m : 'auto',
  };
}

/** Sets the two attributes on an element (html by default). The default theme and Auto remove theirs. */
export function applyTheme(theme: Theme, mode: Mode, el: HTMLElement = document.documentElement, themes: readonly ThemeEntry[] = THEME_REGISTRY) {
  if (theme === themes[0].id || !ids(themes).includes(theme)) el.removeAttribute('data-theme'); else el.setAttribute('data-theme', theme);
  if (mode === 'auto') el.removeAttribute('data-mode'); else el.setAttribute('data-mode', mode);
}

/** Persists the choice. The default theme and Auto remove their keys. */
export function saveTheme(theme: Theme, mode: Mode, storage: ThemeStorage | undefined = safeStorage(), themes: readonly ThemeEntry[] = THEME_REGISTRY) {
  if (!storage) return;
  try {
    if (theme === themes[0].id) storage.removeItem(THEME_KEY); else storage.setItem(THEME_KEY, theme);
    if (mode === 'auto') storage.removeItem(MODE_KEY); else storage.setItem(MODE_KEY, mode);
  } catch { /* private mode or full storage: the choice just doesn't persist */ }
}

/** The pre-paint script for a theme list. Inline it in <head> before any CSS so the first paint uses
 *  the saved choice; it only sets the two attributes. Allow it in a strict CSP by its sha256 hash. */
export function prepaintScript(themes: readonly ThemeEntry[] = THEME_REGISTRY): string {
  const others = JSON.stringify(ids(themes).slice(1)).replace(/"/g, "'");
  return "try{var d=document.documentElement,t=localStorage.getItem('jdilig:theme'),m=localStorage.getItem('jdilig:mode');" +
    `if(${others}.indexOf(t)>-1)d.setAttribute('data-theme',t);if(m==='light'||m==='dark')d.setAttribute('data-mode',m)}catch(e){}`;
}
/** prepaintScript() for Ember's own registry. */
export const PREPAINT_SCRIPT = prepaintScript();
