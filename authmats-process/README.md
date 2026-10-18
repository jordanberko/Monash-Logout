# Authorised Materials QC

A single-file HTML training document for the Monash University Exam Delivery
Team, served as a Google Apps Script web app.

## Layout

| path | what it is |
|---|---|
| `site-e.html` | **the source.** All edits are made here. Since October 2026 it follows Kayla's section order and Kate and Kayla's feedback. |
| `build.py` | builds the deployable `Index.html`, `Code.gs` and `appsscript.json` from the source, with live editing added |
| `editmode/` | live content editing; see `editmode/README.md` |
| `proposals/` | `site-current-order.html`: the same feedback in the old section order, kept for reference and never deployed |
| `mk.py` | wraps the source into a standalone `variant-e.html` for preview and testing |
| `make_appsscript.py` | builds `appsscript/Index.html` and stamps the build id |
| `variant-e.html` | generated preview build — do not edit |
| `appsscript/` | generated Apps Script deployment files — do not edit `Index.html` by hand |
| `baseline/` | the pre-restyle source and its content snapshot, used to prove content preservation |
| `verify/` | the Playwright and Python checks described in `docs/wispr-restyle-notes.md` |
| `shots/` | preview screenshots from the current styling pass |
| `docs/` | editor notes, the decision list, and the restyle notes |

## Building

The deployed build comes from `build.py`:

```
python3 build.py site-e.html OUT_DIR CODE_GS   # -> OUT_DIR/Index.html, Code.gs, appsscript.json
```

`CODE_GS` is the `Code.gs` currently deployed in the Apps Script project. It is not
kept here because it names the owner's account. Its `SUPPORTED_VERSIONS` must include
the page's `COURSE_VERSION`, or the page shows "Update needed".

For a preview without the Apps Script wrapper:

```
python3 mk.py               # -> variant-e.html
python3 make_appsscript.py  # -> appsscript/Index.html + Code.gs (older template)
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
