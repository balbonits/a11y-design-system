import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AnimatedIcon, Button } from '../src';
import { doc } from './doc';
import { AllThemes } from './AllThemes';

const Check = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
);
const Sync = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3" /><path d="M18 3v4h-4M6 21v-4h4" /></svg>
);

const meta: Meta<typeof AnimatedIcon> = {
  title: 'Motion/AnimatedIcon',
  component: AnimatedIcon,
  tags: ['autodocs'],
  args: { motion: 'pulse', children: <Check /> },
  argTypes: { motion: { control: 'inline-radio', options: ['spin', 'pulse', 'nudge'] } },
  parameters: {
    docs: {
      description: {
        component: doc({
          use: ['A small icon that draws the eye once, such as a check after saving or a sync glyph after a refresh.'],
          avoid: ['Showing that something is loading. Use the Button `loading` spinner, which runs while the work runs.', 'The motion carries meaning on its own. Pair it with text.'],
          anatomy: ['Wrapper span: `aria-hidden` when decorative, or `role="img"` with `label` when it means something', 'Your SVG or glyph'],
          variants: 'spin (a full turn), pulse (a soft opacity and scale beat) and nudge (a small sideways shift).',
          states: 'Playing (3 cycles, then still), still (`active={false}`), and still under reduced motion. Change its `key` to play it again.',
          keyboard: [['None', 'It is not interactive']],
          a11y: [
            ['2.2.2 Pause, Stop, Hide', 'Each cycle is 1 to 1.6s and it plays 3 cycles, so it always stops by 4.8s.'],
            ['2.3.1 Three Flashes', 'At most one cycle per second, and pulse only dims to 60% opacity, so it never flashes.'],
            ['2.3.3 Animation from Interactions', 'No animation under `prefers-reduced-motion: reduce`; the icon shows in its final state.'],
            ['1.1.1 Non-text Content', 'Hidden when decorative; named with `label` when it carries meaning.'],
          ],
          code: `<AnimatedIcon motion="pulse" label="Saved"><CheckIcon /></AnimatedIcon>`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof AnimatedIcon>;

export const Pulse: S = {};
export const Spin: S = { args: { motion: 'spin', children: <Sync /> } };
export const Nudge: S = { args: { motion: 'nudge' } };
export const Labelled: S = { args: { label: 'Saved' } };
export const Still: S = { args: { active: false } };

function Replay() {
  const [n, setN] = useState(0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <AnimatedIcon key={n} motion="spin" label="Synced"><Sync /></AnimatedIcon>
      <Button variant="secondary" onClick={() => setN(n + 1)}>Sync again</Button>
    </div>
  );
}
export const ReplayStory: S = { name: 'Play again', render: () => <Replay /> };

/** Every motion in every registered theme, light and dark. */
export const AllThemesStory: S = {
  name: 'All themes',
  render: () => <AllThemes>{() => <div style={{ display: 'flex', gap: 16 }}><AnimatedIcon motion="pulse"><Check /></AnimatedIcon><AnimatedIcon motion="spin"><Sync /></AnimatedIcon><AnimatedIcon motion="nudge"><Check /></AnimatedIcon></div>}</AllThemes>,
};
