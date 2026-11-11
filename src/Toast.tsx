import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const show = useCallback((t: ToastInput) => {
    setItems((all) => [...all, { tone: 'info', duration: 5000, ...t, id: next.current++ }]);
  }, []);
  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);
  const polite = items.filter((t) => t.tone !== 'error');
  const urgent = items.filter((t) => t.tone === 'error');
  const newest = items.length ? items[items.length - 1].id : 0;
  const [expandedState, setExpanded] = useState(false);
  const expanded = expandedState && items.length > 1;
  const viewport = useRef<HTMLDivElement>(null);
  // WCAG 2.4.11 safety net: while any toast is open, the page reserves the stack's height at the bottom
  // (scroll-padding plus matching padding), so the browser scrolls a focused control clear of the stack.
  useLayoutEffect(() => {
    const el = viewport.current;
    const root = typeof document !== 'undefined' ? document.documentElement : null;
    if (!el || !root) return;
    const sync = () => {
      const h = items.length ? Math.ceil(window.innerHeight - el.getBoundingClientRect().top) : 0;
      if (h > 0) { root.style.setProperty('--em-toast-safe', `${h}px`); root.setAttribute('data-em-toasts', ''); }
      else { root.style.removeProperty('--em-toast-safe'); root.removeAttribute('data-em-toasts'); }
    };
    sync();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener('resize', sync);
    return () => { ro.disconnect(); window.removeEventListener('resize', sync); root.style.removeProperty('--em-toast-safe'); root.removeAttribute('data-em-toasts'); };
  }, [items.length]);
  const toast = (t: ToastItem) => <Toast key={t.id} item={t} newest={t.id === newest} onDismiss={dismiss} />;
  return (
    <Ctx.Provider value={show}>
      {children}
      {/* At narrow widths (CSS, below 640px, per Chief Architect) only the newest toast shows, with a "+N more" control, so the stack can't cover the page. */}
      <div ref={viewport} className="em-toast-viewport" data-expanded={expanded || undefined} data-count={items.length}>
        {items.length > 1 && (
          <Button variant="secondary" size="sm" className="em-toast-more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show newest only' : `+${items.length - 1} more`}
          </Button>
        )}
        {/* Live regions stay mounted so screen readers announce what is added to them. */}
        <div role="status" aria-live="polite" className="em-toast-region">
          {polite.map(toast)}
        </div>
        <div role="alert" aria-live="assertive" className="em-toast-region">
          {urgent.map(toast)}
        </div>
      </div>
    </Ctx.Provider>
  );
}

function Toast({ item, newest, onDismiss }: { item: ToastItem; newest: boolean; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(item.duration ?? 5000);
  // WCAG 2.2.1: a toast the user may need to act on (an action such as Undo, or an error) stays until dismissed.
  const sticky = Boolean(item.action) || item.tone === 'error';
  useEffect(() => {
    if (sticky || paused || left.current <= 0) return;
    const start = Date.now();
    const timer = window.setTimeout(() => onDismiss(item.id), left.current);
    return () => {
      window.clearTimeout(timer);
      left.current -= Date.now() - start;
    };
  }, [sticky, paused, item.id, onDismiss]);
  return (
    <div
      className={cx('em-toast', `em-toast--${item.tone}`)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      data-paused={paused || undefined}
      data-newest={newest || undefined}
    >
      <p className="em-toast-text" style={{ margin: 0 }}>
        <span className="em-toast-title">{item.title}</span>
        {item.message}
      </p>
      {item.action && (
        <Button variant="secondary" size="sm" onClick={() => { item.action!.onAction(); onDismiss(item.id); }}>
          {item.action.label}
        </Button>
      )}
      <Button variant="ghost" size="sm" iconOnly aria-label={`Dismiss: ${item.title}`} onClick={() => onDismiss(item.id)}>
        <span aria-hidden="true">✕</span>
      </Button>
    </div>
  );
}
