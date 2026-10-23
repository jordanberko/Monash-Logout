/**
 * Guide title
 * Exam Delivery Team process reference, served as a Google Apps Script web app.
 *
 * SETUP
 *   1. script.google.com, New project.
 *   2. Rename the project to "Guide title".
 *   3. Replace the contents of Code.gs with this file.
 *   4. Add an HTML file: the + next to Files, HTML, name it exactly "Index".
 *      Replace its contents with Index.html from this folder.
 *   5. Save.
 *
 * DEPLOY
 *   Deploy, New deployment, gear icon, Web app.
 *     Description      Guide title
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
 *   called "Guide title - Training Record" in your Drive and
 *   remembers its id. Nothing to set up. To point it at a sheet you already
 *   have, put its id in Script Properties under RECORD_SHEET_ID.
 */

var PAGE_TITLE = 'Guide title';
var RECORD_SHEET_NAME = 'Guide title - Training Record';
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
