import type { Preview } from '@storybook/react';
import '@fontsource-variable/geist';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/instrument-serif';
import '@fontsource-variable/bricolage-grotesque';
import { addons } from '@storybook/preview-api';
import '../src/ember.css';
import { ToastProvider, applyTheme, type Theme, type Mode } from '../src';
import { Title, Subtitle, Description, Primary, ArgTypes, Stories } from '@storybook/blocks';

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

// Theme and Mode toolbar globals (R-2) set data-theme and data-mode on <html>, for stories and
// for docs-only pages too (those render no decorator, so listen for global changes as well).
const setThemeGlobals = (g: Record<string, unknown>) => applyTheme((g.theme as Theme) ?? 'editorial', (g.mode as Mode) ?? 'auto');
if (typeof window !== 'undefined') {
  const ch = addons.getChannel();
  ch.on('globalsUpdated', ({ globals }: { globals: Record<string, unknown> }) => setThemeGlobals(globals));
  ch.on('setGlobals', ({ globals }: { globals: Record<string, unknown> }) => setThemeGlobals(globals));
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: { title: 'Theme', icon: 'paintbrush', items: [{ value: 'editorial', title: 'Editorial' }, { value: 'bold', title: 'Bold' }, { value: 'tactile', title: 'Tactile' }], dynamicTitle: true },
    },
    mode: {
      description: 'Color mode',
      toolbar: { title: 'Mode', icon: 'mirror', items: [{ value: 'auto', title: 'Auto (system)' }, { value: 'light', title: 'Light' }, { value: 'dark', title: 'Dark' }], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'editorial', mode: 'auto' },
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
