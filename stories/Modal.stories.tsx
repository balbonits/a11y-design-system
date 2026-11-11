import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button, Input, Modal } from '../src';
import { doc, FOCUS_NOTE } from './doc';
import { AllThemes } from './AllThemes';

function Demo({ startOpen = false, danger = false }: { startOpen?: boolean; danger?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <>
      <Button variant={danger ? 'danger' : 'primary'} onClick={() => setOpen(true)}>{danger ? 'Delete role' : 'Add role'}</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={danger ? 'Delete this role?' : 'Add a role'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={() => setOpen(false)}>{danger ? 'Delete' : 'Save'}</Button>
          </>
        }
      >
        {danger ? <p style={{ margin: 0 }}>This removes the role and its notes. You can't undo it.</p> : <Input label="Company" required />}
      </Modal>
    </>
  );
}

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      story: { inline: false, iframeHeight: 420 },
      description: {
        component: doc({
          use: ['A short task or decision must be finished before going back to the page: confirm a delete, fill a small form.'],
          avoid: ['The content is long or needs its own URL. Use a page.', 'It is a passing message. Use a Toast.'],
          anatomy: ['Native `<dialog>` opened with `showModal()` (page behind is inert)', 'Title (`<h2>`, labels the dialog)', 'Close button (`aria-label="Close dialog"`)', 'Body', 'Optional footer actions'],
          variants: 'Form dialog and confirm dialog (danger action). Width is 560px or the screen width minus 32px.',
          states: 'Closed, open (fades up 8px; no motion under reduced motion), focus inside, backdrop.',
          keyboard: [['Tab / Shift+Tab', 'Moves focus between controls inside; wraps at the ends'], ['Esc', 'Closes the dialog'], ['Enter / Space', 'Activates the focused button']],
          a11y: [
            ['2.1.2 No Keyboard Trap', 'Focus is kept inside while open, and Esc always closes it.'],
            ['2.4.3 Focus Order', 'Focus moves into the dialog on open and returns to the trigger on close.'],
            ['4.1.2 Name, Role, Value', 'Native dialog role, `aria-labelledby` points to the title.'],
            FOCUS_NOTE,
            ['2.3.3 Animation from Interactions', 'Open animation is off under `prefers-reduced-motion: reduce`.'],
          ],
          code: `<Modal open={open} onClose={() => setOpen(false)} title="Add a role"\n  actions={<Button onClick={save}>Save</Button>}>\n  <Input label="Company" />\n</Modal>`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof Modal>;

export const Default: S = { render: () => <Demo /> };
export const Open: S = { render: () => <Demo startOpen /> };
export const ConfirmDanger: S = { render: () => <Demo startOpen danger /> };

/** The dialog panel in all 6 theme x mode combos (R-2). A real modal blocks the page, so this
 *  shows the same panel styles statically; the Open story shows the live dialog. */
export const AllThemesStory: S = {
  name: 'All themes',
  render: () => (
    <AllThemes>{(l) => (
      <div className="em-modal" style={{ position: 'static', display: 'block', width: '100%' }}>
        <div className="em-modal-head"><p className="em-modal-title">Add a role</p><Button variant="ghost" iconOnly aria-label={`Close (${l})`}><span aria-hidden="true">✕</span></Button></div>
        <div className="em-modal-body"><Input label="Company" /></div>
        <div className="em-modal-foot"><Button variant="secondary">Cancel</Button><Button>Save</Button></div>
      </div>
    )}</AllThemes>
  ),
};
