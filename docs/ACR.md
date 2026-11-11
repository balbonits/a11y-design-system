# Accessibility Conformance Report: Ember UI (a11y-design-system)

Based on VPAT® 2.5 Rev 508 edition (Section 508). **Self-assessed, not third-party audited.** Assessed by the Back End Developer bot for John Dilig from the repo's own checks.

- **Product:** Ember UI, an accessible React design system starter (tokens, 8 components, Storybook docs). Storybook: https://jdilig.me/ux/design-system/storybook/ . Case study: https://jdilig.me/ux/design-system
- **Version:** `main` at 5e16a66 plus `fix/toast-more-label` (PR #37, which contains #21). `package.json` says 0.3.1, which is unreleased: there is no v0.3.1 tag or publish, so cite the commit SHA, not a version number.
- **Report version:** 1.3 (1.3 moves 2.4.11 Focus Not Obscured (Minimum) to Supports, citing test:focus-obscured, and adds the in-modal toast outlet to the 4.1.3 remark; 1.2 is HIT-PATCH: Small buttons and Tabs now meet the 44 px bar, so the 2.5.8 exceptions are gone; 1.1 changed only the 2.5.8 and 302.7 remarks and added the target-size gate)
- **Report date:** 2026-11-10
- **Contact:** https://github.com/balbonits/a11y-design-system/issues
- **Standards:** Revised Section 508 (36 CFR 1194), which incorporates WCAG 2.0 A/AA (the 508 baseline). WCAG 2.1 and 2.2 A/AA criteria are extra rows, marked (2.1) or (2.2).
- **Scope:** the components as rendered in the built Storybook. The Storybook docs site is a development tool and is not in scope of this report (its pages are still swept as test evidence below). An app that uses Ember UI is responsible for its own page structure (landmarks, H1, title, language).

## Evaluation methods
- **Automated (axe-core 4.x, `npm run test:a11y`):** every story and docs page in light and dark at 1024 px: 122 runs (50 stories + 11 docs pages x 2 themes), 0 serious or critical. The 288 moderate findings are all `landmark-one-main`, `page-has-heading-one`, `region` and `landmark-unique`. They come from rendering one component alone in an isolated Storybook story iframe, which has no page landmarks or H1, so they are findings about the test harness, not about the components.
- **Reduced motion (same script):** the modal, toast and loading-button stories run 0 animations under `prefers-reduced-motion: reduce`.
- **Mobile (`npm run test:mobile`):** 11 docs pages x 320/375/414/768/920 px x light/dark = 110 runs, 0 failing (page overflow, 44 px targets, axe).
- **Target size (`npm run test:target-size`, CI gate):** every story (62) at 320 and 1280 px in light and dark = 248 runs, 624 targets. It measures each control's effective hit area: the region where a pointer press actually lands on it (Chrome hit-testing, so a `::before` hit area counts and anything painted over it doesn't), calibrated to within 0.5 px (`--calibrate` checks 40 synthetic boxes) and proved by a negative control that shrinks a button to 24 px and must fail. Inline links in running text are exempt, as 2.5.8 allows. Result with HIT-PATCH: 0 failing, and every shipped component's target is at least 44 x 44 px. The only entry left in `scripts/target-size.known.json` is the 8 measurements on the Email input of the theme-registry story's test-fixture theme, a fixture with a 40 px field height that isn't a shipped theme.
- **Unit tests (`npm test`, Vitest + Testing Library):** 9 pass. They cover Modal focus in, Esc and close-button focus return (also when the app unmounts it), the Modal Tab trap, Tabs arrows/Home/End with wrap and disabled-skip, Toast roles, Toast auto-dismiss with hover pause, sticky action/error toasts, and the Undo action.
- **Keyboard:** covered by the unit tests above and the per-component keyboard tables on each docs page. No separate manual keyboard pass is recorded yet.
- **Screen reader:** **not yet evaluated.** Until a reader pass is recorded in PROGRESS.md (naming the reader, browser and OS), criteria that depend on announcements rest on markup, unit tests and axe only.
- **Focus not obscured (`node scripts/focus-obscured.mjs`):** the Toast/Error story with 3 sticky toasts open and 60 full-width controls added behind them, Tabbed through at 320 and 1440 px in light and dark (240 focus stops). A stop fails if every on-screen sample point on it is under a toast. Result: 26 fully hidden, all at 320 px. Limit: the controls are full width, so a narrow control under the toasts at wide widths isn't covered by this check.
- All runs: 2026-11-10 on main 757da0c (the focus check on feat/r8-conventions, whose component and story code is unchanged from 757da0c), Chrome (`/usr/bin/google-chrome`) via Playwright on Linux. The 2.4.11 and 4.1.3 checks were rerun 2026-11-11 on `fix/toast-more-label` merged with main 2d59d7b.

