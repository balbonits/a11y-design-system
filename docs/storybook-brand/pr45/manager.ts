import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

// Mobile-first: from 600px (where Storybook's own mobile nav stops) up to 1024px,
// start with the sidebar collapsed so the docs get the full width. The toolbar's
// "Show sidebar" button brings it back.
const w = window.innerWidth;
if (w >= 600 && w < 1024) addons.setConfig({ navSize: 0 });

// SB-MANAGER-AA: Storybook's stock manager UI fails axe color-contrast (toolbar #029cfd on #f1f3f4 2.62:1, the selected
// sidebar item white on #029cfd 2.92:1, dark section toggles and code 3.93:1). This theme uses Ember neo palette values
// so every text pair is 4.5:1 or better and every UI/focus pair 3:1 or better, in light and dark. The manager follows the
// OS color scheme, like the stock theme. Brand title and logo are left as Storybook's defaults. Ratios are checked by
// scripts/a11y-manager.mjs (part of test:a11y). Hex values mirror src/themes/neo.css palette tokens (the manager can't
// read CSS custom properties from the preview).
const NEO = {
  ink: '#111111', ink2: '#1c1c1c', ink3: '#272727', inkSoft: '#3d3d3d', gray: '#6b6b6b', gray2: '#8c8c8c',
  cream: '#fdf8e9', cream2: '#f3ecd2', paper: '#ffffff', sand: '#cfc8b0',
  blue700: '#1530d0', blue600: '#1f3dff', lime400: '#c6f432', pink600: '#e0217a',
};
const shared = { fontBase: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', appBorderRadius: 4, inputBorderRadius: 4 };

const light = create({
  base: 'light', ...shared,
  colorPrimary: NEO.blue700, colorSecondary: NEO.blue600, // white on blue-600 for the selected item
  appBg: NEO.cream, appContentBg: NEO.paper, appPreviewBg: NEO.paper, appBorderColor: NEO.gray, // gray on cream/paper >= 3:1
  textColor: NEO.ink, textMutedColor: NEO.inkSoft, textInverseColor: NEO.paper,
  barBg: NEO.paper, barTextColor: NEO.inkSoft, barSelectedColor: NEO.blue700, barHoverColor: NEO.blue700,
  buttonBg: NEO.paper, buttonBorder: NEO.gray, booleanBg: NEO.cream2, booleanSelectedBg: NEO.paper,
  inputBg: NEO.paper, inputBorder: NEO.gray, inputTextColor: NEO.ink,
});

const dark = create({
  base: 'dark', ...shared,
  colorPrimary: NEO.lime400, colorSecondary: NEO.lime400, // also link text on ink-2; the selected item's label is set to ink in manager-head.html
  appBg: NEO.ink, appContentBg: NEO.ink2, appPreviewBg: NEO.paper, appBorderColor: NEO.gray2,
  textColor: NEO.cream, textMutedColor: NEO.sand, textInverseColor: NEO.ink,
  barBg: NEO.ink2, barTextColor: NEO.sand, barSelectedColor: NEO.lime400, barHoverColor: NEO.lime400,
  buttonBg: NEO.ink3, buttonBorder: NEO.gray2, booleanBg: NEO.ink, booleanSelectedBg: NEO.ink3,
  inputBg: NEO.ink, inputBorder: NEO.gray2, inputTextColor: NEO.cream,
});

const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
addons.setConfig({ theme: prefersDark ? dark : light });
