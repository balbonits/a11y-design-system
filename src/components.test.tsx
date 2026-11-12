import { render, screen, act, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Switch, Button, Modal, Tabs, ToastProvider, useToast, Input, ThemeSwitcher, THEMES, THEME_REGISTRY, DEFAULT_THEME, PREPAINT_SCRIPT, prepaintScript } from './index';

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

  it('2.4.11: marks the newest toast, offers "Show all notifications (N)" with a stable name, and reserves the stack height on the page', async () => {
    const u = userEvent.setup();
    render(<ToastProvider><ToastDemo /></ToastProvider>);
    await u.click(screen.getByRole('button', { name: 'Bad' }));
    expect(document.documentElement).toHaveAttribute('data-em-toasts');
    expect(screen.queryByRole('button', { name: /^Show all notifications/ })).toBeNull();
    await u.click(screen.getByRole('button', { name: 'Bad' }));
    await u.click(screen.getByRole('button', { name: 'Bad' }));
    const toasts = document.querySelectorAll('.em-toast');
    expect(toasts).toHaveLength(3);
    expect([...toasts].filter((t) => t.hasAttribute('data-newest'))).toEqual([toasts[2]]);
    const more = screen.getByRole('button', { name: 'Show all notifications (3)' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await u.click(more);
    expect(screen.getByRole('button', { name: 'Show all notifications (3)' })).toHaveAttribute('aria-expanded', 'true');
    await u.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'false');
    for (const b of screen.getAllByRole('button', { name: /^Dismiss/ })) await u.click(b);
    expect(document.documentElement).not.toHaveAttribute('data-em-toasts');
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

// FU-EMBER-TOAST-MODAL: toasts render into the topmost open modal (WCAG 4.1.3; the page behind a modal is inert).
function ToastModalDemo({ duration = 5000 }: { duration?: number }) {
  const show = useToast();
  const [outer, setOuter] = useState(false);
  const [inner, setInner] = useState(false);
  return (
    <>
      <Button onClick={() => setOuter(true)}>Open outer</Button>
      <Button onClick={() => show({ tone: 'success', title: 'Page toast', duration })}>Page toast</Button>
      <Modal open={outer} onClose={() => setOuter(false)} title="Outer">
        <Button onClick={() => show({ tone: 'success', title: 'Saved in outer', duration })}>Toast from outer</Button>
        <Button onClick={() => setInner(true)}>Open inner</Button>
        <Modal open={inner} onClose={() => setInner(false)} title="Inner">
          <Button onClick={() => show({ tone: 'error', title: 'Failed in inner' })}>Error from inner</Button>
        </Modal>
      </Modal>
    </>
  );
}
const statusIn = (el: HTMLElement) => within(el).getAllByRole('status', { hidden: true }).at(-1)!;
const pageViewport = () => document.querySelector<HTMLElement>('.em-toast-viewport:not(.em-toast-viewport--modal)')!;

describe('Toast inside a modal (FU-EMBER-TOAST-MODAL)', () => {
  it('renders a toast fired with a modal open into the modal, announced and dismissable by keyboard', async () => {
    const u = userEvent.setup();
    render(<ToastProvider><ToastModalDemo /></ToastProvider>);
    await u.click(screen.getByRole('button', { name: 'Open outer' }));
    const outer = screen.getByRole('dialog', { name: 'Outer' });
    await waitFor(() => expect(outer.querySelector('.em-toast-viewport--modal')).not.toBeNull());
    // The outlet's live region exists (empty) before the toast is added, so the addition is announced.
    const region = outer.querySelector<HTMLElement>(':scope > .em-toast-outlet [role="status"]')!;
    expect(region).toBeEmptyDOMElement();
    await new Promise((r) => setTimeout(r, 150));
    const trigger = within(outer).getByRole('button', { name: 'Toast from outer' });
    await u.click(trigger);
    await waitFor(() => expect(statusIn(outer)).toHaveTextContent('Saved in outer'));
    expect(pageViewport()).not.toHaveTextContent('Saved in outer');
    const dismiss = within(outer).getByRole('button', { name: 'Dismiss: Saved in outer', hidden: true });
    dismiss.focus();
    await u.keyboard('{Enter}');
    expect(outer).not.toHaveTextContent('Saved in outer');
    expect(outer.contains(document.activeElement)).toBe(true);
  });

  it('keeps toast buttons inside the focus trap: Tab from the last one wraps to the dialog\'s first control', async () => {
    const u = userEvent.setup();
    render(<ToastProvider><ToastModalDemo duration={600000} /></ToastProvider>);
    await u.click(screen.getByRole('button', { name: 'Open outer' }));
    const outer = screen.getByRole('dialog', { name: 'Outer' });
    await new Promise((r) => setTimeout(r, 150));
    await u.click(within(outer).getByRole('button', { name: 'Toast from outer' }));
    await waitFor(() => expect(statusIn(outer)).toHaveTextContent('Saved in outer'));
    within(outer).getByRole('button', { name: 'Dismiss: Saved in outer', hidden: true }).focus();
    await u.tab();
    expect(document.activeElement).toBe(within(outer).getByRole('button', { name: 'Close dialog' }));
  });

  it('nested modals: the topmost wins, Esc closes only it, and a showing toast moves to the outer modal', async () => {
    const u = userEvent.setup();
    render(<ToastProvider><ToastModalDemo /></ToastProvider>);
    await u.click(screen.getByRole('button', { name: 'Open outer' }));
    const outer = screen.getByRole('dialog', { name: 'Outer' });
    await u.click(within(outer).getByRole('button', { name: 'Open inner' }));
    const inner = screen.getByRole('dialog', { name: 'Inner' });
    await new Promise((r) => setTimeout(r, 150));
    await u.click(within(inner).getByRole('button', { name: 'Error from inner' }));
    await waitFor(() => expect(inner.querySelector(':scope > .em-toast-outlet [role="alert"]')).toHaveTextContent('Failed in inner'));
    expect(outer.querySelector(':scope > .em-toast-outlet [role="alert"]')).toBeNull(); // outer has no stack while inner is topmost
    within(inner).getByRole('button', { name: 'Error from inner' }).focus();
    await u.keyboard('{Escape}');
    expect(inner).not.toHaveAttribute('open');
    expect(outer).toHaveAttribute('open');
    // Moved, not re-announced: it shows in the outer modal outside any live region.
    await waitFor(() => expect(outer.querySelector(':scope > .em-toast-outlet [data-em-toast-moved]')).toHaveTextContent('Failed in inner'));
    expect(outer.querySelector(':scope > .em-toast-outlet [role="alert"]')).not.toHaveTextContent('Failed in inner');
  });

  it('returns a showing toast to the page toaster when the modal closes', async () => {
    const u = userEvent.setup();
    render(<ToastProvider><ToastModalDemo duration={600000} /></ToastProvider>);
    await u.click(screen.getByRole('button', { name: 'Open outer' }));
    const outer = screen.getByRole('dialog', { name: 'Outer' });
    await u.click(within(outer).getByRole('button', { name: 'Toast from outer' }));
    await waitFor(() => expect(statusIn(outer)).toHaveTextContent('Saved in outer'));
    await u.keyboard('{Escape}');
    await waitFor(() => expect(pageViewport().querySelector('[data-em-toast-moved]')).toHaveTextContent('Saved in outer'));
    expect(within(pageViewport()).getByRole('status')).not.toHaveTextContent('Saved in outer');
    expect(document.querySelector('.em-toast-viewport--modal')).toBeNull();
  });

  it('announces each toast once: moving it back to the page on close (or into a modal on open) adds nothing to a live region', async () => {
    const u = userEvent.setup();
    const fills: string[] = [];
    const mo = new MutationObserver((recs) => {
      for (const r of recs) {
        const live = (r.target as Element).closest?.('[role="status"],[role="alert"]');
        if (!live) continue;
        for (const n of r.addedNodes) if (n.textContent) fills.push(n.textContent);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    render(<ToastProvider><ToastModalDemo duration={600000} /></ToastProvider>);
    // Fired in the modal, then the modal closes.
    await u.click(screen.getByRole('button', { name: 'Open outer' }));
    const outer = screen.getByRole('dialog', { name: 'Outer' });
    await new Promise((r) => setTimeout(r, 150));
    await u.click(within(outer).getByRole('button', { name: 'Toast from outer' }));
    await waitFor(() => expect(statusIn(outer)).toHaveTextContent('Saved in outer'));
    await u.keyboard('{Escape}');
    await waitFor(() => expect(pageViewport()).toHaveTextContent('Saved in outer'));
    // Fired on the page, then a modal opens over it.
    await u.click(screen.getByRole('button', { name: 'Page toast' }));
    await waitFor(() => expect(within(pageViewport()).getByRole('status')).toHaveTextContent('Page toast'));
    await u.click(screen.getByRole('button', { name: 'Open outer' }));
    const again = screen.getByRole('dialog', { name: 'Outer' });
    await waitFor(() => expect(again.querySelector('[data-em-toast-moved]')).toHaveTextContent('Page toast'));
    await new Promise((r) => setTimeout(r, 50));
    mo.disconnect();
    expect(fills.filter((t) => t.includes('Saved in outer'))).toHaveLength(1);
    expect(fills.filter((t) => t.includes('Page toast'))).toHaveLength(1);
  });

  it('#37 x #51: in a modal, the "Show all notifications (N)" toggle and the newest marker move with the toasts, and the page reserves no space', async () => {
    const u = userEvent.setup();
    render(<ToastProvider><ToastModalDemo duration={600000} /></ToastProvider>);
    await u.click(screen.getByRole('button', { name: 'Page toast' }));
    expect(document.documentElement).toHaveAttribute('data-em-toasts');
    await u.click(screen.getByRole('button', { name: 'Open outer' }));
    const outer = screen.getByRole('dialog', { name: 'Outer' });
    await new Promise((r) => setTimeout(r, 150));
    await u.click(within(outer).getByRole('button', { name: 'Toast from outer' }));
    await waitFor(() => expect(statusIn(outer)).toHaveTextContent('Saved in outer'));
    const modalViewport = outer.querySelector<HTMLElement>('.em-toast-viewport--modal')!;
    // The collapse CSS applies to every .em-toast-viewport, so the toggle must be in the viewport that holds the toasts.
    const more = within(modalViewport).getByRole('button', { name: 'Show all notifications (2)', hidden: true });
    expect(within(pageViewport()).queryByRole('button', { name: /^Show all notifications/, hidden: true })).toBeNull();
    expect(modalViewport.querySelector('[data-newest]')).toHaveTextContent('Saved in outer');
    // The page behind the modal is inert and its viewport is empty, so it reserves nothing.
    await waitFor(() => expect(document.documentElement).not.toHaveAttribute('data-em-toasts'));
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await u.click(more);
    expect(within(modalViewport).getByRole('button', { name: 'Show all notifications (2)', hidden: true })).toHaveAttribute('aria-expanded', 'true');
    expect(modalViewport).toHaveAttribute('data-expanded');
    await u.keyboard('{Escape}');
    await waitFor(() => expect(within(pageViewport()).getByRole('button', { name: 'Show all notifications (2)' })).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-em-toasts'));
  });

  it('does not auto-dismiss while the toaster is unreachable (inert page), and resumes after', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const u = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<div data-testid="app"><ToastProvider><ToastModalDemo duration={1000} /></ToastProvider></div>);
    await u.click(screen.getByRole('button', { name: 'Page toast' }));
    await act(async () => { screen.getByTestId('app').setAttribute('inert', ''); });
    act(() => { vi.advanceTimersByTime(10000); });
    expect(pageViewport()).toHaveTextContent('Page toast');
    await act(async () => { screen.getByTestId('app').removeAttribute('inert'); });
    act(() => { vi.advanceTimersByTime(1500); });
    await waitFor(() => expect(pageViewport()).not.toHaveTextContent('Page toast'));
    vi.useRealTimers();
  });
});

describe('ThemeSwitcher (R-2)', () => {
  const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m }; };
  // Ember's registry has two themes (neo, kinetic), so the Theme group renders.
  const themes = THEME_REGISTRY;
  const def = THEME_REGISTRY[0];
  afterEach(() => { document.documentElement.removeAttribute('data-theme'); document.documentElement.removeAttribute('data-mode'); });

  it('reads themes from the registry: the default is the first entry and no theme is hardcoded', () => {
    expect(THEMES).toEqual(THEME_REGISTRY.map((t) => t.id));
    expect(DEFAULT_THEME).toBe(THEMES[0]);
    expect(prepaintScript(themes)).toContain("['kinetic']");
    expect(PREPAINT_SCRIPT).toContain(JSON.stringify(THEMES.slice(1)).replace(/"/g, "'"));
  });

  it('hides the Theme group when only one theme is registered', () => {
    render(<ThemeSwitcher storage={mem()} themes={[def]} />);
    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Color mode' })).toBeInTheDocument();
  });

  it('has two labelled radio groups and starts from storage', () => {
    const s = mem(); s.setItem('jdilig:theme', 'kinetic'); s.setItem('jdilig:mode', 'dark');
    render(<ThemeSwitcher storage={s} themes={themes} />);
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Color mode' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Kinetic' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe('kinetic');
    expect(document.documentElement.dataset.mode).toBe('dark');
  });

  it('ignores an unregistered stored theme', () => {
    const s = mem(); s.setItem('jdilig:theme', 'not-a-theme');
    render(<ThemeSwitcher storage={s} themes={themes} />);
    expect(screen.getByRole('radio', { name: def.label })).toBeChecked();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('works by keyboard, persists, announces, and removes keys for the default theme and Auto', async () => {
    const s = mem(); const onChange = vi.fn(); const u = userEvent.setup();
    render(<ThemeSwitcher storage={s} onChange={onChange} themes={themes} />);
    await u.tab();
    expect(screen.getByRole('radio', { name: def.label })).toHaveFocus();
    await u.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Kinetic' })).toBeChecked();
    expect(s.m.get('jdilig:theme')).toBe('kinetic');
    expect(document.documentElement.dataset.theme).toBe('kinetic');
    expect(screen.getByRole('status')).toHaveTextContent(/^Theme Kinetic, automatic \((dark|light)\) mode$/);
    await u.click(screen.getByRole('radio', { name: 'Light' }));
    expect(s.m.get('jdilig:mode')).toBe('light');
    expect(screen.getByRole('status')).toHaveTextContent('Theme Kinetic, light mode');
    await u.click(screen.getByRole('radio', { name: def.label }));
    await u.click(screen.getByRole('radio', { name: 'Auto' }));
    expect(s.m.has('jdilig:theme')).toBe(false);
    expect(s.m.has('jdilig:mode')).toBe(false);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(document.documentElement.hasAttribute('data-mode')).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith(def.id, 'auto');
  });
});

describe('Switch', () => {
  it('is a native checkbox with role=switch, toggled by Space and by its label', async () => {
    const u = userEvent.setup();
    render(<Switch label="Email me" hint="Daily" />);
    const sw = screen.getByRole('switch', { name: 'Email me' });
    expect(sw).toHaveAttribute('type', 'checkbox');
    expect(sw).not.toBeChecked();
    expect(sw).toHaveAccessibleDescription('Daily');
    sw.focus();
    await u.keyboard(' ');
    expect(sw).toBeChecked();
    await u.click(screen.getByText('Email me'));
    expect(sw).not.toBeChecked();
  });
});
