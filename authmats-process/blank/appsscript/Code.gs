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
  return HtmlService.createHtmlOutput(indexWithEdits_())
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

/* =====================================================================
 * Live content edits
 *
 * Staff who know the edit password can change the wording of the guide
 * from the page itself. A saved change is live for everyone on their next
 * page load; nothing needs redeploying.
 *
 * Setting it up
 *   Project Settings > Script Properties > Add script property
 *     EDIT_PASSWORD   the password editors will type
 *   Change it the same way. Anyone mid-edit is asked for the new one when
 *   they next save. Delete the property to switch editing off.
 *
 * Where changes go
 *   A spreadsheet named after the guide, "<title> - Content edits", created
 *   in the script owner's Drive on the first save. Every save and every
 *   undo is a row: when, which block, the wording before and after, the
 *   name the editor gave, their Monash account when Google provides it.
 *   The page shows the newest edit of each block; an undo row puts the
 *   original wording back.
 *
 * Safeguards
 *   - The password is compared here, never sent to the page.
 *   - Five wrong attempts lock editing for 15 minutes.
 *   - An unlock lasts 3 hours, and ends if the password changes.
 *   - Edits are text with simple formatting. Each viewer's page cleans an
 *     edit again before showing it, so no edit can add a script.
 *   - The self-test, the completion requirements and the section structure
 *     are not editable from the page.
 *
 * Blank guides (a page marked as a template) also save whole sections, so
 * blocks can be added, moved and deleted: one row holds a section's full
 * markup, and "page:layout" holds the order of the sections. A save names
 * the version it started from and is refused if someone else saved that
 * section in the meantime. Uploaded screenshots go to a Drive folder named
 * "<title> - Images" and are written into the page when it is served.
 * ===================================================================== */

var EDITS_SHEET_NAME   = PAGE_TITLE + ' - Content edits';   // PAGE_TITLE: the guide's Code.gs, above
var EDITS_PROP_KEY     = 'EDITS_SHEET_ID';
var EDIT_PASSWORD_KEY  = 'EDIT_PASSWORD';
var EDITS_HEADERS      = ['Saved at', 'Block', 'Section', 'Before', 'After', 'Edited by', 'Account', 'Action'];
var EDITS_CACHE_KEY    = 'amqc-live-edits-v1';
var EDIT_TOKEN_SECS    = 3 * 60 * 60;
var EDIT_MAX_FAILS     = 5;
var EDIT_LOCKOUT_SECS  = 15 * 60;
var EDIT_HTML_MAX      = 8000;
var LIVE_EDITS_MARKER  = '/*@@LIVE_EDITS@@*/null';
var EDIT_BLOCK_RE      = /^[A-Za-z0-9_-]{1,32}:[0-9a-f]{8}(:\d{1,3})?$/;
var EDIT_SECTION_RE    = /^[A-Za-z0-9_-]{1,32}$/;
var EDIT_TOKEN_RE      = /^[0-9a-f-]{36}$/;
/* only inside a tag, so ordinary wording ("data: 5", "onset =") is never refused */
var EDIT_UNSAFE_RE     = /<\s*\/?\s*(script|iframe|object|embed|style|link|meta|form|input|textarea|svg|math|img|base)\b|<[^>]*\son[a-z]+\s*=|<[^>]*(javascript|vbscript|data)\s*:/i;

/* blank guides: whole sections, the section order, and screenshots */
var EDIT_UNIT_RE       = /^(s\d{1,3}|mast):all$/;
var EDIT_LAYOUT_KEY    = 'page:layout';
var EDIT_UNIT_MAX      = 45000;          // a sheet cell holds 50,000 characters
/* a section carries its checklist boxes, buttons and screenshots, so those
   tags are allowed; anything that can run or load code still is not */
var EDIT_UNIT_UNSAFE_RE = /<\s*\/?\s*(script|iframe|frame|frameset|object|embed|applet|style|link|meta|form|textarea|select|svg|math|base|template|noscript)\b|<[^>]*\son[a-z]+\s*=|<[^>]*(javascript|vbscript)\s*:|<[^>]*\bdata\s*:(?!image\/)/i;
var LIVE_IMAGES_MARKER = '/*@@LIVE_IMAGES@@*/null';
var EDIT_IMAGES_PROP   = 'EDIT_IMAGES_FOLDER_ID';
var EDIT_IMAGE_MAX     = 4000000;        // base64 characters, about 3 MB
var EDIT_IMAGE_TYPES   = { 'image/png': 1, 'image/jpeg': 1, 'image/webp': 1, 'image/gif': 1 };
var EDIT_IMAGE_ID_RE   = /^[A-Za-z0-9_-]{10,100}$/;

