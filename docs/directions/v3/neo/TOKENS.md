# F "neo": Neo-Brutal Playful, token sheet

Flat cream paper with hard ink outlines, offset solid shadows, sticker shapes that tilt on hover, and acid lime with electric blue. In dark mode the outlines turn cream and lime becomes the accent.

Fonts: Archivo Black (display), Archivo (body), JetBrains Mono (data and labels). References: Gumroad, Figma Config, Poolsuite.

Swatches are in the live prototype's Tokens section. Contrast results are in [CONTRAST.md](CONTRAST.md) (0 fails, light and dark).

## Semantic colors (R-2 names)
| Token | Light primitive | Light | Dark primitive | Dark |
|---|---|---|---|---|
| `--color-bg` | `cream` | `#fdf8e9` | `ink` | `#111111` |
| `--surface` | `paper` | `#ffffff` | `ink-2` | `#1c1c1c` |
| `--surface-muted` | `cream-2` | `#f3ecd2` | `ink-3` | `#272727` |
| `--text` | `ink` | `#111111` | `cream` | `#fdf8e9` |
| `--text-muted` | `ink-soft` | `#3d3d3d` | `sand` | `#cfc8b0` |
| `--border` | `ink` | `#111111` | `cream` | `#fdf8e9` |
| `--border-subtle` | `gray` | `#6b6b6b` | `gray-2` | `#8c8c8c` |
| `--accent` | `blue-600` | `#1f3dff` | `lime-400` | `#c6f432` |
| `--accent-hover` | `blue-700` | `#1530d0` | `lime-300` | `#d7ff5a` |
| `--accent-soft` | `blue-100` | `#e3e8ff` | `lime-900` | `#2c3310` |
| `--accent-contrast` | `paper` | `#ffffff` | `ink` | `#111111` |
| `--focus-ring-color` | `pink-600` | `#e0217a` | `pink-600` | `#e0217a` |
| `--success` | `green-700` | `#17702a` | `green-300` | `#5ed27a` |
| `--warning` | `amber-800` | `#855400` | `amber-300` | `#ffc24a` |
| `--danger` | `red-700` | `#c4122f` | `red-300` | `#ff7a8c` |
| `--danger-hover` | `red-800` | `#a00e26` | `red-200` | `#ff9aa8` |
| `--danger-contrast` | `paper` | `#ffffff` | `ink` | `#111111` |
| `--info` | `sky-700` | `#0b5cad` | `sky-300` | `#7fb6ff` |
| `--highlight` | `lime-400` | `#c6f432` | `blue-600` | `#1f3dff` |
| `--highlight-contrast` | `ink` | `#111111` | `paper` | `#ffffff` |
| `--scrim` | `scrim` | `#11111173` | `scrim-dark` | `#1111118c` |

New semantic tokens for the additive minor release after v0.3.0 (every theme must define them, `0` or `none` when unused): `--highlight` and `--highlight-contrast` (a sticker or chip fill and its text); the shape set `--radius-sm`, `--radius-md`, `--radius-lg`, `--border-width-strong`, `--shadow-raised`, `--shadow-press` and `--divider-shape`, named per Chief Architect; and `--focus-ring-width`, `--focus-ring-offset`, `--tilt` and `--lift`. The set follows ARCH-REVIEW Addendum 5 (locked 5:20 PM PT): `--focus-ring-color/width/offset/style`, `--control-height/padding-x/gap` and `--target-min` (44px hit area) are defined here too. Ember's old `--radius` and `--focus` are removed, with no aliases. All other names are Ember's existing ones.

## Registered extra color tokens
Component tokens that alias a semantic color. The token layer gives each a default, so every theme resolves it, and a theme lists an override only where it differs (ARCH-REVIEW Addendum 9). The generator fails if one doesn't resolve to a color, and every dialog border reads `var(--dialog-border)`.

| Token | Default | Light | Dark |
|---|---|---|---|
| `--dialog-border` | `var(--border)` | `var(--border)` `#111111` | `var(--border)` `#fdf8e9` |

## Shape, type and motion
| Token | Value |
|---|---|
| `--font-display` | `'Archivo Black', 'Arial Black', sans-serif` |
| `--font-body` | `'Archivo', system-ui, sans-serif` |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` |
| `--weight-display` | `400` |
| `--radius-sm` | `10px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `18px` |
| `--radius-full` | `999px` |
| `--border-width` | `2px` |
| `--border-width-strong` | `3px` |
| `--shadow-raised` | `4px 4px 0 var(--border)` |
| `--shadow-press` | `1px 1px 0 var(--border)` |
| `--divider-shape` | `none` |
| `--focus-ring-width` | `3px` |
| `--focus-ring-offset` | `3px` |
| `--focus-ring-style` | `solid` |
| `--control-height` | `44px` |
| `--control-padding-x` | `1.15rem` |
| `--control-gap` | `.5rem` |
| `--target-min` | `44px` |
| `--duration-fast` | `120ms` |
| `--duration-base` | `220ms` |
| `--duration-slow` | `420ms` |
| `--duration-reveal` | `520ms` |
| `--ease-standard` | `cubic-bezier(.2,.8,.2,1)` |
| `--ease-press` | `cubic-bezier(.34,1.56,.64,1)` |
| `--duration-ticker` | `28s` |
| `--parallax-scale` | `0.08` |
| `--lift` | `-3px` |
| `--tilt` | `-1.5deg` |

With reduced motion, every duration is 0, and tilt, lift and parallax are off. The ticker stops and has a visible Pause button (WCAG 2.2.2).
