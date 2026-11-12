import { render, screen } from '@testing-library/react';
import { Checkbox, Input, Select, Switch } from './index';

// WCAG 1.3.1 / 3.3.1: an app that adds its own aria-describedby (e.g. password rules elsewhere on the page) must not
// unlink the component's hint and error. The app's ids are kept and the component's are added.
describe('aria-describedby from the app is merged, not replaced', () => {
  const extra = <p id="extra">Shown elsewhere.</p>;
  it.each([
    ['Input', () => <Input label="Field" hint="The hint." error="The error." aria-describedby="extra" />, 'textbox'],
    ['Select', () => <Select label="Field" hint="The hint." error="The error." aria-describedby="extra"><option>A</option></Select>, 'combobox'],
    ['Checkbox', () => <Checkbox label="Field" hint="The hint." error="The error." aria-describedby="extra" />, 'checkbox'],
  ] as const)('%s keeps hint, error and the app description', (_, make, role) => {
    render(<>{extra}{make()}</>);
    expect(screen.getByRole(role, { name: 'Field' })).toHaveAccessibleDescription('Shown elsewhere. The hint. Error: The error.');
  });

  it('Switch keeps its hint and the app description', () => {
    render(<>{extra}<Switch label="Field" hint="The hint." aria-describedby="extra" /></>);
    expect(screen.getByRole('switch', { name: 'Field' })).toHaveAccessibleDescription('Shown elsewhere. The hint.');
  });
});