## Terms
Supports, Partially Supports, Does Not Support, Not Applicable (as defined by VPAT 2.5).

## WCAG 2.x Report (Section 508 Chapter 5, 501.1 and Chapter 6, 602.3)
| Criteria | Level | Conformance | Remarks |
|---|---|---|---|
| 1.1.1 Non-text Content | A | Supports | Icon-only buttons need an `aria-label` (the Button type makes it required). Glyphs such as ✕ and the spinner are aria-hidden. Tested: axe. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | Not Applicable | main has no media component. It becomes applicable when the VideoPlayer ships (Card 1-VP; captions, AD and transcript data in PR #8). |
| 1.2.2 Captions (Prerecorded) | A | Not Applicable | As 1.2.1. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | Not Applicable | As 1.2.1. |
| 1.2.4 Captions (Live) | AA | Not Applicable | No live media. |
| 1.2.5 Audio Description (Prerecorded) | AA | Not Applicable | As 1.2.1. |
| 1.3.1 Info and Relationships | A | Supports | Field shell ties label, hint and error with `for` and `aria-describedby`. CheckboxGroup uses fieldset/legend. Table uses `<caption>` and `scope="col"`/`scope="row"`. Tabs use tablist/tab/tabpanel. Tested: axe, unit tests. |
| 1.3.2 Meaningful Sequence | A | Supports | DOM order matches visual order. Tested: mobile sweep at 5 widths. |
| 1.3.3 Sensory Characteristics | A | Supports | No component instructions rely on shape, color, position or sound. Tested: code review of the docs text. |
| 1.3.4 Orientation (2.1) | AA | Supports | No orientation lock in CSS or code. Tested: code review. |
| 1.3.5 Identify Input Purpose (2.1) | AA | Supports | Input passes all native attributes through, including `autoComplete`, so apps set the purpose. Tested: code review. |
| 1.4.1 Use of Color | A | Supports | Errors show a text message as well as a 2 px danger border. Toast tone is carried by role and title text, not only color. Tested: axe, code review. |
| 1.4.2 Audio Control | A | Not Applicable | No audio. |
| 1.4.3 Contrast (Minimum) | AA | Supports | axe color-contrast passes on every story and docs page, light and dark. The Tokens page computes live ratios for every documented pair. Tested: axe. |
| 1.4.4 Resize Text | AA | Supports | rem-based type scale and min-height controls. Tested: code review. No recorded 200% zoom run yet. |
| 1.4.5 Images of Text | AA | Supports | No images of text. |
| 1.4.10 Reflow (2.1) | AA | Supports | No page-level horizontal scroll at 320 px. Wide tables scroll inside a labelled, focusable region (allowed for data tables). Tested: mobile sweep. |
| 1.4.11 Non-text Contrast (2.1) | AA | Supports | Control borders, focus ring and checkbox use tokens at 3:1 or more. Tested: axe, Tokens page ratios. |
| 1.4.12 Text Spacing (2.1) | AA | Supports | No fixed-height text containers; controls use min-height. Tested: code review. No automated text-spacing run yet. |
| 1.4.13 Content on Hover or Focus (2.1) | AA | Not Applicable | No content appears on hover or focus. |
| 2.1.1 Keyboard | A | Supports | Native buttons, inputs, select and dialog. Tabs follow the APG pattern (arrows, Home, End). Table scroll region and sort buttons are focusable. Tested: unit tests. |
| 2.1.2 No Keyboard Trap | A | Supports | Modal keeps Tab inside while open by design. Esc closes it and focus returns to the opener. Tested: unit tests. |
| 2.1.4 Character Key Shortcuts (2.1) | A | Not Applicable | No single-key shortcuts. |
| 2.2.1 Timing Adjustable | A | Supports | Toasts with an action (such as Undo) and error toasts stay until dismissed. Info and success toasts auto-dismiss after 5 s, pause on hover or focus, and carry no required action. Tested: unit tests. |
| 2.2.2 Pause, Stop, Hide | A | Supports | Nothing moves for more than 5 s. The loading spinner shows only while an action is pending. Tested: reduced-motion check. |
| 2.3.1 Three Flashes or Below Threshold | A | Supports | Nothing flashes. Tested: code review of `ember.css` animations (one 200 ms pop). |
| 2.4.1 Bypass Blocks | A | Not Applicable | Owned by the consuming application; the Storybook docs site is a development tool and is not in scope of this report. |
| 2.4.2 Page Titled | A | Not Applicable | Owned by the consuming application; the Storybook docs site is a development tool and is not in scope of this report. |
| 2.4.3 Focus Order | A | Supports | Modal moves focus in on open and returns it on close. Tabs use a roving tabindex. Tested: unit tests. |
| 2.4.4 Link Purpose (In Context) | A | Not Applicable | Components don't render links. |
| 2.4.5 Multiple Ways | AA | Not Applicable | Owned by the consuming application; the Storybook docs site is a development tool and is not in scope of this report. |
| 2.4.6 Headings and Labels | AA | Supports | Modal requires a title (used as `aria-labelledby`). Fields require a label. Tested: axe. |
| 2.4.7 Focus Visible | AA | Supports | A `:focus-visible` ring on every interactive element (`src/ember.css`). Tested: code review; axe doesn't measure focus rings. |
| 2.4.11 Focus Not Obscured (Minimum) (2.2) | AA | Supports | Only the toast viewport is fixed-position. Below 640 px the stack collapses to the newest toast plus a "Show all notifications (N)" button (stable name; `aria-expanded` carries the state), and while any toast is open the page reserves the stack's measured height as `scroll-padding-bottom`, so a focused control scrolls clear of it. Toasts never take focus. Tested (`npm run test:focus-obscured`, in CI): with 3 sticky toasts open over 90 controls (full-width buttons, inputs, and 44 px buttons pinned under the stack), Tabbing through every control at 320, 375, 768 and 1440 px in every registered theme in light and dark, collapsed and expanded, the gate's final line reads `checked 2160, fully hidden 0, partly covered 0` (FU-FSD-TOAST). |
| 2.5.1 Pointer Gestures (2.1) | A | Supports | No multipoint or path gestures. |
| 2.5.2 Pointer Cancellation (2.1) | A | Supports | Native click activation (up-event). |
| 2.5.3 Label in Name (2.1) | A | Supports | Accessible names come from the visible label text. Tested: axe. |
| 2.5.4 Motion Actuation (2.1) | A | Not Applicable | No motion input. |
| 2.5.7 Dragging Movements (2.2) | AA | Not Applicable | No dragging. |
| 2.5.8 Target Size (Minimum) (2.2) | AA | Supports | Every shipped component's effective hit area is at least 44 x 44 px (Ember's `--target-min`, the 2.5.5 AAA size), well above the 24 px this criterion requires (tested: target-size gate, all stories at 320 and 1280 px, light and dark). Version 1.1 listed two exceptions that HIT-PATCH fixed: Small buttons (including the Toast Undo and dismiss buttons) had a 40 px hit area because their `::before` was measured from inside the 2 px border, and Tabs were 42 px tall because the tab list clipped their bottom 2 px. |
| 3.1.1 Language of Page | A | Not Applicable | Owned by the consuming application; the Storybook docs site is a development tool and is not in scope of this report. |
| 3.1.2 Language of Parts | AA | Not Applicable | No other-language passages. |
| 3.2.1 On Focus | A | Supports | Focus causes no context change. |
| 3.2.2 On Input | A | Supports | Select and Checkbox change only their own value. Tabs change the panel, which is the expected tab behavior. |
| 3.2.3 Consistent Navigation | AA | Not Applicable | Owned by the consuming application; the Storybook docs site is a development tool and is not in scope of this report. |
| 3.2.4 Consistent Identification | AA | Supports | The same component gives the same name and role everywhere. |
| 3.2.6 Consistent Help (2.2) | A | Not Applicable | No help mechanism. |
| 3.3.1 Error Identification | A | Supports | `error` renders text tied by `aria-describedby`, plus `aria-invalid`. Tested: axe, stories. |
| 3.3.2 Labels or Instructions | A | Supports | Fields need a visible label. Required fields show a marker and set `required`. |
| 3.3.3 Error Suggestion | AA | Supports | The error slot takes app-written help text; the stories show how-to-fix wording. The app owns the wording. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Not Applicable | Components don't submit data. Toast `action` supports Undo for apps that need it. |
| 3.3.7 Redundant Entry (2.2) | A | Not Applicable | No multi-step processes. |
| 3.3.8 Accessible Authentication (Minimum) (2.2) | AA | Not Applicable | No authentication. |
| 4.1.1 Parsing | A | Supports | WCAG 2.2 removes this criterion; React renders valid DOM. |
| 4.1.2 Name, Role, Value | A | Supports | Native controls, `aria-sort`, `aria-selected`, `aria-busy`, `aria-checked="mixed"` for indeterminate. Tested: axe, unit tests. Not yet verified with a screen reader. |
| 4.1.3 Status Messages (2.1) | AA | Partially Supports | Toasts use `role="status"` (polite) and `role="alert"` for errors. In-modal toasts route to a polite status outlet inside the topmost modal (an alert outlet for errors), and each toast is announced once, where it was first shown. Tested: unit tests and `npm run test:toast-modal`. Partial until a screen-reader pass confirms the announcements. |

