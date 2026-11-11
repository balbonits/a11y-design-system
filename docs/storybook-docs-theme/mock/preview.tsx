import type { Preview } from '@storybook/react';
// Fonts named by the registered themes (neo: Archivo Black, Archivo, JetBrains Mono).
import '@fontsource/archivo-black';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/jetbrains-mono';
import { addons } from '@storybook/preview-api';
import '../src/ember.css';
import { ToastProvider, applyTheme, DEFAULT_THEME, THEME_REGISTRY, type Theme, type Mode } from '../src';
import { Title, Subtitle, Description, Primary, ArgTypes, Stories, DocsContainer } from '@storybook/blocks';
import { create } from '@storybook/theming';
import { useEffect, useState, type ComponentProps } from 'react';
import tokens from '../src/tokens.json';

// STORYBOOK-DOCS-THEME: the docs page (Storybook's own chrome in this iframe: page, text, rules, code blocks, the
// Canvas toolbar, the ArgTypes table) uses neo tokens from src/tokens.json and follows the Mode global live,
// with Auto following prefers-color-scheme. Field -> token map: docs/storybook-docs-theme/theme-map.json
// (contrast.mjs checks they match). Link, heading, code and syntax colors are CSS in preview-head.html.
type DocsMode = 'light' | 'dark';
const neo = tokens.themes.neo as unknown as Record<DocsMode | 'shape', Record<string, string>>;
const DOCS_MAP = {
  colorPrimary: ['--accent-hover', '--accent'],
  colorSecondary: ['--accent', '--accent'],
  appBg: ['--color-bg', '--color-bg'],
  appContentBg: ['--surface', '--surface'],
  appPreviewBg: ['--color-bg', '--color-bg'],
  appBorderColor: ['--border-subtle', '--border-subtle'],
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
const docsTheme = (mode: DocsMode) =>
  create({
    base: mode,
    fontBase: neo.shape['--font-body'],
    fontCode: neo.shape['--font-mono'],
    appBorderRadius: parseInt(neo.shape['--radius-md'], 10),
    inputBorderRadius: parseInt(neo.shape['--radius-md'], 10),
    ...Object.fromEntries(Object.entries(DOCS_MAP).map(([field, pair]) => [field, neo[mode][pair[mode === 'light' ? 0 : 1]]])),
  } as Parameters<typeof create>[0]);
const DOCS_THEMES = { light: docsTheme('light'), dark: docsTheme('dark') };
// Mode: data-mode on <html> (set by applyTheme from the Mode global), else Auto, which follows the OS.
const docsMode = (): DocsMode => {
  const m = document.documentElement.getAttribute('data-mode');
  if (m === 'light' || m === 'dark') return m;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
function EmberDocsContainer(props: ComponentProps<typeof DocsContainer>) {
  const [mode, setMode] = useState<DocsMode>(docsMode);
  useEffect(() => {
    const update = () => setMode(docsMode());
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode', 'data-theme'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);
    update();
    return () => { mo.disconnect(); mq.removeEventListener('change', update); };
  }, []);
  return <DocsContainer {...props} theme={DOCS_THEMES[mode]} />;
}

// Code samples scroll sideways on narrow screens. Make each scroll box reachable by
// keyboard (WCAG 2.1.1) and give it a name, since Storybook's Source block doesn't.
if (typeof window !== 'undefined') {
  const mark = () => {
    document.querySelectorAll<HTMLElement>('.docblock-source [data-radix-scroll-area-viewport]:not([tabindex])').forEach((el) => {
      el.tabIndex = 0;
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', 'Code sample');
    });
  };
  new MutationObserver(mark).observe(document.documentElement, { childList: true, subtree: true });
}

// Theme and Mode toolbar globals (R-2). The Theme items come from the registry, so a new theme shows up
// here with no Storybook change. Theme and Mode set data-theme and data-mode on <html>, for stories and
// for docs-only pages too (those render no decorator, so listen for global changes as well).
const setThemeGlobals = (g: Record<string, unknown>) => applyTheme((g.theme as Theme) ?? DEFAULT_THEME, (g.mode as Mode) ?? 'auto');
if (typeof window !== 'undefined') {
  const ch = addons.getChannel();
  ch.on('globalsUpdated', ({ globals }: { globals: Record<string, unknown> }) => setThemeGlobals(globals));
  ch.on('setGlobals', ({ globals }: { globals: Record<string, unknown> }) => setThemeGlobals(globals));
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: { title: 'Theme', icon: 'paintbrush', items: THEME_REGISTRY.map((t) => ({ value: t.id, title: t.label })), dynamicTitle: true },
    },
    mode: {
      description: 'Color mode',
      toolbar: { title: 'Mode', icon: 'mirror', items: [{ value: 'auto', title: 'Auto (system)' }, { value: 'light', title: 'Light' }, { value: 'dark', title: 'Dark' }], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: DEFAULT_THEME, mode: 'auto' },
  decorators: [
    (Story, ctx) => {
      setThemeGlobals(ctx.globals);
      document.body.style.background = 'var(--color-bg)';
      return (
        <ToastProvider>
          <div className="ember" style={{ padding: 16, background: 'var(--color-bg)', color: 'var(--text)' }}>
            <Story />
          </div>
        </ToastProvider>
      );
    },
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    docs: {
      container: EmberDocsContainer,
      // Read-only ArgTypes table instead of Storybook's interactive Controls block (its JSON editor fails axe).
      page: () => (
        <>
          <Title />
          <Subtitle />
          <Description />
          <Primary />
          <ArgTypes />
          <Stories />
        </>
      ),
    },
    a11y: { config: { rules: [] } },
    options: { storySort: { order: ['Introduction', 'Principles', 'Tokens', 'Components', ['Button', 'Input', 'Select', 'Checkbox', 'Modal', 'Tabs', 'Table', 'Toast', 'ThemeSwitcher']] } },
  },
};
export default preview;
