/** Builds a component docs page in the fixed Ember UI order:
 * Usage, Anatomy, Variants, States, Keyboard, Accessibility notes, Code example. */
export function doc(d: {
  use: string[];
  avoid: string[];
  anatomy: string[];
  variants: string;
  states: string;
  keyboard: Array<[string, string]>;
  a11y: Array<[string, string]>;
  code: string;
}): string {
  return [
    '## Usage',
    '**Use it when**',
    ...d.use.map((x) => `- ${x}`),
    '',
    '**Don’t use it when**',
    ...d.avoid.map((x) => `- ${x}`),
    '',
    '## Anatomy',
    ...d.anatomy.map((x, i) => `${i + 1}. ${x}`),
    '',
    '## Variants',
    d.variants,
    '',
    '## States',
    d.states,
    '',
    '## Keyboard',
    '| Key | Action |',
    '| --- | --- |',
    ...d.keyboard.map(([k, a]) => `| ${k} | ${a} |`),
    '',
    '## Accessibility notes',
    '| WCAG 2.2 criterion | How this component meets it |',
    '| --- | --- |',
    ...d.a11y.map(([c, h]) => `| ${c} | ${h} |`),
    '',
    '## Code example',
    '```tsx',
    d.code,
    '```',
    '',
    'The stories below show each variant and state. Use the Theme toolbar button to switch light and dark.',
  ].join('\n');
}

export const FOCUS_NOTE: [string, string] = ['2.4.7 Focus Visible / 2.4.13 Focus Appearance', 'An outline built from `--focus-ring-width` (at least 2px), `--focus-ring-style` and `--focus-ring-color`, offset by `--focus-ring-offset`, at least 3:1 against the background and the border in every theme and mode.'];
