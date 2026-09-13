"""Transform site.html into an Apps Script Index.html, plus write Code.gs."""
import re, pathlib

OUT = pathlib.Path("/home/user/authmats-process/appsscript")
OUT.mkdir(exist_ok=True)
src = pathlib.Path("/home/user/authmats-process/site-e.html").read_text()

# Split head material (title, style) from the body markup. Split on the end of
# the stylesheet, not on a markup landmark: the page's first element has moved
# before now, and splitting on it silently pushed the whole header into <head>.
k = src.index('</style>') + len('</style>')
head, body = src[:k], src[k:]

# The artifact host supplied a small reset. Apps Script does not, so add it.
RESET = """
html{-webkit-text-size-adjust:100%}
body{margin:0}
img{max-width:100%;height:auto;display:block}
[hidden]{display:none !important}
"""

head = head.replace("</style>", RESET + "</style>")

# Stamp the build so a deployed page can be identified without reading source.
import datetime, hashlib
BUILD = "Build %s.%s" % (
    datetime.date.today().strftime("%Y-%m-%d"),
    hashlib.sha1(src.encode()).hexdigest()[:6],
)
body = body.replace("@@BUILD@@", BUILD)

# Apps Script strips a viewport meta from the file, so Code.gs adds it via addMetaTag.
DOCTYPE = """<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
"""

# Config block plus the swap-in logic for screenshots.
SHOTS_JS = """
<script>
/* ---------------------------------------------------------------------------
   SCREENSHOTS
   ---------------------------------------------------------------------------
   To add a screenshot:
     1. Upload the image to a Drive folder the same people can open.
     2. Share that folder with the same audience as this web app.
     3. Copy the file ID out of the Drive link. In
        https://drive.google.com/file/d/1AbC...XyZ/view
        the ID is the part between /d/ and /view.
     4. Paste it between the quotes below, against the matching SS number.
   Leave an entry empty and its dashed placeholder stays on the page.
--------------------------------------------------------------------------- */
var SHOTS = {
  "SS-01": "",
  "SS-02": "",
  "SS-03": "",
  "SS-04": "",
  "SS-05": "",
  "SS-06": "",
  "SS-07": "",
  "SS-08": "",
  "SS-09": "",
  "SS-10": "",
  "SS-11": "",
  "SS-12": "",
  "SS-13": "",
  "SS-14": "",
  "SS-15": "",
  "SS-16": "",
  "SS-17": "",
  "SS-18": "",
  "SS-19": "",
  "SS-20": ""
};

(function(){
  "use strict";
  var slots = [].slice.call(document.querySelectorAll(".shot"));
  slots.forEach(function(slot){
    var refEl = slot.querySelector(".ref");
    var capEl = slot.querySelector("p");
    if(!refEl || !capEl) return;
    var ref = refEl.textContent.trim();
    var id = (SHOTS[ref] || "").trim();
    if(!id) return;

    var fig = document.createElement("figure");
    fig.className = "shot filled";
    fig.style.margin = "12px 0 0";

    var img = document.createElement("img");
    img.src = "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w1600";
    img.alt = ref + ". " + capEl.textContent.trim();
    img.loading = "lazy";
    /* If the image cannot load, fall back to the dashed placeholder rather
       than leaving a broken frame on the page. */
    img.addEventListener("error", function(){
      if(fig.parentNode) fig.parentNode.replaceChild(slot, fig);
    });

    var cap = document.createElement("figcaption");
    var r = document.createElement("span");
    r.className = "ref";
    r.textContent = ref;
    var t = document.createElement("span");
    t.textContent = capEl.textContent.trim();
    cap.appendChild(r);
    cap.appendChild(t);

    fig.appendChild(img);
    fig.appendChild(cap);
    slot.parentNode.replaceChild(fig, slot);
  });
})();
</script>
"""

index = DOCTYPE + head + "</head>\n<body>\n" + body.strip() + "\n" + SHOTS_JS + "\n</body>\n</html>\n"

# Guard the split: nothing but title/style may sit above <body>.
_head_part = index[:index.index("</head>")]
for _tag in ("<header", "<div", "<main", "<section"):
    assert _tag not in _head_part, "markup leaked into <head>: " + _tag
assert index.index("<header class=\"rail\"") > index.index("<body>"), "header must be in <body>"

(OUT / "Index.html").write_text(index)

