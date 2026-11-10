import type { Preview } from '@storybook/react';
import '@fontsource-variable/geist';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/instrument-serif';
import '../src/ember.css';
import { ToastProvider } from '../src';
import { Title, Subtitle, Description, Primary, ArgTypes, Stories } from '@storybook/blocks';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: { title: 'Theme', icon: 'mirror', items: [{ value: 'light', title: 'Light' }, { value: 'dark', title: 'Dark' }], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, ctx) => {
      document.documentElement.setAttribute('data-theme', ctx.globals.theme ?? 'light');
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
    options: { storySort: { order: ['Introduction', 'Principles', 'Tokens', 'Components', ['Button', 'Input', 'Select', 'Checkbox', 'Modal', 'Tabs', 'Table', 'Toast']] } },
  },
};
export default preview;
