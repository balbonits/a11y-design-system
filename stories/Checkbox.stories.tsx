import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox, CheckboxGroup } from '../src';
import { doc, FOCUS_NOTE } from './doc';
import { AllThemes } from './AllThemes';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: { label: 'Remote only' },
  parameters: {
    docs: {
      description: {
        component: doc({
          use: ['A setting is on or off.', 'Someone picks any number of options from a short list (use CheckboxGroup).'],
          avoid: ['Only one option can be picked. Use radio buttons or a Select.', 'The change applies right away. Use a Switch.'],
          anatomy: ['Native checkbox (20px, inside a 44px tall row)', 'Label', 'Optional hint', 'Error message', 'CheckboxGroup: `<fieldset>` with a `<legend>`'],
          variants: 'Single checkbox, indeterminate ("some selected"), and a group.',
          states: 'Unchecked, checked, indeterminate (`aria-checked="mixed"`), hover, focus-visible, disabled, error.',
          keyboard: [['Tab', 'Moves focus to the checkbox'], ['Space', 'Toggles checked']],
          a11y: [
            ['1.3.1 Info and Relationships', 'Group uses `<fieldset>`/`<legend>`; each label uses `for`.'],
            ['4.1.2 Name, Role, Value', 'Native checkbox; indeterminate is set on the DOM property and announced as mixed.'],
            ['3.3.1 Error Identification', 'Error text is linked with `aria-describedby`.'],
            FOCUS_NOTE,
          ],
          code: `<CheckboxGroup legend="Work type">\n  <Checkbox label="Remote" />\n  <Checkbox label="Hybrid" />\n</CheckboxGroup>`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof Checkbox>;

function GroupDemo() {
  const all = ['Remote', 'Hybrid', 'On site'];
  const [on, setOn] = useState<string[]>(['Remote']);
  const flip = (x: string) => setOn((o) => (o.includes(x) ? o.filter((y) => y !== x) : [...o, x]));
  return (
    <CheckboxGroup legend="Work type">
      <Checkbox label="All types" checked={on.length === all.length} indeterminate={on.length > 0 && on.length < all.length} onChange={() => setOn(on.length === all.length ? [] : all)} />
      {all.map((x) => <Checkbox key={x} label={x} checked={on.includes(x)} onChange={() => flip(x)} />)}
    </CheckboxGroup>
  );
}

export const Default: S = {};
export const Checked: S = { args: { defaultChecked: true } };
export const Indeterminate: S = { args: { label: 'Select all roles', indeterminate: true } };
export const WithHint: S = { args: { hint: 'Hides roles that need you on site.' } };
export const Hover: S = { parameters: { pseudo: { hover: true } } };
export const FocusVisible: S = { parameters: { pseudo: { focusVisible: true } } };
export const Disabled: S = { args: { disabled: true } };
export const Error: S = { args: { label: 'I confirm the details are correct', error: 'Confirm before saving.' } };
export const Group: S = { render: () => <GroupDemo /> };

/** Unchecked, checked and error in all 6 theme x mode combos (R-2). */
export const AllThemesStory: S = {
  name: 'All themes',
  render: () => (
    <AllThemes>{() => (
      <div>
        <Checkbox label="Remote only" />
        <Checkbox label="Has salary range" defaultChecked />
        <Checkbox label="I confirm the details" error="Confirm before saving." />
      </div>
    )}</AllThemes>
  ),
};
