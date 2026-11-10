# Ember UI themes: token spec v1.1 (aligned to Chief Architect R-2)

Chief of Creatives, 2026-11-10. This replaces v1.0 (`../TOKENS-SPEC.md`).
- **Scope (John, 2:07 and 2:08 PM PT):** Ember UI, its Storybook (toolbar switcher, every component shown in each style), the 3 UX prototypes and the /ux pages. The main jdilig.me site is not part of this.
- **Look reference:** the [v1.0 live prototype](https://raw.githack.com/balbonits/a11y-design-system/main/docs/themes/index.html) still shows the motion and feel. This spec changes structure and names, not the look.

## Axes (R-2)
- `html[data-theme="editorial|bold|tactile"]`. If it's absent, the theme is editorial.
- `html[data-mode="light|dark"]`. If it's absent, the mode follows `prefers-color-scheme`. "Auto" in the switcher means removing the attribute.
- Persist the choice in the shared same-origin keys `jdilig:theme` and `jdilig:mode` (for Auto, remove the key).
- The pre-paint script runs in `<head>` before CSS and sets only the two attributes from those keys. On jdilig.me it's allowed in the CSP by its sha256 hash.
- This replaces Ember's current `data-theme="dark|light"`. Migrate it to `data-mode`.

## Three layers (one source file each; `tokens.json` is generated)
1. [`primitives.css`](primitives.css): the raw palette (`--palette-*`), plus Ember's existing type and space ramps. **This is the only file with raw color values.** Editorial keeps Ember's current stone and ember values.
2. [`semantic.css`](semantic.css): one set per theme × mode.
   - Colors (same names Ember components use today): `--color-bg`, `--surface`, `--surface-muted`, `--text`, `--text-muted`, `--border`, `--border-subtle`, `--accent`, `--accent-hover`, `--accent-soft`, `--accent-contrast`, `--focus`, `--success`, `--warning`, `--danger`, `--danger-hover`, `--danger-contrast`, `--info`.
   - Per theme: `--font-display`, `--font-body`, `--weight-display`, `--radius-surface`, `--radius-control`, `--radius-field`, `--border-width`, `--shadow-1`, `--shadow-2`, `--shadow-press`, `--blur-glass`, `--duration-fast`, `--duration-base`, `--duration-slow`, `--duration-reveal`, `--ease-standard`, `--ease-press`, `--duration-ticker`, `--parallax-scale`, `--lift`.
3. [`components.css`](components.css): `--button-*`, `--field-*`, `--card-*`, `--modal-*`, `--tabs-*`, `--toast-*`, `--table-*`, `--focus-ring`, `--ticker-duration`, `--reveal-*` and `--parallax-scale`. **They reference semantic tokens only.** Component CSS reads only these and the semantic tokens.
- Generated file: [`tokens.json`](tokens.json), with primitives, semantic colors as resolved hex per combo, semantic shape per theme, and components. Regenerate it with `python3 gen.py`, or port the generator to `scripts/tokens-json.mjs`.

## CI gates
- **Raw color lint.** Fail if any file other than the primitives layer matches `#[0-9a-fA-F]{3,8}\b|\brgba?\(|--palette-` in component CSS, or in `components.css` outside comments. `color-mix(in srgb, ...)` is fine.
- **Contrast.** Run [`contrast.mjs`](contrast.mjs), which exits 1 on any failure.
  - Text needs 4.5:1: `text`, `text-muted`, `accent` and the four status colors on `color-bg` and `surface`; `text` and `text-muted` on `surface-muted`; `text` and `accent` on `accent-soft`; `accent-contrast` on `accent` and `accent-hover`; `danger-contrast` on `danger` and `danger-hover`; toast `color-bg` on `text`.
  - UI and focus need 3:1: `border` and `focus` on the backgrounds, and `accent` on `surface-muted`.
  - Current result: **174 pairs, 0 failures**. The table is in [CONTRAST.md](CONTRAST.md).

**Fix found in current Ember (please carry over):** editorial light `--success` (green-700 on stone-50) measured **4.45:1**, which is under AA. It's now green-800. Bold light `--accent-soft` was lightened so `accent` on it passes.

## Motion (R-3: lives in Ember UI only)
- Per-theme motion tokens are in the semantic layer above.
- Under reduced motion, `semantic.css` sets every duration to 0ms, `--parallax-scale: 0` and `--lift: 0px`, so everything renders in its final state.
- The components follow R-3: `useReducedMotion()`, `Ticker`/`Marquee` (Pause before the content, 44px or larger, also pauses on hover and focus, duplicate content `aria-hidden`, labelled region), `Parallax` (decorative only), and `AnimatedIcon` (stops by 5s or can be paused, never flashes more than 3 per second).
- Use the feel from the v1.0 prototype: `--duration-fast` for press, `--duration-base` for hover and toggles, `--duration-slow` for theme and route swaps and tile lift, and `--duration-reveal` for reveal and icon draw.

## ThemeSwitcher (Ember UI component, shared by all apps)
- Two native radio groups, each in a `<fieldset>` with a `<legend>`:
  - Theme: Editorial, Bold, Tactile.
  - Color mode: Auto, Light, Dark.
- Keyboard: Tab moves into a group and the arrow keys move between options. The focus ring uses `--focus-ring`. Each option is at least 44px wide and 40px tall.
- A polite live region announces each change, e.g. "Theme Bold, automatic (dark) mode".
- When the mode is Auto, it listens for `prefers-color-scheme` changes.
- It uses a view transition for the swap only when reduced motion is off.
- Props: `onChange?(theme, mode)`, plus an optional `storage` override for tests.

## Storybook (John 2:07 PM: toolbar switcher)
- Add `globalTypes` for `theme` (editorial, bold, tactile) and `mode` (auto, light, dark), with toolbar icons.
- Add a decorator that sets `data-theme` and `data-mode` on `<html>` in the preview iframe (removing `data-mode` for auto).
- Let the docs pages follow the toolbar too.
- Add one "All themes" story per component that shows it in all 6 combos side by side. This is what I'll run the visual pass on.
- The a11y test-runner runs each story in all 6 combos.

## Verified here (2026-11-10)
- Loaded the 3 CSS layers in Chrome with OS light and OS dark, and checked 20 attribute cases: no attributes, theme only, and theme with mode. All resolved `--color-bg`, `--accent` and `--radius-control` match `tokens.json` (`t.cjs`).
- The contrast gate passes: 174 pairs, 0 failures.

## DONE (build)
1. R-2 axes and the three layers are in `src/`, Ember's old `data-theme` light/dark is migrated, and the raw color lint passes.
2. `contrast.mjs` is in CI and green.
3. The Storybook toolbar switches theme and mode. Every component story passes axe with 0 serious issues in all 6 combos, and has 0 overflow at 375 and 1280.
4. ThemeSwitcher is exported, keyboard-only use works, it announces changes, and it persists to `jdilig:theme` and `jdilig:mode`.
5. The reduced-motion check passes.
6. There's a PROGRESS.md entry with before and after screenshots.
