import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Button, Modal, Tabs, ToastProvider, useToast, Input, ThemeSwitcher } from './index';

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

function MountedModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      {open && (
        <Modal open onClose={() => setOpen(false)} title="Edit role">
          <Input label="Title" />
        </Modal>
      )}
    </>
  );
}

describe('Modal', () => {
  it('returns focus to the trigger when the app unmounts it while open', async () => {
    const u = userEvent.setup();
    render(<MountedModalDemo />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await u.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Edit role' }).contains(document.activeElement)).toBe(true);
    await u.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

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

  it('never auto-dismisses an error or a toast with an action (WCAG 2.2.1)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const u = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    function Sticky() {
      const show = useToast();
      return (
        <>
          <Button onClick={() => show({ tone: 'error', title: 'Broke', duration: 1000 })}>Err</Button>
          <Button onClick={() => show({ tone: 'success', title: 'Moved', duration: 1000, action: { label: 'Undo', onAction: () => {} } })}>Act</Button>
        </>
      );
    }
    render(<ToastProvider><Sticky /></ToastProvider>);
    await u.click(screen.getByRole('button', { name: 'Err' }));
    await u.click(screen.getByRole('button', { name: 'Act' }));
    act(() => { vi.advanceTimersByTime(60000); });
    expect(screen.getByRole('alert')).toHaveTextContent('Broke');
    expect(screen.getByRole('status')).toHaveTextContent('Moved');
    await u.click(screen.getByRole('button', { name: 'Dismiss: Broke' }));
    expect(screen.getByRole('alert')).not.toHaveTextContent('Broke');
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

describe('ThemeSwitcher (R-2)', () => {
  const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m }; };
  afterEach(() => { document.documentElement.removeAttribute('data-theme'); document.documentElement.removeAttribute('data-mode'); });

  it('has two labelled radio groups and starts from storage', () => {
    const s = mem(); s.setItem('jdilig:theme', 'bold'); s.setItem('jdilig:mode', 'dark');
    render(<ThemeSwitcher storage={s} />);
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Color mode' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Bold' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe('bold');
    expect(document.documentElement.dataset.mode).toBe('dark');
  });

  it('works by keyboard, persists, announces, and removes keys for Editorial and Auto', async () => {
    const s = mem(); const onChange = vi.fn(); const u = userEvent.setup();
    render(<ThemeSwitcher storage={s} onChange={onChange} />);
    await u.tab();
    expect(screen.getByRole('radio', { name: 'Editorial' })).toHaveFocus();
    await u.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Bold' })).toBeChecked();
    expect(s.m.get('jdilig:theme')).toBe('bold');
    expect(document.documentElement.dataset.theme).toBe('bold');
    expect(screen.getByRole('status')).toHaveTextContent(/^Theme Bold, automatic \((dark|light)\) mode$/);
    await u.click(screen.getByRole('radio', { name: 'Light' }));
    expect(s.m.get('jdilig:mode')).toBe('light');
    expect(screen.getByRole('status')).toHaveTextContent('Theme Bold, light mode');
    await u.click(screen.getByRole('radio', { name: 'Editorial' }));
    await u.click(screen.getByRole('radio', { name: 'Auto' }));
    expect(s.m.has('jdilig:theme')).toBe(false);
    expect(s.m.has('jdilig:mode')).toBe(false);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(document.documentElement.hasAttribute('data-mode')).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith('editorial', 'auto');
  });
});
