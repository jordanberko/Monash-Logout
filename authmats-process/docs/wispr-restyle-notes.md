# Wispr-inspired Monash restyle — implementation and verification notes

Build stamped in the delivered file: **Build 2026-09-13.7465d1**

Source of truth for the application: this repository.
Source of truth for the styling: the approved reference, with the
qualification recorded under *Limitations* below.

---

## 1. The headline result

Everything in the document outside the `<style>` block is **byte-identical**
to the pre-restyle baseline.

| | baseline | delivered |
|---|---|---|
| all six `<script>` blocks | — | byte-identical |
| all markup (scripts and styles stripped) | 561,681 chars | 561,681 chars, byte-identical |
| CSS rules (embedded font payloads excluded) | 83,065 chars | 90,129 chars |
| motion-bearing declarations | 113 lines | the same 113 lines, in the same order |

No markup was changed. No selector was added, renamed or removed. No
JavaScript was touched. The restyle is entirely a change of CSS declarations
inside the existing stylesheet — there is no override sheet, and nothing was
bolted on beside the existing architecture.

That also answers the brief's "report any markup or selector changes"
directly: **there are none.**

---

## 2. What changed, by layer

### Design tokens

The document already expressed its whole visual system as custom properties,
so the palette work is token replacement rather than rule rewriting.

**Light**

```
--wash-a/-b #F1F6FA   --wash-c #E8F1F8
--ink #102E42   --ink-2 #3A5164   --ink-3 #526572
--hairline #C5D6E2   --edge-strong #0B4B70
--paper #FFFFFF   --canvas #F7FAFC   --band transparent
--cool-wash #E0EFF8   --deep #003F66   --on-deep #FFFFFF
--accent #006DAE   --accent-deep #00537F   --accent-wash #E0EFF8
--ok #0B6554   --warn #8A5A12   --stop #B64400
```

**Dark** (applied to both the `prefers-color-scheme` block and the
`[data-theme="dark"]` block, so the OS setting and the toggle agree)

```
--wash-a/-b #091E2E   --wash-c #0C2537
--ink #EEF5FA   --ink-2 #D2E2EC   --ink-3 #B4C9D7
--hairline #38566A   --edge-strong #5B8099
--paper #112D41   --canvas #0D2436
--cool-wash #1C4059   --deep #004875
--accent #89CAFA   --accent-deep #B6DFFD   --accent-wash #173E58
--ok #6FD3B4   --warn #EFC178   --stop #F5A98B
```

One token was **added**: `--on-solid`, the text colour for the solid status
chips. Light `#ffffff`, dark `#06263A`. It exists because the dark palette's
`--ok` and `--warn` are light chips, and white text on a light chip is the
one thing the old rule could not express. See §5.

### Typography

```
--font-serif   'EB Garamond'  — page title and section headings only
--font-display 'Figtree'      — supporting headings and UI
--font-text    'Figtree'      — body

--text-micro       clamp(13px, 0.08vw + 12px,   14px)
--text-caption     clamp(14px, 0.10vw + 13px,   15px)
--text-body-sm     clamp(16px, 0.16vw + 14.5px, 18px)
--text-body        clamp(17px, 0.20vw + 15.2px, 19px)
--text-body-lg     clamp(20px, 0.40vw + 16.5px, 24px)
--text-subheading  clamp(24px, 0.70vw + 17.6px, 30px)
--text-heading-sm  clamp(36px, 1.70vw + 20.7px, 52px)
--text-heading-lg  clamp(60px, 4.60vw + 15.8px, 96px)
```

Both faces are embedded as base64 woff2, as Caveat already was, so the page
still makes **zero external requests** — which matters because Apps Script
serves it from a sandboxed origin.

### Frame and panels

The frame is 1248px of *panel*, not 1248px including the gutter, so a panel
edge and the header's edge land on the same vertical line at every width:

```
.main, .rail { width: calc(100% - 48px); max-width: 1248px; margin: 0 auto }
```

- panels: `--r-panel` 40px, `--paper` ground, 1px `--hairline` border, 32px apart
- cards inside panels: `--r-card` 20px
- below 640px: `--r-panel` 26px, `--r-card` 16px, gutter 28px total

Measured: the frame resolves to exactly **1248px at 1700 and at 1440**, 720px
at 768, and 362px at 390.

### Header

The rail now sits in the frame and carries the panel language: a 1px
`--edge-strong` blue border on the left, right and bottom edges, with the
lower corners rounded to `--r-panel`. It stays `position:sticky; top:0`, so
`--head-h` is unchanged at 99px and every `scroll-margin-top` landing still
resolves exactly as before — confirmed by re-running the search-landing
check. The section strip's row takes `--cool-wash` so the two rows read as
distinct bands, and the strip's overflow fades were repointed to match that
ground rather than the elevated nav plate.