CODE_GS = """/**
 * Authorised Materials QC
 * Exam Delivery Team process reference, served as a Google Apps Script web app.
 *
 * SETUP
 *   1. script.google.com, New project.
 *   2. Rename the project to "Authorised Materials QC".
 *   3. Replace the contents of Code.gs with this file.
 *   4. Add an HTML file: the + next to Files, HTML, name it exactly "Index".
 *      Replace its contents with Index.html from this folder.
 *   5. Save.
 *
 * DEPLOY
 *   Deploy, New deployment, gear icon, Web app.
 *     Description      Authorised Materials QC
 *     Execute as       Me
 *     Who has access   Anyone within Monash University
 *   Because it executes as you, viewers never see an authorisation prompt and
 *   never need access to the record spreadsheet.
 *
 * UPDATING
 *   Deploy, Manage deployments, pencil icon, Version: New version, Deploy.
 *   The URL stays the same.
 *
 * THE TRAINING RECORD
 *   The first time somebody adds their name, this script creates a spreadsheet
 *   called "Authorised Materials QC - Training Record" in your Drive and
 *   remembers its id. Nothing to set up. To point it at a sheet you already
 *   have, put its id in Script Properties under RECORD_SHEET_ID.
 */

var PAGE_TITLE = 'Authorised Materials QC';
var RECORD_SHEET_NAME = 'Authorised Materials QC - Training Record';
var PROP_KEY = 'RECORD_SHEET_ID';

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(PAGE_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    // ALLOWALL lets the page be embedded in a Google Site alongside the
    // Lookup Tool. Remove this line to block embedding.
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Who is looking at the page. Within the same Workspace domain this returns
 * the viewer's address; outside it, or if consent is missing, it returns
 * empty and the page asks for a name instead.
 */
function getViewer() {
  var email = '';
  try { email = Session.getActiveUser().getEmail() || ''; } catch (err) { email = ''; }
  return { email: email, name: nameFromEmail_(email) };
}

/** jordan.berkovich1@monash.edu -> Jordan Berkovich */
function nameFromEmail_(email) {
  if (!email) return '';
  var local = String(email).split('@')[0].replace(/\d+$/, '');
  var parts = local.split(/[._\-]+/);
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    out.push(parts[i].charAt(0).toUpperCase() + parts[i].slice(1).toLowerCase());
  }
  return out.join(' ');
}

/** The record sheet, created on first use. */
function recordSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_KEY);
  var ss;
  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
    } catch (err) {
      ss = null;                    // deleted or unreachable, make a new one
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(RECORD_SHEET_NAME);
    props.setProperty(PROP_KEY, ss.getId());
  }
  var sh = ss.getSheets()[0];
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Name', 'Completed', 'Recorded at', 'Account']);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Newest first. Name and date only: nothing else reaches the page. */
function getTrainingRecord() {
  var sh = recordSheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var rows = sh.getRange(2, 1, last - 1, 2).getValues();
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    out.push({ name: String(rows[i][0]), date: String(rows[i][1]) });
  }
  return out.reverse();
}

/**
 * Adds a completion, or refreshes the date if the person is already listed.
 *
 * The signed-in Google account is the record, not what the page sent. When an
 * account can be read the name is derived from it and the client's name is
 * discarded, so nobody can file a completion under someone else's name. Rows
 * with no readable account are written as unverified and say so in the sheet.
 *
 * Locked, because two people can finish at the same time.
 */
function addTrainingRecord(name, date) {
  var email = '';
  try { email = Session.getActiveUser().getEmail() || ''; } catch (err) { email = ''; }

  var verified = !!email;
  if (verified) {
    // Server wins. The page shows this same name, read-only.
    name = nameFromEmail_(email) || String(name || '').trim();
  }
  name = String(name || '').trim().slice(0, 60);
  if (!name) throw new Error('A name is required.');
  date = String(date || '').trim().slice(0, 40);
  var who = verified ? email : 'unverified (typed name)';

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = recordSheet_();
    var last = sh.getLastRow();

    // One row per account. Fall back to matching on name only when there is
    // no account to match on.
    var found = 0;
    if (last >= 2) {
      var rows = sh.getRange(2, 1, last - 1, 4).getValues();
      for (var i = 0; i < rows.length; i++) {
        var hit = verified
          ? String(rows[i][3]).trim().toLowerCase() === email.toLowerCase()
          : String(rows[i][0]).trim().toLowerCase() === name.toLowerCase();
        if (hit) { found = i + 2; break; }
      }
    }
    if (found) {
      sh.getRange(found, 1, 1, 4).setValues([[name, date, new Date(), who]]);
    } else {
      sh.appendRow([name, date, new Date(), who]);
    }
  } finally {
    lock.releaseLock();
  }
  return getTrainingRecord();
}
"""
(OUT / "Code.gs").write_text(CODE_GS)

MANIFEST = '''{
  "timeZone": "Australia/Melbourne",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "DOMAIN"
  }
}
'''
(OUT / "appsscript.json").write_text(MANIFEST)

print("Index.html", len(index), "chars")
for f in sorted(OUT.iterdir()):
    print(" ", f.name, f.stat().st_size)
