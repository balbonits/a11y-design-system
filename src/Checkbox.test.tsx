import { render, screen } from '@testing-library/react';
import { Checkbox } from './index';

// ARIA in HTML: authors must not set aria-checked on <input type="checkbox">; the mixed state comes from the native
// indeterminate property, which browsers expose as aria-checked="mixed". A hard-coded attribute goes stale once the user
// clicks (the browser clears indeterminate, the attribute stays).
describe('Checkbox mixed state', () => {
  it('uses the native indeterminate property and no aria-checked attribute', () => {
    render(<Checkbox label="Select all" indeterminate />);
    const box = screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
    expect(box).not.toHaveAttribute('aria-checked');
    expect(box).toBePartiallyChecked();
  });

  it('clears the mixed state when indeterminate turns off', () => {
    const { rerender } = render(<Checkbox label="Select all" indeterminate />);
    rerender(<Checkbox label="Select all" indeterminate={false} />);
    const box = screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement;
    expect(box.indeterminate).toBe(false);
    expect(box).not.toBePartiallyChecked();
  });
});
