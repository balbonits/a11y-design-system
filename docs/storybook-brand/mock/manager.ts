import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';
import '@fontsource/archivo-black/400.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/700.css';
import '@fontsource/jetbrains-mono/400.css';
import tokens from '../src/tokens.json';

// Mobile-first: from 600px (where Storybook's own mobile nav stops) up to 1024px,
// start with the sidebar collapsed so the docs get the full width. The toolbar's
// "Show sidebar" button brings it back.
const w = window.innerWidth;
if (w >= 600 && w < 1024) addons.setConfig({ navSize: 0 });

// SB-MANAGER-AA: Storybook's stock manager UI fails axe color-contrast (toolbar #029cfd on #f1f3f4 2.62:1, the selected
// sidebar item white on #029cfd 2.92:1, dark section toggles and code 3.93:1). This theme uses Ember neo values so every
// text pair is 4.5:1 or better and every UI/focus pair 3:1 or better, in light and dark. Ratios are checked by
// scripts/a11y-manager.mjs (part of test:a11y).
// STORYBOOK-BRAND (extends SB-MANAGER-AA): the colors are now read from src/tokens.json (themes.neo) by semantic token,
// so they can't drift from the theme. The values match SB-MANAGER-AA except where noted in
// docs/storybook-brand/HANDOFF.md, and no contrast pair is lower. Adds neo's brand mark, fonts and radius, and follows
// prefers-color-scheme live.
type Mode = 'light' | 'dark';
const neo = tokens.themes.neo as unknown as Record<Mode | 'shape', Record<string, string>>;
const tok = (mode: Mode, name: string) => neo[mode][name];
const px = (v: string) => parseInt(v, 10);

// Field -> neo token, per mode [light, dark]. Mirrors docs/storybook-brand/theme-map.json (contrast.mjs checks they match).
const MAP = {
  colorPrimary: ['--accent-hover', '--accent'],
  colorSecondary: ['--accent', '--accent'],
  appBg: ['--color-bg', '--color-bg'],
  appContentBg: ['--surface', '--surface'],
  appPreviewBg: ['--surface', '--color-bg'],
  appBorderColor: ['--border', '--border'],
  textColor: ['--text', '--text'],
  textInverseColor: ['--surface', '--color-bg'],
  textMutedColor: ['--text-muted', '--text-muted'],
  barTextColor: ['--text-muted', '--text-muted'],
  barSelectedColor: ['--accent-hover', '--accent'],
  barHoverColor: ['--accent-hover', '--accent-hover'],
  barBg: ['--surface', '--surface'],
  buttonBg: ['--surface', '--surface-muted'],
  buttonBorder: ['--border', '--border'],
  booleanBg: ['--surface-muted', '--color-bg'],
  booleanSelectedBg: ['--surface', '--surface-muted'],
  inputBg: ['--surface', '--color-bg'],
  inputBorder: ['--border', '--border'],
  inputTextColor: ['--text', '--text'],
} as const;
// CSS custom properties used by manager-head.html (brand mark, focus ring, selected-row text).
const CSS_VARS = {
  '--eb-text': '--text',
  '--eb-border': '--border',
  '--eb-blob': '--highlight',
  '--eb-focus': '--focus-ring-color',
  '--eb-selected-text': '--accent-contrast',
  '--eb-boolean-label': '--text-muted',
  '--eb-surface': '--surface',
  '--eb-surface-muted': '--surface-muted',
} as const;

const build = (mode: Mode) => {
  const i = mode === 'light' ? 0 : 1;
  const colors = Object.fromEntries(Object.entries(MAP).map(([field, pair]) => [field, tok(mode, pair[i])]));
  return create({
    base: mode,
    brandTitle: '<span class="ember-brand"><span class="ember-brand__blob" aria-hidden="true"></span>Ember UI</span>',
    brandUrl: 'https://jdilig.me/ux/design-system',
    brandImage: null as unknown as string, // null (not undefined) makes Storybook render brandTitle as the mark; undefined shows the Storybook logo
    brandTarget: '_self',
    fontBase: neo.shape['--font-body'],
    fontCode: neo.shape['--font-mono'],
    appBorderRadius: px(neo.shape['--radius-md']),
    inputBorderRadius: px(neo.shape['--radius-md']),
    ...colors,
  } as Parameters<typeof create>[0]);
};
const themes = { light: build('light'), dark: build('dark') };

const applyVars = (mode: Mode) => {
  for (const [v, t] of Object.entries(CSS_VARS)) document.documentElement.style.setProperty(v, tok(mode, t));
};

// The manager follows the OS color scheme, live (SB-MANAGER-AA read it once at load). The preview's Mode toolbar does not drive it.
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const modeNow = (): Mode => (mq.matches ? 'dark' : 'light');
applyVars(modeNow());
addons.setConfig({ theme: themes[modeNow()] });
mq.addEventListener('change', () => {
  const m = modeNow();
  applyVars(m);
  addons.setConfig({ theme: themes[m] });
});
