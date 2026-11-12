import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { Button, Modal, useToast, type ToastInput } from '../src';
import { doc, FOCUS_NOTE } from './doc';
import { AllThemes } from './AllThemes';

function Trigger(t: ToastInput & { auto?: boolean }) {
  const show = useToast();
  const { auto, ...toast } = t;
  useEffect(() => {
    if (auto) show({ ...toast, duration: 600000 });
    // Show once on mount for the static stories.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Button variant="secondary" onClick={() => show(toast)}>Show {toast.tone ?? 'info'} toast</Button>;
}

const meta: Meta<typeof Trigger> = {
  title: 'Components/Toast',
  component: Trigger,
  tags: ['autodocs'],
  args: { title: 'Role saved', message: ' Example Co was added to Applied.' },
  parameters: {
    docs: {
      story: { inline: false, iframeHeight: 220 },
      description: {
        component: doc({
          use: ['Confirm something finished: saved, copied, sent.', 'Report a background error that is also shown where it happened.'],
          avoid: ['It is the only place an error appears. Always show the error next to the field or item too.', 'People must act on it. Use a Modal or inline message.'],
          anatomy: ['Viewport fixed bottom right', 'Polite live region (`role="status"`) for info and success', 'Assertive live region (`role="alert"`) for errors', 'Toast: colored edge, title, message, optional action button (e.g. Undo), dismiss button', 'Below 640px: only the newest toast, plus a "Show all notifications (N)" button whose name stays the same while `aria-expanded` toggles the whole stack', 'Inside an open modal `<dialog>`: the same live regions render in a toast outlet at the bottom of the topmost modal, so toasts stay visible, reachable and announced'],
          variants: '`info`, `success`, `error`. Wrap the app in `<ToastProvider>` and call `useToast()`.',
          states: 'Entering (fades up; none under reduced motion), shown, paused (hover or focus stops the timer), sticky (errors and toasts with an action stay until dismissed), dismissed.',
          keyboard: [['Tab', 'Reaches the dismiss button, and the "Show all notifications (N)" button below 640px'], ['Enter / Space', 'Dismisses the toast']],
          a11y: [
            ['4.1.3 Status Messages', 'Info and success go to `role="status"`; errors go to `role="alert"`. The regions stay mounted so additions are announced.'],
            ['2.2.1 Timing Adjustable', 'Info and success toasts auto-dismiss (5s by default) and pause while hovered or focused. Error toasts and toasts with an action (e.g. Undo) never auto-dismiss.'],
            ['2.4.11 Focus Not Obscured', 'While toasts are open, the page keeps the stack\'s height clear at the bottom (`scroll-padding-bottom` and matching padding, kept in sync by a ResizeObserver), so a focused control scrolls clear of the stack. Below 640px the stack collapses to the newest toast. `npm run test:focus-obscured` tabs through 90 controls behind 3 sticky toasts at 320, 375, 768 and 1440px in every theme and mode, collapsed and expanded, and fails if any is fully hidden.'],
            ['Modals', 'A modal `<dialog>` makes the rest of the page inert, so a page toast would be hidden from screen readers and unreachable by keyboard. While a modal is open, toasts move into a `role="status"`/`role="alert"` outlet inside the topmost modal (nested modals: the last one opened wins) and move back to the page toaster when it closes. Ember Modal has the outlet built in; for any other modal `<dialog>`, the provider adds one. A toast timer pauses while it cannot be reached (page inert or tab hidden) and resumes with the time it had left.'],
            ['3.3.1 Error Identification', 'Toasts are never the only place an error is shown.'],
            FOCUS_NOTE,
          ],
          code: `const toast = useToast();\ntoast({ tone: 'success', title: 'Role saved' });`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof Trigger>;

export const Info: S = { args: { tone: 'info', title: 'Reminder set', message: ' We will remind you on Friday.', auto: true } };
export const Success: S = { args: { tone: 'success', auto: true } };
export const Error: S = { args: { tone: 'error', title: 'Could not save', message: ' Check the form for details.', auto: true } };
export const Interactive: S = { args: { tone: 'success' } };
export const WithAction: S = {
  args: { tone: 'success', title: 'Reminder done', action: { label: 'Undo', onAction: () => {} }, auto: true },
};

/** Each tone in all 6 theme x mode combos (R-2), shown statically (no live region, no timer). */
export const AllThemesStory: S = {
  name: 'All themes',
  render: () => (
    <AllThemes>{() => (
      <div style={{ display: 'grid', gap: 8 }}>
        {(['info', 'success', 'error'] as const).map((t) => (
          <div key={t} className={`em-toast em-toast--${t}`} style={{ pointerEvents: 'auto' }}>
            <span className="em-toast-text"><strong className="em-toast-title">{t === 'error' ? 'Could not save' : t === 'success' ? 'Role saved' : 'Reminder set'}</strong> {t === 'error' ? 'Check the form.' : 'All good.'}</span>
          </div>
        ))}
      </div>
    )}</AllThemes>
  ),
};

function InModalDemo() {
  const show = useToast();
  const [open, setOpen] = useState(false);
  const [nested, setNested] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Button variant="secondary" onClick={() => show({ tone: 'success', title: 'Role saved', message: ' Example Co was added to Applied.' })}>Show page toast</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit role"
        actions={<Button variant="secondary" onClick={() => setOpen(false)}>Done</Button>}>
        <p style={{ marginTop: 0 }}>Toasts fired while this dialog is open show at its bottom edge, where they are announced and reachable.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button variant="secondary" onClick={() => show({ tone: 'success', title: 'Draft saved', message: ' Your changes are kept.' })}>Show toast</Button>
          <Button variant="secondary" onClick={() => show({ tone: 'error', title: 'Could not save', message: ' Check the form for details.' })}>Show error toast</Button>
          <Button variant="secondary" onClick={() => setNested(true)}>Open nested dialog</Button>
        </div>
        <Modal open={nested} onClose={() => setNested(false)} title="Confirm"
          actions={<Button variant="secondary" onClick={() => setNested(false)}>Close nested</Button>}>
          <Button variant="secondary" onClick={() => show({ tone: 'info', title: 'Copied', message: ' The link is on your clipboard.' })}>Show toast from nested</Button>
        </Modal>
      </Modal>
    </>
  );
}

/**
 * FU-EMBER-TOAST-MODAL: while a modal is open the page behind it is inert, so toasts move into the topmost open modal
 * (a `role="status"` / `role="alert"` outlet at its bottom edge) and go back to the page toaster when it closes. A toast
 * doesn't time out while nobody can reach it. Outside modals nothing changes.
 */
export const InAModal: S = {
  name: 'In a modal',
  render: () => <InModalDemo />,
  parameters: { docs: { story: { inline: false, iframeHeight: 520 } } },
};
