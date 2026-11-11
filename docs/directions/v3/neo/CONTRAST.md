| Combo | Foreground | Background | Min | Ratio |
|---|---|---|---|---|
| neo-light | text | color-bg | 4.5 | 17.79 |
| neo-light | text | surface | 4.5 | 18.88 |
| neo-light | text-muted | color-bg | 4.5 | 10.23 |
| neo-light | text-muted | surface | 4.5 | 10.86 |
| neo-light | accent | color-bg | 4.5 | 6.24 |
| neo-light | accent | surface | 4.5 | 6.63 |
| neo-light | success | color-bg | 4.5 | 5.84 |
| neo-light | success | surface | 4.5 | 6.20 |
| neo-light | warning | color-bg | 4.5 | 6.06 |
| neo-light | warning | surface | 4.5 | 6.43 |
| neo-light | danger | color-bg | 4.5 | 5.69 |
| neo-light | danger | surface | 4.5 | 6.04 |
| neo-light | info | color-bg | 4.5 | 6.28 |
| neo-light | info | surface | 4.5 | 6.67 |
| neo-light | text | surface-muted | 4.5 | 15.95 |
| neo-light | text-muted | surface-muted | 4.5 | 9.18 |
| neo-light | text | accent-soft | 4.5 | 15.51 |
| neo-light | accent | accent-soft | 4.5 | 5.44 |
| neo-light | accent-contrast | accent | 4.5 | 6.63 |
| neo-light | accent-contrast | accent-hover | 4.5 | 8.88 |
| neo-light | danger-contrast | danger | 4.5 | 6.04 |
| neo-light | danger-contrast | danger-hover | 4.5 | 8.12 |
| neo-light | color-bg | text | 4.5 | 17.79 |
| neo-light | highlight-contrast | highlight | 4.5 | 14.74 |
| neo-light | border | color-bg | 3 | 17.79 |
| neo-light | border | surface | 3 | 18.88 |
| neo-light | focus-ring-color | color-bg | 3 | 4.24 |
| neo-light | focus-ring-color | surface | 3 | 4.50 |
| neo-light | focus-ring-color | surface-muted | 3 | 3.80 |
| neo-light | accent | surface-muted | 3 | 5.60 |
| neo-light | focus-ring-color | border | 3 | 4.20 |
| neo-light | border | surface-muted | 3 | 15.95 |
| neo-dark | text | color-bg | 4.5 | 17.79 |
| neo-dark | text | surface | 4.5 | 16.05 |
| neo-dark | text-muted | color-bg | 4.5 | 11.28 |
| neo-dark | text-muted | surface | 4.5 | 10.18 |
| neo-dark | accent | color-bg | 4.5 | 14.74 |
| neo-dark | accent | surface | 4.5 | 13.30 |
| neo-dark | success | color-bg | 4.5 | 9.87 |
| neo-dark | success | surface | 4.5 | 8.91 |
| neo-dark | warning | color-bg | 4.5 | 11.75 |
| neo-dark | warning | surface | 4.5 | 10.60 |
| neo-dark | danger | color-bg | 4.5 | 7.57 |
| neo-dark | danger | surface | 4.5 | 6.83 |
| neo-dark | info | color-bg | 4.5 | 9.03 |
| neo-dark | info | surface | 4.5 | 8.15 |
| neo-dark | text | surface-muted | 4.5 | 14.07 |
| neo-dark | text-muted | surface-muted | 4.5 | 8.92 |
| neo-dark | text | accent-soft | 4.5 | 12.46 |
| neo-dark | accent | accent-soft | 4.5 | 10.32 |
| neo-dark | accent-contrast | accent | 4.5 | 14.74 |
| neo-dark | accent-contrast | accent-hover | 4.5 | 16.49 |
| neo-dark | danger-contrast | danger | 4.5 | 7.57 |
| neo-dark | danger-contrast | danger-hover | 4.5 | 9.39 |
| neo-dark | color-bg | text | 4.5 | 17.79 |
| neo-dark | highlight-contrast | highlight | 4.5 | 6.63 |
| neo-dark | border | color-bg | 3 | 17.79 |
| neo-dark | border | surface | 3 | 16.05 |
| neo-dark | focus-ring-color | color-bg | 3 | 4.20 |
| neo-dark | focus-ring-color | surface | 3 | 3.79 |
| neo-dark | focus-ring-color | surface-muted | 3 | 3.32 |
| neo-dark | accent | surface-muted | 3 | 11.66 |
| neo-dark | focus-ring-color | border | 3 | 4.24 |
| neo-dark | border | surface-muted | 3 | 14.07 |

## Scrim (dialog backdrop)

`--scrim` is ink `#111111` plus alpha (45% light `#11111173`, 55% dark `#1111118c`), composited over the page. Each color must dim or stay equal, never lighten, and page text under the scrim keeps at least 3:1 so it stays recognizable. The dialog is an opaque `--surface`, so its text contrast is the text/surface rows above and never depends on the scrim.

| Combo | Token or pair | Base | Under scrim | Rule | Ratio |
|---|---|---|---|---|---|
| neo-light | color-bg | `#fdf8e9` | `#939088` | dims |  |
| neo-light | surface | `#ffffff` | `#949494` | dims |  |
| neo-light | surface-muted | `#f3ecd2` | `#8d897b` | dims |  |
| neo-light | text | `#111111` | `#111111` | dims |  |
| neo-light | text-muted | `#3d3d3d` | `#292929` | dims |  |
| neo-light | accent | `#1f3dff` | `#192994` | dims |  |
| neo-light | text on color-bg |  |  | 3:1 | 5.92 |
| neo-light | text on surface |  |  | 3:1 | 6.22 |
| neo-light | text-muted on color-bg |  |  | 3:1 | 4.56 |
| neo-dark | color-bg | `#111111` | `#111111` | dims |  |
| neo-dark | surface | `#1c1c1c` | `#161616` | dims |  |
| neo-dark | surface-muted | `#272727` | `#1b1b1b` | dims |  |
| neo-dark | text | `#fdf8e9` | `#7b7972` | dims |  |
| neo-dark | text-muted | `#cfc8b0` | `#676459` | dims |  |
| neo-dark | accent | `#c6f432` | `#637720` | dims |  |
| neo-dark | text on color-bg |  |  | 3:1 | 4.33 |
| neo-dark | text on surface |  |  | 3:1 | 4.15 |
| neo-dark | text-muted on color-bg |  |  | 3:1 | 3.19 |