The rail is **not** clipped (`overflow` is left alone) and the lower corners
are repeated on the local row instead: clipping the rail would have cut the
focus ring off the first and last controls in the bar.

### Deep sections (3 and 10)

These two sections redefine the token set inside their own scope, on the
`--deep` navy. The scope must also re-declare `color: var(--ink)`: a custom
property redefined on a descendant does **not** retroactively change a
`color` that was already inherited from `body`, so without that line the body
text stayed navy-on-navy while only the elements that name a token stayed
visible.

Inside the scope the accent lightens to `#A6D8FB` (`--accent-deep` `#CDE9FD`),
`--paper` and `--canvas` become white at 6% and 3.5%, and the figure mounts
keep a light plate so a screenshot is never floated directly on navy.

### Chrome surfaces

- **Search modal** — dialog takes `--r-panel` and the panel hairline; the
  scrim is the palette's deep navy; the field carries `--edge-strong` with an
  `--accent-wash` focus ring; the title pill is the accent.
- **Onboarding gate** — panel radius and the masthead's serif for its heading
  and the name line, so the first screen is the same language as the document
  behind it.
- **Lightbox** — navy scrim, `--r-card` on the image.
- **Worked examples** — the rows already had the rounded bordered shape and
  the aligned number/title/verdict/control summary; what they lacked was
  separation, since a white row inside a white panel reads as one surface with
  lines drawn on it. The row now takes the recessed `--canvas` ground and the
  summary hover moved to `--cool-wash`. The expanded body is unchanged: a
  two-column `1fr 1.2fr` grid that stacks at 900px.
- **Print** — panels flatten back to plain stacked prose: borders and radii
  off on `section`, `.mast`, `.sdialog` and `.gatecard`, and the rail loses
  its frame width and rounding.

---

## 3. Animations

The brief asked for the animation system to be protected. It was not touched
at all, and that is checkable rather than asserted:

- every declaration of `transform`, `opacity`, `filter`, `clip-path`,
  `animation` and `transition` in the stylesheet — 113 lines — is **textually
  identical to the baseline and in the same order**
- all **11 keyframes** are present and unchanged:
  `blindsreveal, checkdraw, exopen, gaterise, heroin, numpop, pathswap,
  ringdraw, rollin, tickpop, verdictin`
- the five `prefers-reduced-motion` blocks and all 26 `.anim` gating selectors
  are unchanged
- the blinds theme transition still runs: `startViewTransition` available,
  the `--vt-slat` `@property` registered, `data-vt=blinds` observed during the
  sweep, cleared afterwards, no theming class left behind

---

## 4. Verification performed

Everything below was run against the delivered build. Nothing here is
inferred.

**Content preservation**

`snap.js` captures body text, section headings and subtitles, all h3s, table
headers and row counts, figures with refs/captions/alt/dimensions, all 16
worked examples with their options and correct-answer flags, the checklist,
the field cards, the nav, the gate cards, every element id, every
`data-` attribute name, keyframes, animation selectors, `google.script.run`
call count and storage keys. Hidden and collapsed content is included, since
the capture reads `textContent` rather than rendered text, and the gate is
captured separately.

- The baseline snapshot was **independently reproduced** from
  `baseline/site-e.before.html` to prove it had not been regenerated from the
  styled source.
- The delivered snapshot is **identical** to it in every field.

**Interactive flows** (`flows6.js`, `quizqa.js`, `searchqa.js`)

Filters, See all, expand/collapse all, study mode, answering, scoring tally
and gate, reset, delivery path A/B switching with step counts, checklist
ticking with per-item storage keys, persistence across reload, checklist
reset, lightbox open and close, theme attribute, nav links and scrollability,
the quiz's `{v:2}` assessment format and its rejection of the old format, and
all 13 search landings resolving to the right heading and sitting clear of
the sticky header. **No page errors in any run.**

**Responsive** — 1700, 1440, 768 and 390, each in both themes, with every
example expanded and the whole page scrolled so lazy images and reveals
resolve:

```
1700 light/dark  no h-scroll  0 overflowing  0 loose tables  frame 1248px
1440 light/dark  no h-scroll  0 overflowing  0 loose tables  frame 1248px
 768 light/dark  no h-scroll  0 overflowing  0 loose tables  frame  720px
 390 light/dark  no h-scroll  0 overflowing  0 loose tables  frame  362px
```

