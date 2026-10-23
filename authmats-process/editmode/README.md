# Live content editing

Lets staff who know a password change the wording of the guide from the
page itself. A saved change is live for everyone on their next page load.
Nothing needs redeploying.

## Files

| file | what it is |
|---|---|
| `edit-apply.js` | runs straight after the page markup: marks the editable blocks and applies the live edits before search or anything else reads the text |
| `edit-ui.js` | the Edit button, password dialog, in-place editing, list of changes, undo |
| `edit-arrange.js` | blank guides only: dragging, adding, duplicating, deleting and restyling blocks, sections and screenshots |
| `edit.css` | styles for the above, in the guide's own colours |
| `Code-edits.gs` | server side: password check, editing sessions, the change log, serving the page with edits written in |
| `integrate.py` | adds all of the above to a built `appsscript/` folder |
| `tests/server.test.js` | 43 checks of the server code, run in Node with stand-ins for the Google services |
| `tests/ui.test.js` | 53 checks of the interface in Chromium, with the server mocked in the page |
| `tests/template.test.js` | 30 checks of editing wording on a blank guide (see below) |
| `tests/arrange.test.js` | 53 checks of arranging a blank guide in Chromium: drag and drop, menus, sections, screenshots, undo, conflicts, reloading |
| `tests/server-template.test.js` | 35 checks of the server side of arranging: whole-section saves, conflicts, undo, section order, screenshots |

## Building

```
python3 make_appsscript.py                                  # the normal build
python3 editmode/integrate.py appsscript appsscript-edit    # the same build with editing
node editmode/tests/server.test.js appsscript-edit/Code.gs
node editmode/tests/ui.test.js appsscript-edit/Index.html
```

Deploy the three files in `appsscript-edit/` as usual.

## Switching it on

In the Apps Script editor: **Project Settings > Script Properties > Add
script property**, name `EDIT_PASSWORD`, value the password. To change the
password, edit the value; anyone mid-edit is asked for the new one when they
next save. Delete the property to switch editing off; the live edits stay.

## How it behaves

- **Edit this guide** sits at the foot of the Contents panel and next to the
  build line at the end of the guide. Anyone can see it; it asks for a name
  and the password.
- Once unlocked, selecting any text block makes it editable. Save, Cancel,
  Bold and Restore original sit above it. Ctrl+Enter saves, Escape cancels.
  Pasting brings plain text only.
- **Changes** lists every block currently changed, who changed it and when,
  with Show and Restore original.
- **Finish editing** locks it again. An unlock otherwise lasts three hours.

## What cannot be edited from the page

The self-test (questions, answers and the worked examples they come from),
the completion page and its requirements, the section structure and
navigation, section numbers and stage labels, the checklist acknowledgement,
and anything the page builds itself. Those still go through the build.

## Blank guides

A page whose `<main>` carries `data-edit-template` (the blank guide made by
`make_blank.py`) is written from the page, so editing goes further.

**Wording.** Everything with a placeholder in it can be changed: the page
heading (title, subtitle, team name, summary and pills), card labels, the
worked examples with their questions and answers, the Option A and Option B
buttons, and the completion page's heading and notes. Wording repeated
elsewhere follows the original: the title in the top bar and on the
sign-in screen, the sign-in screen's team name, summary and pills, each
section heading in the contents bar, and each example group on its filter
button.

**Arranging** (`edit-arrange.js`). Blocks can be dragged anywhere, moved up
and down, duplicated, deleted, restyled between paragraph, subheading, note
and key point, and added from a palette of the guide's own parts. Rows,
steps, cards, examples, checklist steps, pills and answers move among their
own kind. Tables take and lose columns. Screenshot frames take an upload.
Sections can be added, moved and deleted. Which answer is right, and
whether an example is part of the self-test, are set from the example's
own controls. The controls the page's scripts drive (the option switch, the
self-test bar, the filters, the checklist bar) can be moved but not deleted
on their own; they go with the examples or checklist they belong to, or
with their section.

**How it is saved.** Each section, and the page heading, is saved whole as
`<id>:all`, and `page:layout` holds the order of the sections. Every save
names the version it started from and is refused (`stale`) if someone else
saved that section since, so two editors never overwrite each other. Undo
steps a section back one save (`back` in the log) and is refused if the
section has moved on since. A section saved whole supersedes any older
single-block edits to it.

The page keeps a clean copy of each section, taken before the page's own
scripts run. Every change is made to that copy, the section is redrawn from
it, and the copy is what is saved, so nothing the scripts add at run time
(the rebuilt self-test, numbering, classes) ends up in a save. Each viewer
cleans a saved section again before it reaches the page: the guide's own
structure, classes and data attributes survive; scripts, handlers, styles
beyond a short list of properties, and links other than `#` and `https:`
do not. The server refuses anything that could run code before it is
stored.

**Screenshots.** The page resizes an upload to at most 1600 pixels wide
and sends it as WebP (JPEG where WebP is not available). The server stores
it in a `<title> - Images` folder in the owner's Drive and the saved section
refers to it by file id. When the page is served, the images the live
sections use are written in as data URLs, cached for six hours. Only files
in that folder are ever read, so a saved section cannot pull any other file
from the owner's Drive into the page.

**Safety net.** A blank guide can lose any section, the self-test and
checklist included. Hidden stand-ins take the place of any controls the
page's scripts expect, and the completion page asks only for the parts the
guide still has. The pass mark is 85% of however many questions there are.

**Limits.** A section can hold about 45,000 characters of markup, which is
far more than the blank's sections use. Sections redrawn while editing are
not wired up by the page's scripts until the page is reloaded; finishing
editing says so. Arranging is built for a mouse.

```
node editmode/tests/template.test.js blank/appsscript/Index.html
node editmode/tests/arrange.test.js blank/appsscript/Index.html
node editmode/tests/server-template.test.js blank/appsscript/Code.gs
```

## Where changes are kept

A spreadsheet named after the guide, **Authorised Materials QC - Content
edits** for this one, in the script owner's Drive, created on the first save. One row per save or undo:
when, which block, the wording before and after, the name given, the Monash
account when Google provides it, and whether it was an edit or an undo.
Nothing is ever deleted from it.

## Safeguards

- The password is only ever compared on the server. The page never sees it,
  and the browser keeps only a session token.
- Five wrong attempts lock that account (or anonymous visitors) out for 15
  minutes.
- Edits are text with simple formatting (bold, italic, code, the column
  chips, links). The server refuses anything containing script, frames,
  images or event handlers, and every viewer's page cleans each edit again
  before showing it.
- Text a spreadsheet would read as a formula is stored as plain text.
- If the change log cannot be read, the guide loads with its original
  wording rather than failing.

## Limits worth knowing

- Edits are not tested or reviewed before they go live. Anyone with the
  password can change a rule for everyone at once.
- People who completed the training before a change are not asked to redo
  it. A rule change that matters should also go through the build with a
  new course version.
- Each edit is tied to the wording it replaced. If a later build changes
  that block's original wording, the edit stops showing and appears under
  Changes as no longer matching. Fold approved edits into `site-e.html`
  when rebuilding, then use Remove on them.
