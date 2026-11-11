## Inverted button hover (ARCH-REVIEW Addendum 8, 2026-11-10)

Kinetic Button hover inverts: the label is `--color-bg` on a `--text` fill. Gated pairs above that cover it: `color-bg` on `text` (14.95:1 light, 17.60:1 dark), and the focus ring against the band it sits on, `focus-ring-color` on `color-bg` / `surface` (8.95 / 9.49:1 light, 12.14 / 11.10:1 dark).

Recorded, not gated:

| Combo | Foreground | Background | Min | Ratio | Result |
|---|---|---|---|---|---|
| kinetic-light | focus-ring-color | text (inverted hover fill) | 3 | 1.67 | not adjacent by rule |
| kinetic-dark | focus-ring-color | text (inverted hover fill) | 3 | 1.45 | not adjacent by rule |

By rule, the ring never touches the fill. On kinetic Buttons, `--focus-ring-offset` stays at 2px or more (it's 3px), and tilt, lift and press never reduce it. A hovered and focused Button never gets an inset ring. A band of `--color-bg` or `--surface` always sits between ring and fill, so the band pairs are the ones that count. If an offset-0 ring is ever added, it must use `--color-bg` on the fill, and that pair becomes gated.

## Scrim (dialog backdrop)

`--scrim` is per-mode, the same naming as neo (`--palette-scrim` / `--palette-scrim-dark`). Light is cobalt-950 at 40% (`#06123F66`). Dark is black at 50% (`#00000080`). Dark was previously cobalt-950 at 60% (`#06123F99`); that lightened `--color-bg` (night-900 `#070F33`) instead of dimming it, and `--text-muted` under the scrim, both composited, failed at 2.75:1. Black at 50% dims night-900 (composite `#030719`, luminance 0.39×) and keeps that pair at 3:1 or better (Chief of Creatives follow-up, 9:50 PM PT 2026-11-10). Light is unchanged from the 9:45 PM PT ruling (CA agreed).

Gates, matching neo's method: the opaque dialog border against the scrim composited over `--color-bg` must be 3:1 or better (WCAG 1.4.11); `--text-muted` under the scrim, both composited, must be 3:1 or better; and the dark scrim must not lighten `--color-bg`. The opaque `--surface` against the composite is listed as informational only; the border is the 1.4.11 cue. The dialog is an opaque `--surface`, so its text contrast is the text/surface rows above and never depends on the scrim. There is no uncomposited "text-muted vs the composite" row: neo's Scrim section does not include one, and that pairing measures text that isn't drawn there.

- Light: scrim `#06123F66` over `#FBF8F1` composites to `#999caa`. Dialog edge `--dialog-border` `#0A1B5C` against that composite is 5.81:1 (pass). `--text-muted` under the scrim, both composited, is 4.20:1 (pass). Opaque white `--surface` against the composite is 2.73:1 (informational, below 3:1).
- Dark: scrim `#00000080` over `#070F33` composites to `#030719`. Dialog edge `--dialog-border` `#FBF8F1` against that composite is 18.89:1 (pass). `--text-muted` under the scrim, both composited, is 3.40:1 (pass). `--color-bg` dims (luminance 0.39×). Opaque `--surface` against the composite is 1.17:1 (informational).

| Combo | Token or pair | Base | Under scrim | Rule | Ratio |
|---|---|---|---|---|---|
| kinetic-light | color-bg | `#FBF8F1` | `#999caa` | dims |  |
| kinetic-light | surface | `#FFFFFF` | `#9ba0b2` | dims |  |
| kinetic-light | surface-muted | `#F3EEE2` | `#9496a1` | dims |  |
| kinetic-light | text | `#0A1B5C` | `#081750` | dims |  |
| kinetic-light | text-muted | `#45507A` | `#2c3762` | dims |  |
| kinetic-light | accent | `#C21807` | `#77161d` | dims |  |
| kinetic-light | border | `#1434B8` | `#0e2688` | dims |  |
| kinetic-light | --dialog-border on color-bg (1.4.11, opaque border) | `#0A1B5C` | `#999caa` | 3:1 | 5.81 |
| kinetic-light | surface on color-bg (opaque surface, informational) | `#FFFFFF` | `#999caa` | informational | 2.73 (below 3:1) |
| kinetic-light | text-muted under scrim (both composited) | `#2c3762` | `#999caa` | 3:1 | 4.20 |
| kinetic-dark | color-bg | `#070F33` | `#030719` | dims |  |
| kinetic-dark | surface | `#0D1844` | `#060c22` | dims |  |
| kinetic-dark | surface-muted | `#152255` | `#0a112a` | dims |  |
| kinetic-dark | text | `#FBF8F1` | `#7d7c78` | dims |  |
| kinetic-dark | text-muted | `#C3C9E0` | `#616470` | dims |  |
| kinetic-dark | accent | `#FF6B57` | `#7f352b` | dims |  |
| kinetic-dark | border | `#9AB0FF` | `#4d587f` | dims |  |
| kinetic-dark | --dialog-border on color-bg (1.4.11, opaque border) | `#FBF8F1` | `#030719` | 3:1 | 18.89 |
| kinetic-dark | surface on color-bg (opaque surface, informational) | `#0D1844` | `#030719` | informational | 1.17 (below 3:1) |
| kinetic-dark | text-muted under scrim (both composited) | `#616470` | `#030719` | 3:1 | 3.40 |
