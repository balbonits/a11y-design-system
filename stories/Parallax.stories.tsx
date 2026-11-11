import type { Meta, StoryObj } from '@storybook/react';
import { Parallax } from '../src';
import { doc } from './doc';
import { AllThemes } from './AllThemes';

const Shapes = () => (
  <svg width="100%" height="120" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice">
    <circle cx="60" cy="60" r="36" fill="none" stroke="currentColor" strokeWidth="3" />
    <rect x="140" y="30" width="60" height="60" rx="12" fill="none" stroke="currentColor" strokeWidth="3" transform="rotate(8 170 60)" />
    <path d="M230 90 L262 30 L290 90 Z" fill="none" stroke="currentColor" strokeWidth="3" />
  </svg>
);

const meta: Meta<typeof Parallax> = {
  title: 'Motion/Parallax',
  component: Parallax,
  tags: ['autodocs'],
  args: { children: <Shapes /> },
  parameters: {
    docs: {
      description: {
        component: doc({
          use: ['A decorative layer (shapes, texture, an image with empty alt) that should feel like depth while the page scrolls.'],
          avoid: ['The layer holds text, data or anything a user needs. Put it in the page instead.', 'The theme sets `--parallax-scale: 0` and you want movement anyway. The theme decides.'],
          anatomy: ['Wrapper: `aria-hidden`, `inert`, no pointer events', 'Layer: moves with `transform` only, by its distance from the viewport center times `--parallax-scale`'],
          variants: 'One variant. neo drifts at 0.08; kinetic is 0, so it stays still.',
          states: 'Drifting while scrolling, and still under reduced motion (the scale is 0 and no scroll listener is added).',
          keyboard: [['None', 'It is decorative and never takes focus']],
          a11y: [
            ['1.1.1 Non-text Content', 'Decorative only, so it is hidden from assistive tech. Nothing exists only in the moving layer.'],
            ['2.3.3 Animation from Interactions', 'Scroll-linked motion stops under `prefers-reduced-motion: reduce`.'],
          ],
          code: `<Parallax><svg>...</svg></Parallax>`,
        }),
      },
    },
  },
};
export default meta;
type S = StoryObj<typeof Parallax>;

export const Default: S = { render: (a) => <div><p>Scroll the page to see the shapes drift. They are decorative.</p><Parallax {...a} /></div> };

/** The layer in every registered theme, light and dark. */
export const AllThemesStory: S = { name: 'All themes', render: () => <AllThemes>{() => <Parallax><Shapes /></Parallax>}</AllThemes> };
