# Blank guide

The Authorised Materials QC guide with all of its content taken out. The design,
layout and behaviour are the same: sign-in screen, sticky contents bar, search,
light and dark themes, worked examples with a self-test, the checklist, and the
completion page with the shared training record. Every piece of wording is a
placeholder that says what belongs there.

Once deployed, people with the edit password can fill it in from the page
itself. See **Editing from the page** below.

| file | what it is |
|---|---|
| `site-blank.html` | **the source.** Fill this in. |
| `preview-blank.html` | built from the source, for opening in a browser. Do not edit. |
| `appsscript/` | built Apps Script files with live editing included, for deploying as its own web app. Do not edit by hand. |

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

## Editing from the page

The deployed blank has live editing built in, so people can write the whole
guide from the page without touching this file. Anyone with the edit
password can:

- **change any wording** by clicking it: headings, text, table cells, card
  labels, the page title and team name, the worked examples and their
  questions and answers, the Option A and Option B buttons, and the
  completion page
- **move things** by dragging the handle (⠿) beside a block, anywhere in
  the guide, or with Move up and Move down in its menu. Rows, steps, cards,
  examples, checklist steps and answers have their own handle and move
  among their own kind
- **add things**: **+ Add a block** at the foot of each section, or **+**
  beside any block, offers paragraphs, subheadings, lists, steps, notes, key
  points, tables, screenshots, cards, numbered points and item lists.
  Duplicate copies any row, step, card, example, checklist step or answer
- **delete things**, with **Undo** on the editing bar to bring them back
- **restyle a block**: switch between paragraph, subheading, note and key
  point. Fonts and colours stay the guide's own, on purpose
- **change tables**: add a column or remove the last one
- **add screenshots**: **Replace image** on any screenshot frame uploads a
  picture, resized to a sensible size first
- **arrange sections**: hover over a section heading to move it, add a new
  section after it, or delete it. Numbers and the contents bar follow
- **set up the self-test**: add or remove a question on any example, add
  answers, and choose which answer is right

To switch it on, open the Apps Script project, go to **Project Settings >
Script Properties > Add script property**, and add `EDIT_PASSWORD` with the
password as its value. Then on the page, scroll to the very end and select
**Edit this guide**.

Saved changes go live for everyone on their next page load. Every change is
logged with the editor's name in a sheet called `<title> - Content edits`,
and screenshots go to a folder called `<title> - Images`, both in the
script owner's Drive. **Changes** on the page lists what has changed, with
Undo last change and a way to put any section back the way it was built.
`editmode/README.md` has the full detail.

Worth knowing:

- Each section is saved whole. If two people change the same section at
  once, the second save is refused with a message, and they see the other
  person's version so they can make their change again.
- The self-test, checklist and option buttons are wired up when the page
  loads, so after rearranging them, reload the page to try them.
- Deleting the worked examples or the checklist is fine: the completion
  page then asks only for what the guide still has.
- What has been written on the page lives in the edits sheet, not in
  `site-blank.html`. A section changed on the page keeps showing the page
  version even if the file is rebuilt and redeployed.
- Tested in Chrome. Arranging is designed for a computer with a mouse; on a
  phone, changing wording works but dragging is fiddly.

## Building and deploying

Run from `authmats-process/`:

```
python3 mk.py blank/site-blank.html blank/preview-blank.html
python3 make_appsscript.py blank/site-blank.html blank/build
python3 editmode/integrate.py blank/build blank/appsscript
```

The first gives you a page to open in a browser. The other two give you
`Code.gs`, `Index.html` and `appsscript.json` in `blank/appsscript/`, with
editing included, for a new Apps Script project. Setup steps are at the top
of `Code.gs`. The web app, its training record sheet and its edits log take
their names from the page's `<title>`, so set that before the first deploy.
`blank/build/` is a scratch folder and is not committed.

To check the editing on the blank:

```
node editmode/tests/template.test.js blank/appsscript/Index.html
node editmode/tests/server.test.js blank/appsscript/Code.gs
```

The blank keeps its progress, ticks and completion under its own browser
storage keys, so it never mixes with the real guide's.
