# Blank guide

The Authorised Materials QC guide with all of its content taken out. The design,
layout and behaviour are the same: sign-in screen, sticky contents bar, search,
light and dark themes, worked examples with a self-test, the checklist, and the
completion page with the shared training record. Every piece of wording is a
placeholder that says what belongs there.

| file | what it is |
|---|---|
| `site-blank.html` | **the source.** Fill this in. |
| `preview-blank.html` | built from the source, for opening in a browser. Do not edit. |
| `appsscript/` | built Apps Script files, for deploying as its own web app. Do not edit `Index.html` by hand. |

`make_blank.py` (one folder up) made `site-blank.html` from `site-e.html`. It
will not overwrite a blank that already exists, because that would wipe
whatever has been written into it.

## Filling it in

Open `site-blank.html` and work from top to bottom. Search for these first,
since each appears in more than one place:

- `Guide title`: the browser tab, sign-in screen, top bar, page heading, and
  the line under the completion tick (in the script, next to `Training complete`).
- `Team name`: the sign-in screen and the small heading above the title.
- `Subtitle`: the blue half of the page heading.
- The pills under the heading (`Time to complete`, `12 sections` and so on),
  in the masthead and on the sign-in homepage.

Each section is a `<section id="s1">` to `<section id="s12">` with a matching
link in `<ol id="toc">` near the top. Change the `<h2>` and the contents bar
label together.

### What each section shows you

Every section mirrors the layout of the same section in the real guide, so each
one doubles as an example of the parts you can reuse anywhere.

| section | parts it uses |
|---|---|
| 1 | opening paragraph, two highlighted points, a feature paragraph, three heading and text rows, numbered rules |
| 2 | two-column table (a glossary) |
| 3 | three cards, key note, three-column table, step lists with screenshots. Shown as a navy band |
| 4 | three-column table, side note |
| 5 | table, narrow screenshot, notes, a table with a fixed first column |
| 6 | table with owner labels and highlighted rows, key note, wide screenshot |
| 7 | the Option A / Option B switch, steps that change with it, practice scenario tables |
| 8 | table, the item list with labelled findings (one flagged), more tables |
| 9 | worked examples with Reference and Test yourself modes |
| 10 | tables with owner labels, before and after table, notes. Shown as a navy band |
| 11 | table, numbered points, more tables |
| 12 | the tick-off checklist |

To drop a part, delete its block. To repeat one, copy it.

### Adding or removing sections

Keep the ids `s1` to `s12` where they are: the stylesheet makes `s3` and `s10`
the navy bands and styles `s1` as the introduction. To add a section, copy one,
give it the next id (`s13`), and add a matching link to the contents bar before
`Complete`. To remove one, delete the section and its link.

The completion page counts sections, checklist steps and scored questions by
itself. The wording that states those numbers does not, so update the pills,
`Sections 1 to 12` and the step and question counts on the completion page.

### Screenshots

Each placeholder is a `<figure class="shot filled ...">` with a dashed
`Screenshot` image. Replace the `src` with your image, then set `width`,
`height` and `aspect-ratio` to its real size. `wide` suits a full screen
capture and `narrow` a small panel. The real guide embeds its images as
base64, so the page stays one file.

### The self-test

A worked example counts towards the self-test when it has `data-scored="1"` and
a question block (`<div class="qa hidden">`). Mark the right answer with
`data-correct="1"`. A card with neither is reference only.

When you change the number of scored questions, also update:

- `PASS_MARK` in the completion script, which sets how many correct answers pass
- `Three of three to pass` and `0 of 3` on the completion page
- `All 4` on the filter buttons and the line under the mode switch

### The checklist

Each step is a `<label>`. Give a new one the next `id="chkrow-cN"` and
`data-k="cN"`, and keep both unique. Update `0 of 5` in the bar above it.

## Building and deploying

Run from `authmats-process/`:

```
python3 mk.py blank/site-blank.html blank/preview-blank.html
python3 make_appsscript.py blank/site-blank.html blank/appsscript
```

The first gives you a page to open in a browser. The second gives you
`Code.gs`, `Index.html` and `appsscript.json` for a new Apps Script project.
Setup steps are at the top of `Code.gs`. The web app and its training record
sheet take their names from the page's `<title>`, so set that before the first
deploy.

The blank keeps its progress, ticks and completion under its own browser
storage keys, so it never mixes with the real guide's.
