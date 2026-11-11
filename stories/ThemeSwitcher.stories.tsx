import type { Meta, StoryObj } from '@storybook/react';
import { ThemeSwitcher, THEME_KEY, MODE_KEY, DEFAULT_THEME, THEME_REGISTRY, type ThemeStorage } from '../src';
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
          use: ['A page or app lets people pick a color mode, and a theme when it registers more than one. The Theme group lists the registered themes (pass `themes` to use an app’s own registry) and is hidden when there is only one.'],
          avoid: ['The site has a single look. Don’t add a control that does nothing visible.', 'You need it on every page header. Put it in settings or the footer instead.'],
          anatomy: ['`fieldset` with the legend “Theme” and one native radio per registered theme (only when there are two or more)', '`fieldset` with the legend “Color mode” and Auto, Light and Dark radios', 'A visually hidden `role="status"` message that announces the result'],
          variants: 'One layout. Options wrap on narrow screens. Auto follows the operating system’s light or dark setting and updates live.',
          states: 'Checked, unchecked, hover, focus-visible. Windows High Contrast keeps a visible checked outline.',
          keyboard: [['Tab', 'Moves into each group (to the checked option)'], ['→ / ↓, ← / ↑', 'Moves to and selects the next or previous option in the group'], ['Space', 'Selects the focused option']],
          a11y: [
            ['1.3.1 Info and Relationships', 'Two native radio groups, each labelled by its `legend`.'],
            ['4.1.3 Status Messages', 'Each change is announced politely, for example “Theme Neo, automatic (dark) mode”.'],
            ['2.5.8 Target Size', 'Every option is at least 44 by 44 CSS pixels.'],
            ['2.3.3 Animation from Interactions', 'The cross-fade between themes is skipped under `prefers-reduced-motion`.'],
            FOCUS_NOTE,
          ],
          code: `// In <head>, before CSS, so there is no flash of the wrong theme (prepaintScript(myThemes) for an app registry):\n<script>{PREPAINT_SCRIPT}</script>\n\n<ThemeSwitcher onChange={(theme, mode) => track(theme, mode)} />\n<ThemeSwitcher themes={[{ id: 'neo', label: 'Neo' }, { id: 'dusk', label: 'Dusk' }]} />`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof ThemeSwitcher>;

// Start from the toolbar's Theme and Mode, so the story and the toolbar agree.
const render: S['render'] = (args, { globals }) => {
  mem.set(THEME_KEY, String(globals.theme ?? DEFAULT_THEME));
  mem.set(MODE_KEY, String(globals.mode ?? 'auto'));
  return <ThemeSwitcher key={`${globals.theme}-${globals.mode}`} {...args} />;
};
export const Default: S = { render };
export const FocusVisible: S = { render, parameters: { pseudo: { focusVisible: true } } };
/** With two registered themes (neo and kinetic) the Theme group appears. */
export const TwoThemes: S = { name: 'Two registered themes', render: (args) => <ThemeSwitcher {...args} storage={{ getItem: () => null, setItem: () => {}, removeItem: () => {} }} themes={THEME_REGISTRY} /> };