function editKeyOk_(block) {
  return EDIT_BLOCK_RE.test(block) || EDIT_UNIT_RE.test(block) || block === EDIT_LAYOUT_KEY;
}

/** The page as served: the built Index with the live edits written in. */
function indexWithEdits_() {
  var html = HtmlService.createHtmlOutputFromFile('Index').getContent();
  /* a function, so a "$" in an edit is never read as a replacement pattern */
  var live = null;
  try { live = liveEdits_(); } catch (err) { live = null; }
  html = html.replace(LIVE_EDITS_MARKER, function () { return live ? pageJson_(live) : 'null'; });
  if (html.indexOf(LIVE_IMAGES_MARKER) > -1) {
    html = html.replace(LIVE_IMAGES_MARKER, function () {
      try { return live ? pageJson_(liveImages_(live)) : 'null'; } catch (err) { return 'null'; }
    });
  }
  return html;
}

/** JSON safe to sit inside a <script>. */
function pageJson_(v) {
  return JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}


/** The edits currently live, one per block: {block: {h, by, at}}.
    An edit row adds a version, an undo row clears every version, and a
    back row (blank guides only) steps back to the version before. */
function liveEdits_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get(EDITS_CACHE_KEY);
  if (hit) return JSON.parse(hit);
  var live = {}, versions = {};
  var sh = editsSheet_(false);
  if (sh && sh.getLastRow() > 1) {
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, EDITS_HEADERS.length).getValues();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], block = String(r[1] || ''), action = String(r[7]);
      if (!editKeyOk_(block)) continue;
      var stack = versions[block] || (versions[block] = []);
      if (action === 'edit') {
        stack.push({
          h: String(r[4] || ''),
          by: String(r[5] || ''),
          at: r[0] instanceof Date ? r[0].toISOString() : String(r[0] || '')
        });
      } else if (action === 'back') {
        stack.pop();
      } else {
        stack.length = 0;
      }
      if (stack.length) live[block] = stack[stack.length - 1];
      else delete live[block];
    }
  }
  var json = JSON.stringify(live);
  if (json.length < 90000) cache.put(EDITS_CACHE_KEY, json, 6 * 60 * 60);
  return live;
}

