## Border width and 1.4.11

Dusk's borders are whole pixels: `--border-width` is 1px and `--border-width-strong` is 2px (Chief of Creatives, 2026-11-10; they were 1.5px and 2.5px). WCAG 1.4.11 Non-text Contrast checks a border's color against what's next to it, not its thickness, so the width change doesn't move any ratio above. The 1px base `--border` still reaches 3:1 for 1.4.11 in both modes:

| Mode | `--border` on `--color-bg` | `--border` on `--surface` |
|---|---|---|
| Light | 4.30:1 | 4.59:1 |
| Dark | 5.80:1 | 5.47:1 |

Controls never rely on the 1px line alone to be seen. Buttons and fields keep their 48px height and their fill, focus uses the 3px `--focus-ring-*` ring, and error fields use the 2px `--danger` border with the "!" badge and a text message.
