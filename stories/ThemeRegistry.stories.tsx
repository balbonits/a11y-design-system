import type { Meta, StoryObj } from '@storybook/react';
import { Button, Input, THEME_REGISTRY } from '../src';
import { AllThemes } from './AllThemes';

/** Proof that themes are data, not code (R-2). The same Button and Input render in the default
 *  registered themes, each defined only by a token file and a registry entry: color, radius, border,
 *  shadow, focus ring and control height all change with zero component changes. */
const meta: Meta = {
  title: 'Tokens/Theme registry',
  parameters: { docs: { description: { component: 'One component, three registered themes (neo, kinetic and dusk). Each theme is one token file plus one registry entry, with zero component changes.' } } },
};
export default meta;

export const SameComponentTwoThemes: StoryObj = {
  name: 'Same component, two themes',
  render: () => (
    <AllThemes themes={THEME_REGISTRY}>
      {(label) => (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button>Save</Button>
            <Button variant="secondary">Cancel</Button>
          </div>
          <Input label={`Email (${label})`} hint="Shape and color both come from the theme." />
        </div>
      )}
    </AllThemes>
  ),
};
