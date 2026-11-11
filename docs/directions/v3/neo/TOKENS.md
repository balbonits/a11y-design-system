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
| `--focus` | `blue-700` | `#1530d0` | `blue-300` | `#8fa2ff` |
| `--success` | `green-700` | `#17702a` | `green-300` | `#5ed27a` |
| `--warning` | `amber-800` | `#855400` | `amber-300` | `#ffc24a` |
| `--danger` | `red-700` | `#c4122f` | `red-300` | `#ff7a8c` |
| `--danger-hover` | `red-800` | `#a00e26` | `red-200` | `#ff9aa8` |
| `--danger-contrast` | `paper` | `#ffffff` | `ink` | `#111111` |
| `--info` | `sky-700` | `#0b5cad` | `sky-300` | `#7fb6ff` |
| `--highlight` | `lime-400` | `#c6f432` | `blue-600` | `#1f3dff` |
| `--highlight-contrast` | `ink` | `#111111` | `paper` | `#ffffff` |

`--highlight` and `--highlight-contrast` are proposed additions (a sticker or chip fill and its text). Everything else uses Ember's existing names.

## Shape, type and motion
| Token | Value |
|---|---|
| `--font-display` | `'Archivo Black', 'Arial Black', sans-serif` |
| `--font-body` | `'Archivo', system-ui, sans-serif` |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` |
| `--weight-display` | `400` |
| `--radius-surface` | `18px` |
| `--radius-control` | `12px` |
| `--radius-field` | `10px` |
| `--radius-pill` | `999px` |
| `--border-width` | `2.5px` |
| `--shadow-1` | `4px 4px 0 var(--border)` |
| `--shadow-2` | `7px 7px 0 var(--border)` |
| `--shadow-press` | `1px 1px 0 var(--border)` |
| `--blur-glass` | `0px` |
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
