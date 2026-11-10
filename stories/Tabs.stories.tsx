import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from '../src';
import { doc, FOCUS_NOTE } from './doc';

const tabs = [
  { id: 'overview', label: 'Overview', content: <p style={{ margin: 0 }}>Role summary and current stage.</p> },
  { id: 'notes', label: 'Notes', content: <p style={{ margin: 0 }}>Interview notes go here.</p> },
  { id: 'contacts', label: 'Contacts', content: <p style={{ margin: 0 }}>Recruiter and hiring manager.</p> },
];

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  args: { label: 'Role details', tabs },
  parameters: {
    docs: {
      description: {
        component: doc({
          use: ['Related content splits into 2 to 6 views and only one is needed at a time.'],
          avoid: ['The views are steps in order. Use a stepper or separate pages.', 'People need to compare views side by side. Show them together.'],
          anatomy: ['`tablist` with an accessible name', '`tab` buttons (roving tabindex: only the selected tab is in the Tab order)', '`tabpanel` for each tab, labelled by its tab and focusable'],
          variants: 'Horizontal tabs. Tabs scroll sideways when they do not fit (320px wide screens).',
          states: 'Selected (accent underline), unselected, hover, focus-visible, disabled tab (skipped by arrow keys).',
          keyboard: [['Tab', 'Moves focus to the selected tab, then into the panel'], ['→ / ←', 'Moves to and selects the next or previous tab (wraps)'], ['Home / End', 'Selects the first or last tab']],
          a11y: [
            ['4.1.2 Name, Role, Value', 'WAI-ARIA tabs pattern: `tablist`, `tab` with `aria-selected` and `aria-controls`, `tabpanel` with `aria-labelledby`.'],
            ['2.1.1 Keyboard', 'Arrow keys, Home and End, with automatic activation.'],
            ['1.4.11 Non-text Contrast', 'The selected underline uses `--accent`, 3:1 or more against the background.'],
            FOCUS_NOTE,
          ],
          code: `<Tabs label="Role details" tabs={[\n  { id: 'overview', label: 'Overview', content: <Overview /> },\n  { id: 'notes', label: 'Notes', content: <Notes /> },\n]} />`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof Tabs>;

export const Default: S = {};
export const SecondSelected: S = { args: { defaultTab: 'notes' } };
export const WithDisabledTab: S = { args: { tabs: [...tabs.slice(0, 2), { ...tabs[2], disabled: true }] } };
export const Hover: S = { parameters: { pseudo: { hover: true } } };
export const FocusVisible: S = { parameters: { pseudo: { focusVisible: true } } };
