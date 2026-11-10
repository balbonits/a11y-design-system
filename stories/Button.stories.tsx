import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../src';
import { doc, FOCUS_NOTE } from './doc';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Save changes', variant: 'primary', size: 'md' },
  parameters: {
    docs: {
      description: {
        component: doc({
          use: ['Someone triggers an action: submit, save, open a dialog, delete.'],
          avoid: ['It goes to another page. Use a link (`<a href>`) instead.', 'There are several equal choices. Use a Select or Checkbox group.'],
          anatomy: ['Container (44px min height for md, the WCAG 2.5.8 target size)', 'Optional leading spinner while loading', 'Label, or an icon with an `aria-label` when icon-only'],
          variants: '`primary` for the main action (one per view), `secondary` for other actions, `ghost` for low-emphasis actions in toolbars, `danger` for destructive actions. Sizes `sm`, `md`, `lg`.',
          states: 'Default, hover, focus-visible, active (moves down 1px, off under reduced motion), disabled (native `disabled`), loading (`aria-busy="true"`, clicks are ignored).',
          keyboard: [['Tab', 'Moves focus to the button'], ['Enter / Space', 'Activates the button']],
          a11y: [
            ['4.1.2 Name, Role, Value', 'Native `<button>`. Icon-only buttons require `aria-label` (enforced by the TypeScript type).'],
            ['1.4.3 Contrast (Minimum)', 'Label text is 4.5:1 or more on every variant in both themes (see Tokens).'],
            ['2.5.8 Target Size (Minimum)', '`sm` is 36px, `md` 44px, `lg` 48px tall.'],
            FOCUS_NOTE,
            ['4.1.3 Status Messages', 'Loading sets `aria-busy`; pair it with a Toast or text for the result.'],
          ],
          code: `<Button variant="primary" onClick={save}>Save changes</Button>\n<Button variant="ghost" iconOnly aria-label="Close">✕</Button>`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof Button>;

export const Primary: S = {};
export const Secondary: S = { args: { variant: 'secondary', children: 'Cancel' } };
export const Ghost: S = { args: { variant: 'ghost', children: 'Skip' } };
export const Danger: S = { args: { variant: 'danger', children: 'Delete role' } };
export const Sizes: S = {
  render: (a) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button {...a} size="sm">Small</Button>
      <Button {...a} size="md">Medium</Button>
      <Button {...a} size="lg">Large</Button>
    </div>
  ),
};
export const IconOnly: S = { render: () => <Button variant="secondary" iconOnly aria-label="Add role"><span aria-hidden="true">+</span></Button> };
export const Hover: S = { parameters: { pseudo: { hover: true } } };
export const FocusVisible: S = { parameters: { pseudo: { focusVisible: true } } };
export const Active: S = { parameters: { pseudo: { active: true } } };
export const Disabled: S = { args: { disabled: true } };
export const Loading: S = { args: { loading: true, children: 'Saving…' } };
