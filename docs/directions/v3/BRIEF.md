# v3 design directions: brief (Chief of Creatives, 2026-11-10 5:15 PM PT)

John's order (via ECOS, 5:09 PM PT): make the design way different across all 3 UX projects (Ember UI + Storybook, job tracker, dev dashboard).

## Banned (no reuse)
The three earlier candidate directions, A, B and C: their palettes (stone/ember, night/flare/violet, oat/forest), type pairings, layouts, blobs and glass, and every v1/v2 direction file. Don't reuse the reference sites from v2 either (Stripe, Apple, Godly, Linear, Vercel, Raycast, Arc, Framer, Awwwards).

## Kept
The R-2 infrastructure: data-theme x data-mode, primitive/semantic/component layers, Ember's semantic token names (ARCH-REVIEW Addendum 5; see src/themes/neo.css), contrast.mjs, the ThemeSwitcher and the storage keys. Only token values and the art direction change. New theme ids replace the A/B/C ids.

## Directions (one theme id each; each must be clearly unlike the others)
- **D `kinetic`, Kinetic Swiss.** Big variable-weight type (e.g. Inter Tight / Space Grotesk alternatives; pick fresh: "Bricolage Grotesque" or "Instrument Sans"), an asymmetric 12-col grid with lots of air and no cards (content separated by rules and whitespace, not boxes). Cobalt plus warm white, with a signal red accent. Motion: type that reveals per line, scroll-linked weight shifts, and a marquee ticker. Refs: Pentagram, Collins, Locomotive.
- **E `dusk`, Soft Dusk.** Flowing curves, pills and generous radii, with sections that blend into each other (curved dividers, no hard edges). Plum, coral and apricot; the dark mode is a deep aubergine night. A humanist sans plus a soft display serif (e.g. "Fraunces" alternatives; pick fresh: "Young Serif" / "Gloock"). Motion: slow easing, scroll-driven gradient hue shift and gentle parallax. Refs: Headspace, Calm, Lottie Files.
- **F `neo`, Neo-Brutal Playful.** Flat paper with hard ink outlines and offset solid shadows, sticker-like shapes and a slight tilt on hover. Acid lime, electric blue and ink black on cream. A mono plus a chunky grotesk (e.g. "JetBrains Mono" + "Archivo Black"). Motion: snappy spring presses and wobble icons. Refs: Gumroad, Figma Config, Poolsuite.
- **G `chrome`, optional stretch, Y2K Chrome.** Iridescent lilac/mint gradients, a monochrome UI under them and pill chips. Only if time allows.

## Every direction must
- be mobile-first (design at 375 first), less boxy and less stiff
- have motion from tokens only, a reduced-motion fallback, pause controls for anything that moves more than 5s (WCAG 2.2.2) and no flashing
- meet WCAG 2.2 AA / Section 508: text at 4.5:1 and UI/focus at 3:1, in light AND dark
- show real screens from all 3 projects: an Ember component sampler, the job tracker board (mobile + desktop) and a dev dashboard overview

## Deliverables per direction, in balbonits/a11y-design-system docs/directions/v3/<id>/
1. `index.html`, a clickable prototype (links between the 3 project screens, plus a light/dark toggle), viewable via raw.githack
2. `tokens.css`, the primitive + semantic values in R-2 shape (same semantic names), plus `TOKENS.md`, a token sheet with swatches
3. a contrast report, produced by running docs/themes/r2/contrast.mjs logic on the new values: 0 fails in light and dark
4. screenshots at 375 and 1280, light and dark

## DONE
3+ directions (D, E, F), each with the 4 deliverables, axe at 0 serious/critical, 0 horizontal overflow at 375 and 1280, and a v3 README linking everything. Nits go to follow-ups.

## Owners
Chief of Creatives (art direction, tokens, final sign-off), UX/UI Designer (prototype screens), Visual QA (axe, contrast, visual review as each lands). Chief Architect gets the brief at kickoff. FSD maps the chosen tokens into R-2 once John picks.
