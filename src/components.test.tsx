import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Marquee, Parallax, AnimatedIcon, useReducedMotion, MOTION_TOKENS, Switch, Button, Modal, Tabs, ToastProvider, useToast, Input, ThemeSwitcher, THEMES, THEME_REGISTRY, DEFAULT_THEME, PREPAINT_SCRIPT, prepaintScript } from './index';

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

function mockReducedMotion(reduce: boolean) {
  const listeners = new Set<() => void>();
  const mq = { matches: reduce, media: '(prefers-reduced-motion: reduce)', addEventListener: (_: string, f: () => void) => listeners.add(f), removeEventListener: (_: string, f: () => void) => listeners.delete(f) };
  const orig = globalThis.matchMedia;
  globalThis.matchMedia = (() => mq) as unknown as typeof matchMedia;
  return { set(v: boolean) { mq.matches = v; listeners.forEach((f) => f()); }, restore() { globalThis.matchMedia = orig; } };
}

describe('Motion primitives (R-3)', () => {
  it('Marquee: a labelled region with the Pause button before the content and the loop copy hidden', async () => {
    const m = mockReducedMotion(false);
    render(<Marquee label="Release notes"><span>v0.3.1 ships Switch</span></Marquee>);
    const region = screen.getByRole('region', { name: 'Release notes' });
    const btn = screen.getByRole('button', { name: 'Pause Release notes' });
    expect(region.firstElementChild).toBe(btn);
    expect(screen.getAllByText('v0.3.1 ships Switch')).toHaveLength(2);
    const groups = region.querySelectorAll('.em-marquee-group');
    expect(groups[0]).not.toHaveAttribute('aria-hidden');
    expect(groups[1]).toHaveAttribute('aria-hidden', 'true');
    expect(groups[1]).toHaveAttribute('inert');
    await userEvent.click(btn);
    expect(screen.getByRole('button', { name: 'Play Release notes' })).toHaveTextContent('Play');
    expect(region).toHaveClass('em-marquee--paused');
    m.restore();
  });

  it('Marquee: starts paused under reduced motion and plays only when asked', async () => {
    const m = mockReducedMotion(true);
    render(<Marquee label="Ticker"><span>item</span></Marquee>);
    const region = screen.getByRole('region', { name: 'Ticker' });
    expect(region).toHaveClass('em-marquee--paused');
    await userEvent.click(screen.getByRole('button', { name: 'Play Ticker' }));
    expect(region).toHaveClass('em-marquee--playing');
    expect(region).not.toHaveClass('em-marquee--paused');
    m.restore();
  });

  it('useReducedMotion follows the media query live', () => {
    const m = mockReducedMotion(false);
    function Probe() { return <p>{useReducedMotion() ? 'reduce' : 'full'}</p>; }
    render(<Probe />);
    expect(screen.getByText('full')).toBeInTheDocument();
    act(() => m.set(true));
    expect(screen.getByText('reduce')).toBeInTheDocument();
    m.restore();
    expect(MOTION_TOKENS).toContain('--duration-ticker');
  });

  it('Parallax is decorative: aria-hidden and inert', () => {
    const { container } = render(<Parallax><svg /></Parallax>);
    const el = container.querySelector('.em-parallax')!;
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).toHaveAttribute('inert');
  });

  it('AnimatedIcon is hidden when decorative and an image when labelled', () => {
    const { container } = render(<><AnimatedIcon motion="spin"><svg /></AnimatedIcon><AnimatedIcon label="Synced"><svg /></AnimatedIcon><AnimatedIcon active={false}><svg /></AnimatedIcon></>);
    const icons = container.querySelectorAll('.em-icon');
    expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
    expect(icons[0]).toHaveClass('em-icon--spin');
    expect(screen.getByRole('img', { name: 'Synced' })).toHaveClass('em-icon--pulse');
    expect(icons[2].className).toBe('em-icon');
  });
});