/** The log. Created on the first save, never on a page view. */
function editsSheet_(create) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(EDITS_PROP_KEY);
  var ss = null;
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (err) { ss = null; }
  }
  if (!ss) {
    if (!create) return null;
    ss = SpreadsheetApp.create(EDITS_SHEET_NAME);
    props.setProperty(EDITS_PROP_KEY, ss.getId());
  }
  var sh = ss.getSheets()[0];
  if (sh.getLastRow() === 0) {
    sh.appendRow(EDITS_HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function editAccount_() {
  try { return Session.getActiveUser().getEmail() || ''; } catch (err) { return ''; }
}

function editDigest_(s) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

/** Same length digests compared in full, so timing says nothing. */
function editSame_(a, b) {
  var x = editDigest_(a), y = editDigest_(b), d = 0;
  for (var i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0;
}

/** A spreadsheet reads a leading = + - @ as a formula. Keep everything text. */
function editCell_(s) {
  s = String(s == null ? '' : s);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** Password in, a three hour editing session out. */
function editUnlock(p) {
  p = p || {};
  var real = PropertiesService.getScriptProperties().getProperty(EDIT_PASSWORD_KEY);
  if (!real) return { ok: false, reason: 'not-set' };
  var cache = CacheService.getScriptCache();
  var account = editAccount_();
  var failKey = 'amqc-editfail:' + (account || 'anon');
  var fails = Number(cache.get(failKey) || 0);
  if (fails >= EDIT_MAX_FAILS) return { ok: false, reason: 'locked' };
  if (!editSame_(String(p.password || ''), real)) {
    cache.put(failKey, String(fails + 1), EDIT_LOCKOUT_SECS);
    return { ok: false, reason: fails + 1 >= EDIT_MAX_FAILS ? 'locked' : 'wrong', left: EDIT_MAX_FAILS - fails - 1 };
  }
  cache.remove(failKey);
  var token = Utilities.getUuid();
  cache.put('amqc-edittok:' + token, JSON.stringify({
    pw: editDigest_(real), account: account, name: String(p.name || '').slice(0, 60)
  }), EDIT_TOKEN_SECS);
  return { ok: true, token: token, ttl: EDIT_TOKEN_SECS, live: liveEdits_() };
}

/** The session behind a token, or null if it has ended or the password changed. */
function editSession_(token) {
  if (!EDIT_TOKEN_RE.test(String(token || ''))) return null;
  var raw = CacheService.getScriptCache().get('amqc-edittok:' + token);
  if (!raw) return null;
  var s = JSON.parse(raw);
  var real = PropertiesService.getScriptProperties().getProperty(EDIT_PASSWORD_KEY);
  if (!real || s.pw !== editDigest_(real)) return null;
  return s;
}

/** Append one row under the lock. With a base, the row is written only if
    the block's live version is still the one the editor started from, so
    two people saving the same section cannot overwrite each other. */
function editWrite_(row, base) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return false;
  try {
    if (base != null) {
      var cur = liveEdits_()[row[1]];
      if (String(base) !== (cur ? cur.at : '')) return 'stale';
    }
    editsSheet_(true).appendRow(row.map(editCell_));
    CacheService.getScriptCache().remove(EDITS_CACHE_KEY);
  } finally {
    lock.releaseLock();
  }
  return true;
}

/** Why an edit cannot be saved, or '' if it can. */
function editProblem_(block, section, after) {
  if (EDIT_BLOCK_RE.test(block)) {
    if (!EDIT_SECTION_RE.test(section) || block.split(':')[0] !== section) return 'invalid';
    if (after.length > EDIT_HTML_MAX) return 'too-long';
    if (EDIT_UNSAFE_RE.test(after)) return 'unsafe';
    if (!after.replace(/<[^>]*>/g, '').trim()) return 'invalid';
    return '';
  }
  if (EDIT_UNIT_RE.test(block)) {
    if (block.split(':')[0] !== section) return 'invalid';
    if (after.length > EDIT_UNIT_MAX) return 'too-long';
    if (EDIT_UNIT_UNSAFE_RE.test(after)) return 'unsafe';
    if (!after.trim()) return 'invalid';
    return '';
  }
  if (block === EDIT_LAYOUT_KEY) {
    if (section !== 'page') return 'invalid';
    var order;
    try { order = JSON.parse(after); } catch (err) { return 'invalid'; }
    if (!Array.isArray(order) || !order.length || order.length > 60) return 'invalid';
    var seen = {};
    for (var i = 0; i < order.length; i++) {
      if (typeof order[i] !== 'string' || !/^s\d{1,3}$/.test(order[i]) || seen[order[i]]) return 'invalid';
      seen[order[i]] = 1;
    }
    return '';
  }
  return 'invalid';
}

/** Save one block's new wording. Live for everyone on their next load. */
function saveContentEdit(p) {
  p = p || {};
  var s = editSession_(p.token);
  if (!s) return { ok: false, reason: 'expired' };
  var block = String(p.block || ''), section = String(p.section || ''), after = String(p.after || '');
  var problem = editProblem_(block, section, after);
  if (problem) return { ok: false, reason: problem };
  var name = String(p.name || s.name || '').slice(0, 60);
  var ok = editWrite_([new Date(), block, section, String(p.before || '').slice(0, 4000), after,
                       name, editAccount_() || s.account || '', 'edit'], p.base);
  if (ok === 'stale') return { ok: false, reason: 'stale', live: liveEdits_() };
  if (!ok) return { ok: false, reason: 'busy' };
  return { ok: true, live: liveEdits_() };
}

/** Put a block back to the wording it was built with. On a blank guide,
    step 'back' undoes only the latest save of a section or of the order,
    and only if it is still the latest. */
function revertContentEdit(p) {
  p = p || {};
  var s = editSession_(p.token);
  if (!s) return { ok: false, reason: 'expired' };
  var block = String(p.block || '');
  if (!editKeyOk_(block)) return { ok: false, reason: 'invalid' };
  var back = p.step === 'back';
  if (back && EDIT_BLOCK_RE.test(block)) return { ok: false, reason: 'invalid' };
  var name = String(p.name || s.name || '').slice(0, 60);
  var ok = editWrite_([new Date(), block, block.split(':')[0], '', '', name,
                       editAccount_() || s.account || '', back ? 'back' : 'undo'], back ? String(p.base || '') : null);
  if (ok === 'stale') return { ok: false, reason: 'stale', live: liveEdits_() };
  if (!ok) return { ok: false, reason: 'busy' };
  return { ok: true, live: liveEdits_() };
}

/* ---- screenshots on a blank guide ------------------------------------ */

/** The folder uploads go to, created on the first upload. */
function editImagesFolder_(create) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(EDIT_IMAGES_PROP);
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (err) { /* deleted: make another */ }
  }
  if (!create) return null;
  var folder = DriveApp.createFolder(PAGE_TITLE + ' - Images');
  props.setProperty(EDIT_IMAGES_PROP, folder.getId());
  return folder;
}

/** Only a file in the images folder is ever read, so a section cannot be
    made to pull any other file from the owner's Drive into the page. */
function editImageData_(id, folderId) {
  if (!EDIT_IMAGE_ID_RE.test(id)) return null;
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get('amqc-img:' + id) || 0);
  if (n > 0) {
    var keys = [];
    for (var i = 0; i < n; i++) keys.push('amqc-img:' + id + ':' + i);
    var parts = cache.getAll(keys), out = '';
    for (var j = 0; j < n; j++) {
      if (parts[keys[j]] == null) { out = null; break; }
      out += parts[keys[j]];
    }
    if (out) return out;
  }
  var file;
  try { file = DriveApp.getFileById(id); } catch (err) { return null; }
  var inFolder = false, parents = file.getParents();
  while (parents.hasNext()) { if (parents.next().getId() === folderId) { inFolder = true; break; } }
  if (!inFolder) return null;
  var blob = file.getBlob(), type = blob.getContentType();
  if (!EDIT_IMAGE_TYPES[type]) return null;
  var url = 'data:' + type + ';base64,' + Utilities.base64Encode(blob.getBytes());
  var chunks = {}, size = 90000, count = Math.ceil(url.length / size);
  for (var k = 0; k < count; k++) chunks['amqc-img:' + id + ':' + k] = url.slice(k * size, (k + 1) * size);
  try {
    cache.putAll(chunks, 6 * 60 * 60);
    cache.put('amqc-img:' + id, String(count), 6 * 60 * 60);
  } catch (err) { /* too big to cache: read it from Drive next time */ }
  return url;
}