## Revised Section 508 Chapter 3: Functional Performance Criteria
| Criteria | Conformance | Remarks |
|---|---|---|
| 302.1 Without Vision | Partially Supports | Semantic markup, labels and live regions, checked with axe and unit tests. Not yet verified with a screen reader. |
| 302.2 With Limited Vision | Supports | AA contrast in light and dark, reflow at 320 px, rem type. |
| 302.3 Without Perception of Color | Supports | Nothing relies on color alone. |
| 302.4 Without Hearing | Not Applicable | No audio on main (see 1.2.x). |
| 302.5 With Limited Hearing | Not Applicable | As 302.4. |
| 302.6 Without Speech | Not Applicable | No speech input. |
| 302.7 With Limited Manipulation | Supports | Fully keyboard operable, targets at least 40 px (44 px except the three components named under 2.5.8), no drag or required timing. |
| 302.8 With Limited Reach and Strength | Supports | As 302.7. |
| 302.9 With Limited Language, Cognitive, and Learning Abilities | Supports | Plain labels, Undo support in toasts, inline error help. |

## Chapter 4 Hardware, Chapter 5 Software, Chapter 6 Support Documentation
- Chapter 4 Hardware: Not Applicable (web components).
- Chapter 5 Software: Not Applicable beyond the WCAG table above (web content, no authoring tool).
- Chapter 6 Support Documentation (602.3): the Storybook docs pages are covered by the WCAG table and the axe and mobile runs above.

## Legal disclaimer
This is a self-assessment of an open-source design system starter. It describes the build named above and doesn't promise future conformance.
