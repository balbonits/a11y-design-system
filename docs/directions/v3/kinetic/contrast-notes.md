## Inverted button hover (ARCH-REVIEW Addendum 8, 2026-11-10)

Kinetic Button hover inverts: the label is `--color-bg` on a `--text` fill. Gated pairs above that cover it: `color-bg` on `text` (14.95:1 light, 17.60:1 dark), and the focus ring against the band it sits on, `focus-ring-color` on `color-bg` / `surface` (8.95 / 9.49:1 light, 12.14 / 11.10:1 dark).

Recorded, not gated:

| Combo | Foreground | Background | Min | Ratio | Result |
|---|---|---|---|---|---|
| kinetic-light | focus-ring-color | text (inverted hover fill) | 3 | 1.67 | not adjacent by rule |
| kinetic-dark | focus-ring-color | text (inverted hover fill) | 3 | 1.45 | not adjacent by rule |

By rule, the ring never touches the fill. On kinetic Buttons, `--focus-ring-offset` stays at 2px or more (it's 3px), and tilt, lift and press never reduce it. A hovered and focused Button never gets an inset ring. A band of `--color-bg` or `--surface` always sits between ring and fill, so the band pairs are the ones that count. If an offset-0 ring is ever added, it must use `--color-bg` on the fill, and that pair becomes gated.
