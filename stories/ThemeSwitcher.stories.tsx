import type { Meta, StoryObj } from '@storybook/react';
import { ThemeSwitcher, THEME_KEY, MODE_KEY, type ThemeStorage } from '../src';
import { doc, FOCUS_NOTE } from './doc';

// Stories don't persist to the real localStorage, so the toolbar stays the source of truth on reload.
const mem = new Map<string, string>();
const storage: ThemeStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };

const meta: Meta<typeof ThemeSwitcher> = {
  title: 'Components/ThemeSwitcher',
  component: ThemeSwitcher,
  tags: ['autodocs'],
  args: { storage },
  parameters: {
    docs: {
      description: {
        component: doc({
          use: ['A page or app lets people pick one of the three themes (Editorial, Bold, Tactile) and a color mode.'],
          avoid: ['The site has a single look. Don’t add a control that does nothing visible.', 'You need it on every page header. Put it in settings or the footer instead.'],
          anatomy: ['`fieldset` with the legend “Theme” and 3 native radios', '`fieldset` with the legend “Color mode” and Auto, Light and Dark radios', 'A visually hidden `role="status"` message that announces the result'],
          variants: 'One layout. Options wrap on narrow screens. Auto follows the operating system’s light or dark setting and updates live.',
          states: 'Checked, unchecked, hover, focus-visible. Windows High Contrast keeps a visible checked outline.',
          keyboard: [['Tab', 'Moves into each group (to the checked option)'], ['→ / ↓, ← / ↑', 'Moves to and selects the next or previous option in the group'], ['Space', 'Selects the focused option']],
          a11y: [
            ['1.3.1 Info and Relationships', 'Two native radio groups, each labelled by its `legend`.'],
            ['4.1.3 Status Messages', 'Each change is announced politely, for example “Theme Bold, automatic (dark) mode”.'],
            ['2.5.8 Target Size', 'Every option is at least 44 by 44 CSS pixels.'],
            ['2.3.3 Animation from Interactions', 'The cross-fade between themes is skipped under `prefers-reduced-motion`.'],
            FOCUS_NOTE,
          ],
          code: `// In <head>, before CSS, so there is no flash of the wrong theme:\n<script>{PREPAINT_SCRIPT}</script>\n\n<ThemeSwitcher onChange={(theme, mode) => track(theme, mode)} />`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof ThemeSwitcher>;

// Start from the toolbar's Theme and Mode, so the story and the toolbar agree.
const render: S['render'] = (args, { globals }) => {
  mem.set(THEME_KEY, String(globals.theme ?? 'editorial'));
  mem.set(MODE_KEY, String(globals.mode ?? 'auto'));
  return <ThemeSwitcher key={`${globals.theme}-${globals.mode}`} {...args} />;
};
export const Default: S = { render };
export const FocusVisible: S = { render, parameters: { pseudo: { focusVisible: true } } };
