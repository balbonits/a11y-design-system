import type { StorybookConfig } from '@storybook/react-vite';
const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y', 'storybook-addon-pseudo-states'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  docs: { defaultName: 'Docs' },
};
export default config;
