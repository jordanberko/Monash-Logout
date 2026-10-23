# Authorised Materials QC

A single-file HTML training document for the Monash University Exam Delivery
Team, served as a Google Apps Script web app.

## Layout

| path | what it is |
|---|---|
| `site-e.html` | **the source.** All edits are made here. |
| `mk.py` | wraps the source into a standalone `variant-e.html` for preview and testing |
| `make_appsscript.py` | builds `appsscript/Index.html` and stamps the build id |
| `variant-e.html` | generated preview build — do not edit |
| `appsscript/` | generated Apps Script deployment files — do not edit `Index.html` by hand |
| `make_blank.py` | makes `blank/site-blank.html`: this guide's design and layout with no content |
| `blank/` | the blank guide, for writing a new guide in the same format. See `blank/README.md` |
| `baseline/` | the pre-restyle source and its content snapshot, used to prove content preservation |
| `verify/` | the Playwright and Python checks described in `docs/wispr-restyle-notes.md` |
| `shots/` | preview screenshots from the current styling pass |
| `docs/` | editor notes, the decision list, and the restyle notes |

## Building

```
python3 mk.py               # -> variant-e.html
python3 make_appsscript.py  # -> appsscript/Index.html + Code.gs
```

Both take a source and an output path, which is how the blank guide is built:

```
python3 mk.py blank/site-blank.html blank/preview-blank.html
python3 make_appsscript.py blank/site-blank.html blank/appsscript
```

## Checking

Run from this directory, with `variant-e.html` already built:

```
node verify/snap.js variant-e.html /tmp/snap.json   # content snapshot
T=variant-e.html THEME=light node verify/contrast.js
node verify/flows6.js      # interactive flows
node verify/quizqa.js      # scoring and the assessment store
node verify/searchqa.js    # search landings
node verify/wresp.js       # four widths, both themes
node verify/gasmock.js     # Apps Script paths, mocked
```

`verify/gasmock.js` mocks `google.script.run` in-page. It exercises the read
paths only and never calls `addTrainingRecord`, so it cannot submit a
training record.

Nothing here deploys. Publishing `appsscript/Index.html` to the live web app
is a separate, manual step.
