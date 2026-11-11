import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Switch } from '../src';
import { doc, FOCUS_NOTE } from './doc';
import { AllThemes } from './AllThemes';

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  args: { label: 'Email me new matches' },
  parameters: {
    docs: {
      description: {
        component: doc({
          use: ['A setting that takes effect as soon as it changes, such as notifications on or off.'],
          avoid: ['The choice is only applied when a form is submitted. Use a Checkbox.', 'There are more than two options. Use radio buttons or a Select.'],
          anatomy: ['Native checkbox with `role="switch"` (a 44 x 24px track inside a 44px tall row)', 'Thumb: left when off, right and wider when on', 'Label (the whole row is the hit area)', 'Optional hint'],
          variants: 'Off, on, and with a hint.',
          states: 'Off, on (thumb moves right, track fills, label turns semibold), hover, focus-visible, disabled. The thumb slides in `--duration-fast`, which is 0 under reduced motion.',
          keyboard: [['Tab', 'Moves focus to the switch'], ['Space', 'Turns it on or off']],
          a11y: [
            ['4.1.2 Name, Role, Value', 'A native checkbox with `role="switch"`, so it is announced as a switch, on or off, with its label.'],
            ['1.4.1 Use of Color', 'On and off differ by thumb position and size and label weight, not only by color.'],
            ['1.4.11 Non-text Contrast', 'The track outline uses `--border` and the thumb uses `--text-muted` or `--accent-contrast`, all checked at 3:1 or better by `npm run contrast`.'],
            ['2.5.8 Target Size', 'The row is at least `--target-min` (44px) tall, and clicking the label toggles it.'],
            FOCUS_NOTE,
          ],
          code: `<Switch label="Email me new matches" checked={on} onChange={(e) => setOn(e.target.checked)} />`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof Switch>;

function Controlled() {
  const [on, setOn] = useState(true);
  return <Switch label={`Email me new matches (${on ? 'on' : 'off'})`} checked={on} onChange={(e) => setOn(e.target.checked)} />;
}

export const Default: S = {};
export const On: S = { args: { defaultChecked: true } };
export const WithHint: S = { args: { hint: 'At most one email a day.' } };
export const Hover: S = { parameters: { pseudo: { hover: true } } };
export const FocusVisible: S = { parameters: { pseudo: { focusVisible: true } } };
export const Disabled: S = { args: { disabled: true } };
export const DisabledOn: S = { args: { disabled: true, defaultChecked: true } };
export const ControlledStory: S = { name: 'Controlled', render: () => <Controlled /> };

/** Off, on and with a hint in every registered theme, light and dark. */
export const AllThemesStory: S = {
  name: 'All themes',
  render: () => (
    <AllThemes>{() => (
      <div>
        <Switch label="Email me new matches" />
        <Switch label="Show salary ranges" defaultChecked />
        <Switch label="Weekly digest" hint="Sent on Mondays." />
      </div>
    )}</AllThemes>
  ),
};
