import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../src';
import { doc, FOCUS_NOTE } from './doc';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: { label: 'Company', hint: 'As it appears on the job post.' },
  parameters: {
    docs: {
      description: {
        component: doc({
          use: ['You need one line of free text: a name, a URL, an email, a date.'],
          avoid: ['The answer is one of a known list. Use a Select.', 'You need several lines. Use a textarea with the same field wiring.'],
          anatomy: ['Visible label (always shown, never a placeholder alone)', 'Required marker `*` (hidden from screen readers; the native `required` is announced)', 'Hint text', 'Control', 'Error message, prefixed "Error:"'],
          variants: 'Any native input `type` (text, email, url, date, search). Use the `hint` and `error` props for help text.',
          states: 'Default, hover (darker border), focus-visible, disabled, error (`aria-invalid="true"`, 2px danger border and a text message).',
          keyboard: [['Tab', 'Moves focus into the field'], ['Typing', 'Edits the value (native behavior)']],
          a11y: [
            ['1.3.1 Info and Relationships / 3.3.2 Labels or Instructions', 'Real `<label for>`; hint and error are linked with `aria-describedby`.'],
            ['3.3.1 Error Identification', 'Errors are text ("Error: …"), not only a red border, and are read with the field.'],
            ['1.4.11 Non-text Contrast', 'The input border is `--border`, 3:1 or more against the surface.'],
            FOCUS_NOTE,
          ],
          code: `<Input label="Company" required error={errors.company} />`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof Input>;

export const Default: S = {};
export const Required: S = { args: { required: true } };
export const Hover: S = { parameters: { pseudo: { hover: true } } };
export const FocusVisible: S = { parameters: { pseudo: { focusVisible: true } } };
export const Disabled: S = { args: { disabled: true, defaultValue: 'Acme' } };
export const Error: S = { args: { required: true, error: 'Enter the company name.' } };
