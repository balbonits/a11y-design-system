import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { cx } from './cx';

export type ToastTone = 'info' | 'success' | 'error';
export type ToastAction = { label: string; onAction: () => void };
export type ToastInput = { tone?: ToastTone; title: string; message?: string; duration?: number; action?: ToastAction };
type ToastItem = Required<Pick<ToastInput, 'tone' | 'title'>> & ToastInput & { id: number };

const Ctx = createContext<((t: ToastInput) => void) | null>(null);

/** Call useToast()(...) to show a toast. Errors use role=alert; info and success use role=status. */
export function useToast() {
  const show = useContext(Ctx);
  if (!show) throw new Error('useToast must be used inside <ToastProvider>');
  return show;
}

/** Class of the toast outlet that <Modal> renders as its last child. Other modal dialogs get one added while topmost. */
export const TOAST_OUTLET_CLASS = 'em-toast-outlet';

function isModalDialog(d: Element): boolean {
  if (!(d instanceof HTMLElement) || !d.hasAttribute('open') || !d.isConnected) return false;
  if (d.hasAttribute('data-em-modal')) return true;
  try { return d.matches(':modal'); } catch { return false; }
}

type Top = { dialog: HTMLElement; outlet: HTMLElement };

/**
 * FU-EMBER-TOAST-MODAL (WCAG 4.1.3, CA ruling): while a modal <dialog> is open, everything outside it is inert, so a toast
 * in the page toaster is neither announced nor reachable (popover or the top layer doesn't change that). This tracks
 * open modal dialogs in the order they opened; the last one is the topmost, and toasts render into its outlet:
 * <Modal>'s own, or one added for another modal <dialog> and removed when it's no longer topmost.
 */
function useTopmostOutlet(): Top | null {
  const [top, setTop] = useState<Top | null>(null);
  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
    let order: HTMLElement[] = [];
    let current: Top | null = null;
    let added: HTMLElement | null = null;
    const sync = () => {
      const open = [...document.querySelectorAll('dialog')].filter(isModalDialog) as HTMLElement[];
      order = [...order.filter((d) => open.includes(d)), ...open.filter((d) => !order.includes(d))];
      const dialog = order.length ? order[order.length - 1] : null;
      if (dialog === (current?.dialog ?? null)) return;
      added?.remove();
      added = null;
      if (!dialog) { current = null; setTop(null); return; }
      let outlet = dialog.querySelector<HTMLElement>(`:scope > .${TOAST_OUTLET_CLASS}`);
      if (!outlet) {
        added = outlet = document.createElement('div');
        outlet.className = TOAST_OUTLET_CLASS;
        dialog.append(outlet);
      }
      current = { dialog, outlet };
      setTop(current);
    };
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
    queueMicrotask(sync);
    return () => { mo.disconnect(); added?.remove(); };
  }, []);
  return top;
}

