import { useEffect, useId, useRef, type ReactNode, type KeyboardEvent } from 'react';
import { Button } from './Button';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Buttons for the footer, e.g. Cancel and Save. */
  actions?: ReactNode;
};

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

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
      const first = d.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
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

  function onKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
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
  }

  return (
    <dialog
      ref={ref}
      className="em-modal"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
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
    </dialog>
  );
}