Every table sits inside an `overflow-x` container. No multi-column block was
left with a column under 300px — they stack first.

**Enlarged text** — tested as page zoom, which is how a reader actually
enlarges text and which in CSS terms is a proportionally narrower viewport:
1440 at 150% and 200%, and 1280 at 400% (320 CSS px), all pass in both themes
with no horizontal scroll. See *Limitations* for what fails below 320px.

**Contrast** — a WCAG checker with proper alpha compositing, walking up the
ancestor chain and compositing each translucent layer before computing
luminance. A naive check reports false passes and false failures on this
document because `--paper` and `--canvas` are translucent inside the deep
sections.

- **light theme: all text meets WCAG AA**
- **dark theme: all text meets WCAG AA**

**Apps Script compatibility** — `gasmock.js` loads the generated
`appsscript/Index.html` with `google.script.run` mocked in-page. Nothing
leaves the browser.

- `getViewer` resolved and populated the verified-identity screen
- the full gate flow completed into the document
- `getTrainingRecord` loaded and rendered the shared roll
- **`addTrainingRecord` was never called.** The Add button stays disabled
  until a completion record exists, so exercising the read paths cannot
  submit anything. No demonstration training record was created.
- all three embedded faces loaded (EB Garamond, Figtree, Caveat), view
  transitions available, `--head-h` 99px, frame 1232px at a 1280 viewport,
  panel radius 40px, body Figtree, section headings EB Garamond, build stamp
  present, **no page errors**

---

## 5. One fix that goes slightly beyond pure restyling

The dark theme's `--ok` and `--warn` are light chips. The existing rule set
white text on them:

```css
.owner.you { background: var(--ok);   color: #fff }
.owner.snr { background: var(--warn); color: #fff }
```

At the baseline palette those two badges already failed WCAG AA in dark
theme, at ratios of **2.02 and 1.91**. Carrying the rule into the new palette
left them failing at **1.80 and 1.67** — still broken, and slightly worse.

Rather than leave a regression in place or repair something unrelated, the
fix was made *in the token layer where this pass was already working*: a new
`--on-solid` token, white in light theme and `#06263A` in dark. The two
badges now clear AA at **8.66** and **9.34**.

This is flagged because it is the one place where the pass changed a
pre-existing accessibility defect rather than simply re-skinning it. The
brief's "no unrelated repairs" instruction is why nothing else was touched.

---

## 6. Limitations and things not done

1. **The approved reference could not be fetched.**
   `https://materials-qc-refined.berko11.chatgpt.site/` returns **HTTP 401**
   from this environment. The styling was therefore implemented from the
   brief's own specifications — the two colour tables, the EB Garamond /
   Figtree pairing, the 1248px frame and the 40px panel radius — and not by
   measuring the reference. Anywhere the brief was descriptive rather than
   numeric, the reading taken is recorded here so you can correct it:
   - the header is **flush to the top of the viewport** with its lower corners
     rounded, rather than floating with a gap above it. A floating bar needs
     either a markup wrapper or a masking pseudo-element to stop content
     showing through the gap, and neither seemed worth doing against an
     unverifiable target.
   - the expanded worked example keeps its `1fr 1.2fr` ratio rather than
     going to equal columns; the right column always carries the longer text,
     so equal columns make the two halves markedly different heights.

2. **Text does not respond to a browser's default font-size setting.** The
   type scale is expressed in `px` and `vw` inside `clamp()`, so a reader who
   raises their default font size sees no change; page zoom works normally.
   This is **pre-existing** — the baseline used the same `px`/`vw` clamps —
   and was left alone because changing the type scale to `rem` is a
   functional change, not a restyle.

3. **Below 320 CSS px the layout breaks, in the baseline and in the delivered
   file alike.** At 260px the baseline overflows 12 elements and the delivered
   file 18; at 195px, 86 and 82. Both hold cleanly at 320px and above, which
   is the conventional floor. Not a regression introduced by this pass, but
   the 260px count is slightly worse and is recorded rather than glossed.

4. **Nothing was deployed.** The live Apps Script application is untouched.
   `appsscript/Index.html` is regenerated and ready, and has been checked
   against mocks, but has not been pushed to Apps Script.

5. **No editorial change was made.** No instructional text was shortened,
   rewritten, duplicated, removed or added — the byte-identical markup in §1
   is the proof. No unrelated cleanup, dependency change or functional repair
   was performed, with the single documented exception in §5.

6. **No novice has tested this.** The verification above is automated and
   measured. It says the document behaves and renders as specified; it does
   not say a newcomer found it usable.
