// .storybook/manager.ts (STORYBOOK-BRAND). Copy as-is. Every color comes from src/tokens.json (neo), no literals.
import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';
import '@fontsource/archivo-black/400.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/700.css';
import '@fontsource/jetbrains-mono/400.css';
import tokens from '../src/tokens.json';

type Mode = 'light' | 'dark';
const neo = tokens.themes.neo as unknown as Record<Mode | 'shape', Record<string, string>>;
const tok = (mode: Mode, name: string) => neo[mode][name];
const px = (v: string) => parseInt(v, 10);

// Field -> neo token, per mode [light, dark]. Mirrors docs/storybook-brand/theme-map.json (contrast.mjs checks they match).
const MAP = {
  colorPrimary: ['--accent', '--accent'],
  colorSecondary: ['--accent', '--accent'],
  appBg: ['--color-bg', '--color-bg'],
  appContentBg: ['--surface', '--surface'],
  appPreviewBg: ['--color-bg', '--color-bg'],
  appBorderColor: ['--border', '--border'],
  textColor: ['--text', '--text'],
  textInverseColor: ['--color-bg', '--color-bg'],
  textMutedColor: ['--text-muted', '--text-muted'],
  barTextColor: ['--text-muted', '--text-muted'],
  barSelectedColor: ['--accent', '--accent'],
  barHoverColor: ['--accent-hover', '--accent-hover'],
  barBg: ['--surface', '--surface'],
  buttonBg: ['--surface', '--surface'],
  buttonBorder: ['--border', '--border'],
  booleanBg: ['--surface-muted', '--surface-muted'],
  booleanSelectedBg: ['--surface', '--surface'],
  inputBg: ['--surface', '--surface'],
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

// Mode follows prefers-color-scheme, live. The preview's Mode toolbar does not drive the manager.
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const modeNow = (): Mode => (mq.matches ? 'dark' : 'light');
applyVars(modeNow());

// Mobile-first (unchanged from main): from 600px (where Storybook's own mobile nav stops) up to 1024px,
// start with the sidebar collapsed so the docs get the full width. The toolbar's "Show sidebar" button brings it back.
const w = window.innerWidth;
addons.setConfig({ theme: themes[modeNow()], ...(w >= 600 && w < 1024 ? { navSize: 0 } : {}) });
mq.addEventListener('change', () => {
  const m = modeNow();
  applyVars(m);
  addons.setConfig({ theme: themes[m] });
});
