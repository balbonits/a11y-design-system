import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { Button, useToast, type ToastInput } from '../src';
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
          anatomy: ['Viewport fixed bottom right', 'Polite live region (`role="status"`) for info and success', 'Assertive live region (`role="alert"`) for errors', 'Toast: colored edge, title, message, optional action button (e.g. Undo), dismiss button', 'At 480px and below: only the newest toast, plus a "+N more" button (`aria-expanded`) that shows the whole stack'],
          variants: '`info`, `success`, `error`. Wrap the app in `<ToastProvider>` and call `useToast()`.',
          states: 'Entering (fades up; none under reduced motion), shown, paused (hover or focus stops the timer), sticky (errors and toasts with an action stay until dismissed), dismissed.',
          keyboard: [['Tab', 'Reaches the dismiss button, and the "+N more" button at 480px and below'], ['Enter / Space', 'Dismisses the toast']],
          a11y: [
            ['4.1.3 Status Messages', 'Info and success go to `role="status"`; errors go to `role="alert"`. The regions stay mounted so additions are announced.'],
            ['2.2.1 Timing Adjustable', 'Info and success toasts auto-dismiss (5s by default) and pause while hovered or focused. Error toasts and toasts with an action (e.g. Undo) never auto-dismiss.'],
            ['2.4.11 Focus Not Obscured', 'While toasts are open, the page keeps the stack\'s height clear at the bottom (`scroll-padding-bottom` and matching padding, kept in sync by a ResizeObserver), so a focused control scrolls clear of the stack. At 480px and below the stack collapses to the newest toast. `npm run test:focus-obscured` tabs through 60 controls behind 3 sticky toasts at 320, 375, 768 and 1440px in every theme and mode, collapsed and expanded, and fails if any is fully hidden.'],
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
