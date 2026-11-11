import type { Meta, StoryObj } from '@storybook/react';
import { Marquee } from '../src';
import { doc, FOCUS_NOTE } from './doc';
import { AllThemes } from './AllThemes';

const items = ['v0.3.1 adds the Switch', 'Kinetic joins the theme registry', 'Every hit area reads --target-min', 'Motion now lives in Ember only'];
const Items = () => <>{items.map((t) => <span key={t}>{t}</span>)}</>;

const meta: Meta<typeof Marquee> = {
  title: 'Motion/Marquee',
  component: Marquee,
  tags: ['autodocs'],
  args: { label: 'Release notes', children: <Items /> },
  parameters: {
    docs: {
      description: {
        component: doc({
          use: ['A short, non-essential stream such as release notes or a highlights ticker.'],
          avoid: ['The content matters for a task. Show it as a list instead.', 'There is more than one moving thing on the screen.'],
          anatomy: ['Region named by `label`', 'Pause/Play button, placed before the content (at least `--target-min`)', 'Viewport that clips the track', 'Track: the items, then an `aria-hidden`, `inert` copy for the seamless loop'],
          variants: 'One variant. The loop length is `--duration-ticker` (neo 28s, kinetic 36s), linear.',
          states: 'Playing, paused by the button, paused while hovered or while anything inside has focus, and paused at the start under reduced motion until the user presses Play.',
          keyboard: [['Tab', 'Moves to the Pause/Play button'], ['Enter or Space', 'Pauses or plays the ticker']],
          a11y: [
            ['2.2.2 Pause, Stop, Hide', 'It runs longer than 5 seconds, so a visible Pause/Play button comes first, and hover or focus also pauses it.'],
            ['2.3.3 Animation from Interactions', 'Under `prefers-reduced-motion: reduce` it starts paused and moves only after the user presses Play.'],
            ['1.3.2 Meaningful Sequence', 'Screen readers read the items once. The looped copy is `aria-hidden` and `inert`, so it is not read or focusable.'],
            ['2.5.3 Label in Name', 'The button reads "Pause Release notes" or "Play Release notes", which contains its visible text.'],
            FOCUS_NOTE,
          ],
          code: `<Marquee label="Release notes"><span>v0.3.1 adds the Switch</span><span>Kinetic joins the registry</span></Marquee>`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof Marquee>;

export const Default: S = {};
export const FocusVisible: S = { parameters: { pseudo: { focusVisible: true } } };

/** The ticker in every registered theme, light and dark. */
export const AllThemesStory: S = {
  name: 'All themes',
  render: () => <AllThemes>{(t) => <Marquee label={`Release notes, ${t}`}><Items /></Marquee>}</AllThemes>,
};
