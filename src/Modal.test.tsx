import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { Button, Input, Modal, Tabs } from './index';

// The Modal keeps Tab inside the dialog by wrapping from its last to its first tabbable control and back. The ends must
// be controls that Tab can actually reach: not <input type="hidden">, not tabindex="-1" (inactive tabs), not hidden.
function Demo({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit">{children}</Modal>
      <Button>After</Button>
    </>
  );
}

describe('Modal focus trap wraps between tabbable controls only', () => {
  it('ignores a hidden input at the end of a form', async () => {
    const u = userEvent.setup();
    render(<Demo><form><Input label="Name" /><input type="hidden" name="token" value="x" /></form></Demo>);
    await u.click(screen.getByRole('button', { name: 'Open' }));
    const close = screen.getByRole('button', { name: 'Close dialog' });
    const name = screen.getByRole('textbox', { name: 'Name' });
    close.focus();
    await u.tab({ shift: true });
    expect(name).toHaveFocus();
    await u.tab();
    expect(close).toHaveFocus();
  });

  it('ignores inactive tabs (tabindex=-1) and hidden tab panels', async () => {
    const u = userEvent.setup();
    const tabs = [
      { id: 'a', label: 'One', content: 'Panel one' },
      { id: 'b', label: 'Two', content: 'Panel two' },
    ];
    render(<Demo><Tabs label="Sections" tabs={tabs} /></Demo>);
    await u.click(screen.getByRole('button', { name: 'Open' }));
    const close = screen.getByRole('button', { name: 'Close dialog' });
    const panel = screen.getByRole('tabpanel', { name: 'One' });
    close.focus();
    await u.tab({ shift: true });
    expect(panel).toHaveFocus();
    await u.tab();
    expect(close).toHaveFocus();
  });

  it('lands on the checked radio of a group, not the last radio', async () => {
    const u = userEvent.setup();
    render(
      <Demo>
        <fieldset>
          <legend>Size</legend>
          <label><input type="radio" name="size" value="s" defaultChecked /> Small</label>
          <label><input type="radio" name="size" value="l" /> Large</label>
        </fieldset>
      </Demo>,
    );
    await u.click(screen.getByRole('button', { name: 'Open' }));
    const close = screen.getByRole('button', { name: 'Close dialog' });
    close.focus();
    await u.tab({ shift: true });
    expect(screen.getByRole('radio', { name: 'Small' })).toHaveFocus();
  });
});
