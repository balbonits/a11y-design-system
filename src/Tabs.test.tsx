import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './index';

// WCAG 2.1.1: the tab list must always have exactly one tab in the Tab order, and it must be an enabled tab
// (APG Tabs pattern: focus enters the list on the active tab).
const tabs = [
  { id: 'a', label: 'One', content: 'Panel one' },
  { id: 'b', label: 'Two', content: 'Panel two', disabled: true },
  { id: 'c', label: 'Three', content: 'Panel three' },
];

describe('Tabs: the tab list is always reachable by keyboard', () => {
  it.each([
    ['a disabled tab', 'b'],
    ['an id that is not in the list', 'missing'],
  ])('falls back to the first enabled tab when defaultTab names %s', async (_, defaultTab) => {
    const u = userEvent.setup();
    render(<Tabs label="Test tabs" tabs={tabs} defaultTab={defaultTab} />);
    const inOrder = screen.getAllByRole('tab').filter((t) => t.getAttribute('tabindex') === '0');
    expect(inOrder).toHaveLength(1);
    expect(inOrder[0]).toHaveAccessibleName('One');
    expect(inOrder[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel one');
    await u.tab();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();
  });

  it('moves the selection off a tab that becomes disabled', () => {
    const { rerender } = render(<Tabs label="Test tabs" tabs={tabs} defaultTab="c" />);
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('tabindex', '0');
    rerender(<Tabs label="Test tabs" tabs={tabs.map((t) => (t.id === 'c' ? { ...t, disabled: true } : t))} defaultTab="c" />);
    const inOrder = screen.getAllByRole('tab', { hidden: true }).filter((t) => t.getAttribute('tabindex') === '0');
    expect(inOrder).toHaveLength(1);
    expect(inOrder[0]).toHaveAccessibleName('One');
  });
});
