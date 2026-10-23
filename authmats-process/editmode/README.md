# Live content editing

Lets staff who know a password change the wording of the guide from the
page itself. A saved change is live for everyone on their next page load.
Nothing needs redeploying.

## Files

| file | what it is |
|---|---|
| `edit-apply.js` | runs straight after the page markup: marks the editable blocks and applies the live edits before search or anything else reads the text |
| `edit-ui.js` | the Edit button, password dialog, in-place editing, list of changes, undo |
| `edit.css` | styles for the above, in the guide's own colours |
| `Code-edits.gs` | server side: password check, editing sessions, the change log, serving the page with edits written in |
| `integrate.py` | adds all of the above to a built `appsscript/` folder |
| `tests/server.test.js` | 43 checks of the server code, run in Node with stand-ins for the Google services |
| `tests/ui.test.js` | 53 checks of the interface in Chromium, with the server mocked in the page |
| `tests/template.test.js` | 30 checks of editing on a blank guide (see below) |

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
`make_blank.py`) is being written from the page, so more of it opens up:

- the page heading: title, subtitle, team name, summary and pills
- the labels on the cards in section 3
- the worked examples: group labels, titles, both halves of each case, the
  questions and the wording of each answer
- the Option A and Option B buttons
- the completion page's heading and notes

Wording repeated elsewhere follows the original: the title in the top bar
and on the sign-in screen, the team name, summary and pills on the sign-in
screen, each section heading in the contents bar, and each example group on
its filter button.

Which answer is right is still fixed in the markup, so an edit changes the
wording of an answer but never which one scores. The completion
requirements, the training record, build line and anything the page counts
stay locked, as do adding or removing sections, rows, cards and
screenshots. Those go through the file.

```
node editmode/tests/template.test.js blank/appsscript/Index.html
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