/** {fileId: data URL} for every screenshot the live sections use. */
function liveImages_(live) {
  var ids = {}, re = /data-img="([A-Za-z0-9_-]{10,100})"/g, m;
  Object.keys(live || {}).forEach(function (k) {
    if (!EDIT_UNIT_RE.test(k)) return;
    while ((m = re.exec(live[k].h))) ids[m[1]] = 1;
  });
  var list = Object.keys(ids);
  if (!list.length) return {};
  var folder = editImagesFolder_(false);
  if (!folder) return {};
  var folderId = folder.getId(), out = {};
  list.forEach(function (id) {
    try { var url = editImageData_(id, folderId); if (url) out[id] = url; } catch (err) {}
  });
  return out;
}

/** Store an uploaded screenshot. The page has already resized it. */
function uploadEditImage(p) {
  p = p || {};
  var s = editSession_(p.token);
  if (!s) return { ok: false, reason: 'expired' };
  var type = String(p.type || ''), data = String(p.data || '');
  if (!EDIT_IMAGE_TYPES[type] || !data || !/^[A-Za-z0-9+\/=]+$/.test(data)) return { ok: false, reason: 'invalid' };
  if (data.length > EDIT_IMAGE_MAX) return { ok: false, reason: 'too-long' };
  var ext = type.split('/')[1].replace('jpeg', 'jpg');
  var name = String(p.name || 'Screenshot').replace(/[^\w .()-]/g, '').slice(0, 80) || 'Screenshot';
  var blob = Utilities.newBlob(Utilities.base64Decode(data), type, name.replace(/\.[a-z0-9]+$/i, '') + '.' + ext);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, reason: 'busy' };
  var file;
  try {
    file = editImagesFolder_(true).createFile(blob);
  } finally {
    lock.releaseLock();
  }
  var who = String(p.editor || s.name || '').slice(0, 60);
  editWrite_([new Date(), 'image', '', name, file.getId(), who, editAccount_() || s.account || '', 'image']);
  return { ok: true, id: file.getId(), src: 'data:' + type + ';base64,' + data };
}
