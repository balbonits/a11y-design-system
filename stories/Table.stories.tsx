import type { Meta, StoryObj } from '@storybook/react';
import { Table, type Column } from '../src';
import { doc, FOCUS_NOTE } from './doc';
import { AllThemes } from './AllThemes';

type Row = { company: string; role: string; stage: string; updated: string };
const rows: Row[] = [
  { company: 'Example Co', role: 'Front-End Engineer', stage: 'Applied', updated: '2026-11-02' },
  { company: 'Sample Labs', role: 'UI Engineer', stage: 'Interview', updated: '2026-11-05' },
  { company: 'Demo Inc', role: 'React Developer', stage: 'Saved', updated: '2026-10-29' },
];
const columns: Column<Row>[] = [
  { key: 'company', header: 'Company', sortable: true, rowHeader: true },
  { key: 'role', header: 'Role' },
  { key: 'stage', header: 'Stage', sortable: true },
  { key: 'updated', header: 'Updated', sortable: true },
];

const meta: Meta<typeof Table<Row>> = {
  title: 'Components/Table',
  component: Table,
  tags: ['autodocs'],
  args: { caption: 'Roles (example data)', columns, rows, rowKey: (r: Row) => r.company },
  parameters: {
    docs: {
      description: {
        component: doc({
          use: ['People compare items across the same fields.', 'People sort or scan rows of data.'],
          avoid: ['The data is a single record. Use a list of label and value pairs.', 'It is for layout. Use CSS grid.'],
          anatomy: ['Scroll container (`role="region"`, labelled by the caption, focusable so keyboard users can scroll)', '`<caption>`', 'Header cells with `scope="col"`', 'Sort buttons inside sortable headers', 'Row header cells with `scope="row"`'],
          variants: 'Default, zebra rows, dense (for internal tools), and an empty state.',
          states: 'Unsorted (`aria-sort="none"`), ascending, descending, row hover, focus-visible on the region and the sort buttons.',
          keyboard: [['Tab', 'Moves to the scroll region, then each sort button'], ['Enter / Space', 'Sorts by that column; press again to reverse'], ['← / →', 'Scrolls the region sideways when it has focus']],
          a11y: [
            ['1.3.1 Info and Relationships', 'Real `<table>` with caption and `scope` on headers.'],
            ['4.1.2 Name, Role, Value', '`aria-sort` on the sorted header; the sort control is a `<button>`.'],
            ['1.4.10 Reflow', 'Wide tables scroll inside a focusable region instead of the whole page at 320px.'],
            ['2.1.1 Keyboard', 'The scroll region is focusable so it scrolls by keyboard.'],
            FOCUS_NOTE,
          ],
          code: `<Table caption="Roles" rowKey={(r) => r.id} rows={roles}\n  columns={[{ key: 'company', header: 'Company', sortable: true, rowHeader: true }]} />`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof Table<Row>>;

export const Default: S = {};
export const Sorted: S = { args: { initialSort: { key: 'updated', dir: 'descending' } } };
export const Zebra: S = { args: { zebra: true } };
export const Dense: S = { args: { dense: true } };
export const Empty: S = { args: { rows: [], empty: 'No roles yet. Add your first one.' } };
export const FocusVisible: S = { parameters: { pseudo: { focusVisible: true } } };

/** Table in all 6 theme x mode combos (R-2). */
export const AllThemesStory: S = {
  name: 'All themes',
  render: (a) => <AllThemes>{(l) => <Table {...a} caption={`Roles (${l})`} />}</AllThemes>,
};
