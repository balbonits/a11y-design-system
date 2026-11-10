import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '../src';
import { doc, FOCUS_NOTE } from './doc';

const options = (
  <>
    <option value="">Choose a stage</option>
    <option value="saved">Saved</option>
    <option value="applied">Applied</option>
    <option value="interview">Interview</option>
    <option value="offer">Offer</option>
  </>
);

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  args: { label: 'Stage', children: options },
  parameters: {
    docs: {
      description: {
        component: doc({
          use: ['Someone picks one option from a list of about 4 to 15.'],
          avoid: ['There are 2 or 3 options. Show them all as radio buttons.', 'The list needs search. That is a custom listbox, planned for a later version.'],
          anatomy: ['Visible label', 'Optional hint', 'Native `<select>` styled with tokens', 'Error message'],
          variants: 'One size (44px). Use an empty first option as a prompt when there is no default.',
          states: 'Default, hover, focus-visible, disabled, error.',
          keyboard: [['Tab', 'Moves focus to the select'], ['Space / Enter / Alt+↓', 'Opens the option list (browser native)'], ['↑ / ↓', 'Changes the option'], ['Typing a letter', 'Jumps to a matching option']],
          a11y: [
            ['4.1.2 Name, Role, Value', 'Native `<select>`: the browser and screen reader handle the listbox.'],
            ['1.3.1 Info and Relationships', 'Label and hint/error wired with `for` and `aria-describedby`.'],
            ['3.3.1 Error Identification', 'Error shown as text and `aria-invalid`.'],
            FOCUS_NOTE,
          ],
          code: `<Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value)}>\n  <option value="applied">Applied</option>\n</Select>`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof Select>;

export const Default: S = {};
export const Hover: S = { parameters: { pseudo: { hover: true } } };
export const FocusVisible: S = { parameters: { pseudo: { focusVisible: true } } };
export const Disabled: S = { args: { disabled: true } };
export const Error: S = { args: { required: true, error: 'Choose a stage.' } };
