import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { TOAST_OUTLET_CLASS } from './Toast';
import { tabbable } from './tabbable';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Buttons for the footer, e.g. Cancel and Save. */
  actions?: ReactNode;
};

/**
 * Native <dialog> opened with showModal(): the page behind is inert, Esc closes,
 * Tab is kept inside, and focus goes back to whatever opened it, also when the modal unmounts while open.
 */
export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
      tabbable(d)[0]?.focus();
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
      returnTo.current?.focus();
    }
  }, [open]);

  // Apps often unmount an open modal instead of setting open={false}; focus still goes back to the opener.
  useEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) returnTo.current?.focus();
    };
  }, []);

  // A native listener, not React's onKeyDown: toasts are portaled into this dialog from <ToastProvider>, and React
  // events bubble through the React tree, so Tab on a toast button would skip the wrap. DOM events still bubble here.
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      // A nested modal handles its own keys; they still bubble through this dialog in the DOM.
      if ((e.target as Element | null)?.closest?.('dialog') !== d) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== 'Tab') return;
      // Only controls Tab can reach (not hidden inputs, inactive tabs or hidden panels), or the wrap never triggers.
      const items = tabbable(d).filter((el) => el.closest('dialog') === d);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    d.addEventListener('keydown', onKeyDown);
    return () => d.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <dialog
      ref={ref}
      className="em-modal"
      aria-labelledby={titleId}
      data-em-modal=""
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="em-modal-head">
        <h2 className="em-modal-title" id={titleId}>{title}</h2>
        <Button variant="ghost" iconOnly aria-label="Close dialog" onClick={onClose}>
          <span aria-hidden="true">✕</span>
        </Button>
      </div>
      <div className="em-modal-body">{children}</div>
      {actions && <div className="em-modal-foot">{actions}</div>}
      {/* Toasts fired while this is the topmost modal render here (FU-EMBER-TOAST-MODAL). */}
      <div className={TOAST_OUTLET_CLASS} />
    </dialog>
  );
}
