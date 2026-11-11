import type { Meta, StoryObj } from '@storybook/react';
import './fixtures/test-fixture.css';
import { Button, Input, THEME_REGISTRY } from '../src';
import { AllThemes } from './AllThemes';

/** Proof that themes are data, not code (R-2). The same Button and Input render in the default
 *  registered theme and in a test-fixture theme defined only by a token file: color, radius, border,
 *  shadow, focus ring and control height all change with zero component changes. */
const meta: Meta = {
  title: 'Tokens/Theme registry',
  parameters: { docs: { description: { component: 'One component, two themes. The second theme is a test fixture (stories only, not shipped) until the next CA-signed theme registers.' } } },
};
export default meta;

const fixture = { id: 'test-fixture', label: 'Test fixture' };

export const SameComponentTwoThemes: StoryObj = {
  name: 'Same component, two themes',
  render: () => (
    <AllThemes themes={[THEME_REGISTRY[0], fixture]}>
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