/** True when the page toaster can't be reached: it sits inside [inert] (e.g. an app's own modal), or the tab is hidden. */
function usePageBlocked(viewport: RefObject<HTMLElement | null>): boolean {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
    const sync = () => setBlocked(Boolean(viewport.current?.closest('[inert]')) || document.visibilityState === 'hidden');
    queueMicrotask(sync);
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['inert'] });
    document.addEventListener('visibilitychange', sync);
    return () => { mo.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [viewport]);
  return blocked;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  // Time left per toast, kept here so a toast's timer survives the move between the page and a modal.
  const [left] = useState(() => new Map<number, number>());
  const show = useCallback((t: ToastInput) => {
    setItems((all) => [...all, { tone: 'info', duration: 5000, ...t, id: next.current++ }]);
  }, []);
  const dismiss = useCallback((id: number) => {
    left.delete(id);
    setItems((all) => all.filter((t) => t.id !== id));
  }, [left]);
  const viewport = useRef<HTMLDivElement>(null);
  const blocked = usePageBlocked(viewport);
  const top = useTopmostOutlet();
  const modal = top?.dialog ?? null;
  const outlet = top?.outlet ?? null;
  const inModal = Boolean(outlet);
  // Live regions announce what is added to them, not what they mount with. The modal outlet's regions mount
  // empty first and the toasts go in a moment later (100ms; a single frame is too soon for some screen readers).
  // Keyed on this opening (a new object each time a dialog becomes topmost), so reopening the same modal waits again.
  const [readyFor, setReadyFor] = useState<Top | null>(null);
  const ready = top && readyFor === top ? outlet : null;
  useEffect(() => {
    if (!top) return;
    const t = window.setTimeout(() => setReadyFor(top), 100);
    return () => window.clearTimeout(t);
  }, [top]);
  // WCAG 2.4.11 inside the dialog: the dialog reserves the stack's height as scroll-padding, so a focused control
  // scrolls clear of the sticky stack.
  const modalViewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = modalViewport.current;
    if (!modal || !el || typeof ResizeObserver === 'undefined') return;
    const sync = () => modal.style.setProperty('--em-modal-toast-safe', `${Math.ceil(el.getBoundingClientRect().height)}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { ro.disconnect(); modal.style.removeProperty('--em-modal-toast-safe'); };
  }, [modal, ready]);
  // A toast's timer only runs while someone can reach it (WCAG 2.2.1).
  const reachable = inModal ? ready === outlet : !blocked;
  const polite = items.filter((t) => t.tone !== 'error');
  const urgent = items.filter((t) => t.tone === 'error');
  const regions = (filled: boolean) => (
    <>
      {/* Live regions stay mounted so screen readers announce what is added to them. */}
      <div role="status" aria-live="polite" className="em-toast-region">
        {filled && polite.map((t) => <Toast key={t.id} item={t} left={left} reachable={reachable} onDismiss={dismiss} />)}
      </div>
      <div role="alert" aria-live="assertive" className="em-toast-region">
        {filled && urgent.map((t) => <Toast key={t.id} item={t} left={left} reachable={reachable} onDismiss={dismiss} />)}
      </div>
    </>
  );
  return (
    <Ctx.Provider value={show}>
      {children}
      <div ref={viewport} className="em-toast-viewport" data-count={inModal ? 0 : items.length}>
        {regions(!inModal)}
      </div>
      {outlet && createPortal(
        <div ref={modalViewport} className="em-toast-viewport em-toast-viewport--modal" data-count={ready === outlet ? items.length : 0}>
          {regions(ready === outlet)}
        </div>,
        outlet,
      )}
    </Ctx.Provider>
  );
}

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function Toast({ item, left, reachable, onDismiss }: {
  item: ToastItem;
  left: Map<number, number>;
  reachable: boolean;
  onDismiss: (id: number) => void;
}) {
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cameFrom = useRef<HTMLElement | null>(null);
  // WCAG 2.2.1: a toast the user may need to act on (an action such as Undo, or an error) stays until dismissed.
  const sticky = Boolean(item.action) || item.tone === 'error';
  useEffect(() => {
    if (sticky || paused || !reachable) return;
    const ms = left.get(item.id) ?? item.duration ?? 5000;
    if (ms <= 0) return;
    const start = Date.now();
    const timer = window.setTimeout(() => onDismiss(item.id), ms);
    left.set(item.id, ms);
    return () => {
      window.clearTimeout(timer);
      if (left.has(item.id)) left.set(item.id, ms - (Date.now() - start));
    };
  }, [sticky, paused, reachable, item.id, item.duration, left, onDismiss]);
  // Dismissing removes the focused button; send focus back where it came from (inside the modal, when one is open)
  // instead of letting it drop to <body>.
  const close = (after?: () => void) => {
    const focused = ref.current?.contains(document.activeElement);
    const back = cameFrom.current;
    const dialog = ref.current?.closest('dialog');
    after?.();
    onDismiss(item.id);
    if (!focused) return;
    if (back?.isConnected && !back.closest('[inert]') && (!dialog || dialog.contains(back))) back.focus();
    else dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  };
  return (
    <div
      ref={ref}
      className={cx('em-toast', `em-toast--${item.tone}`)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={(e) => {
        setPaused(true);
        const from = e.relatedTarget as HTMLElement | null;
        if (from && !ref.current?.contains(from)) cameFrom.current = from;
      }}
      onBlur={() => setPaused(false)}
      data-paused={paused || undefined}
    >
      <p className="em-toast-text" style={{ margin: 0 }}>
        <span className="em-toast-title">{item.title}</span>
        {item.message}
      </p>
      {item.action && (
        <Button variant="secondary" size="sm" onClick={() => close(item.action!.onAction)}>
          {item.action.label}
        </Button>
      )}
      <Button variant="ghost" size="sm" iconOnly aria-label={`Dismiss: ${item.title}`} onClick={() => close()}>
        <span aria-hidden="true">✕</span>
      </Button>
    </div>
  );
}
