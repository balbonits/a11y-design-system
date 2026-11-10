import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Button, Modal, Tabs, ToastProvider, useToast, Input } from './index';

function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a role" actions={<Button onClick={() => setOpen(false)}>Save</Button>}>
        <Input label="Company" />
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('is labelled by its title, moves focus in, and returns focus to the trigger on Esc', async () => {
    const u = userEvent.setup();
    render(<ModalDemo />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await u.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Add a role' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog.contains(document.activeElement)).toBe(true);
    await u.keyboard('{Escape}');
    expect(dialog).not.toHaveAttribute('open');
    expect(trigger).toHaveFocus();
  });

  it('keeps Tab inside the dialog', async () => {
    const u = userEvent.setup();
    render(<ModalDemo />);
    await u.click(screen.getByRole('button', { name: 'Open' }));
    const close = screen.getByRole('button', { name: 'Close dialog' });
    const save = screen.getByRole('button', { name: 'Save' });
    save.focus();
    await u.tab();
    expect(close).toHaveFocus();
    await u.tab({ shift: true });
    expect(save).toHaveFocus();
  });

  it('returns focus to the trigger when closed with a button', async () => {
    const u = userEvent.setup();
    render(<ModalDemo />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await u.click(trigger);
    await u.click(screen.getByRole('button', { name: 'Save' }));
    expect(trigger).toHaveFocus();
  });
});

describe('Tabs', () => {
  const tabs = [
    { id: 'a', label: 'One', content: 'Panel one' },
    { id: 'b', label: 'Two', content: 'Panel two' },
    { id: 'c', label: 'Three', content: 'Panel three', disabled: true },
    { id: 'd', label: 'Four', content: 'Panel four' },
  ];
  it('moves and selects with arrows, wraps, skips disabled, and supports Home/End', async () => {
    const u = userEvent.setup();
    render(<Tabs label="Test tabs" tabs={tabs} />);
    const one = screen.getByRole('tab', { name: 'One' });
    expect(one).toHaveAttribute('aria-selected', 'true');
    expect(one).toHaveAttribute('tabindex', '0');
    await u.tab();
    expect(one).toHaveFocus();
    await u.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel two');
    await u.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Four' })).toHaveFocus();
    await u.keyboard('{ArrowRight}');
    expect(one).toHaveFocus();
    await u.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Four' })).toHaveAttribute('aria-selected', 'true');
    await u.keyboard('{Home}');
    expect(one).toHaveAttribute('aria-selected', 'true');
    await u.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Four' })).toHaveAttribute('aria-selected', 'true');
    expect(one).toHaveAttribute('tabindex', '-1');
  });
});

function ToastDemo() {
  const show = useToast();
  return (
    <>
      <Button onClick={() => show({ tone: 'success', title: 'Saved' })}>Ok</Button>
      <Button onClick={() => show({ tone: 'error', title: 'Failed' })}>Bad</Button>
      <Button onClick={() => show({ tone: 'info', title: 'Short', duration: 1000 })}>Short</Button>
    </>
  );
}

describe('Toast', () => {
  it('puts info/success in role=status and errors in role=alert', async () => {
    const u = userEvent.setup();
    render(<ToastProvider><ToastDemo /></ToastProvider>);
    await u.click(screen.getByRole('button', { name: 'Ok' }));
    await u.click(screen.getByRole('button', { name: 'Bad' }));
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByRole('status')).not.toHaveTextContent('Failed');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('auto-dismisses, and pauses while hovered', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const u = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ToastProvider><ToastDemo /></ToastProvider>);
    await u.click(screen.getByRole('button', { name: 'Short' }));
    const toast = screen.getByText('Short', { selector: '.em-toast-title' }).closest('.em-toast')!;
    await u.hover(toast);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByRole('status')).toHaveTextContent('Short');
    await u.unhover(toast);
    act(() => { vi.advanceTimersByTime(1500); });
    expect(screen.getByRole('status')).not.toHaveTextContent('Short');
    vi.useRealTimers();
  });

  it('runs an action like Undo and then dismisses', async () => {
    const u = userEvent.setup();
    const undo = vi.fn();
    function Act() {
      const show = useToast();
      return <Button onClick={() => show({ tone: 'success', title: 'Reminder done', action: { label: 'Undo', onAction: undo } })}>Done</Button>;
    }
    render(<ToastProvider><Act /></ToastProvider>);
    await u.click(screen.getByRole('button', { name: 'Done' }));
    await u.click(screen.getByRole('button', { name: 'Undo' }));
    expect(undo).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).not.toHaveTextContent('Reminder done');
  });
});
