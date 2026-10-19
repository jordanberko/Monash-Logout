/* Runs the built Code.gs in Node against in-memory stand-ins for the Apps
   Script services. Nothing reaches Google: no sheet is created, no property
   is set anywhere but in this process.

     node editmode/tests/server.test.js [path/to/Code.gs]                 */
const fs = require('fs'), vm = require('vm'), crypto = require('crypto'), path = require('path');
const CODE = process.argv[2] || path.join(__dirname, '..', 'build-snapshot', 'Code.gs');

const fails = []; let n = 0;
function ck(label, got, want){
  n++;
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? '  ok   ' : '  FAIL ') + label + (ok ? '' : '  got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)));
  if(!ok) fails.push(label);
}
const ckt = (l, c) => ck(l, !!c, true);

function world(opts){
  opts = opts || {};
  const props = {}, cache = {}, sheets = {}; let created = 0, nextId = 1, email = 'kate.wrathall@monash.edu';
  /* Apps Script holds spreadsheet writes back and sends them in batches, so
     a read through a second openById can miss a row appended moments ago.
     With batched set, an appended row is only readable after
     SpreadsheetApp.flush() or once the server call has finished. */
  const pending = [];
  const commit = () => { while(pending.length) pending.shift()(); };
  const INDEX = '<html><body><main>x</main><script>var LIVE = "@@LIVE_EDITS@@";</script></body></html>';
  function sheet(){
    const rows = [];
    return {
      rows,
      appendRow(r){
        const add = () => rows.push(r.map(v => (typeof v === 'string' && v[0] === "'") ? v.slice(1) : v));
        if(opts.batched) pending.push(add); else add();
        this.raw.push(r);
      },
      raw: [],
      getLastRow(){ return rows.length; },
      setFrozenRows(){},
      getRange(r, c, nr, nc){ return { getValues: () => rows.slice(r - 1, r - 1 + nr).map(x => x.slice(c - 1, c - 1 + nc)) }; }
    };
  }
  function output(content){
    const o = { content, setTitle(){ return o; }, addMetaTag(){ return o; }, setXFrameOptionsMode(){ return o; },
                setSandboxMode(){ return o; }, getContent(){ return content; } };
    return o;
  }
  const g = {
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (k in props ? props[k] : null),
      setProperty: (k, v) => { props[k] = String(v); },
      deleteProperty: k => { delete props[k]; } }) },
    CacheService: { getScriptCache: () => ({
      get: k => (k in cache ? cache[k] : null),
      put: (k, v) => { cache[k] = String(v); },
      remove: k => { delete cache[k]; } }) },
    SpreadsheetApp: {
      create(name){ created++; const id = 'ss' + (nextId++); const s = sheet(); sheets[id] = s;
        return { getId: () => id, getSheets: () => [s] }; },
      openById(id){ if(!sheets[id]) throw new Error('gone'); return { getId: () => id, getSheets: () => [sheets[id]] }; },
      flush: commit
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock(){}, releaseLock(){} }) },
    Session: { getActiveUser: () => ({ getEmail: () => email }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest(alg, s){ return [...crypto.createHash('sha256').update(String(s), 'utf8').digest()].map(b => b > 127 ? b - 256 : b); },
      getUuid: () => crypto.randomUUID()
    },
    HtmlService: {
      createHtmlOutputFromFile: () => output(INDEX),
      createHtmlOutput: c => output(c),
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL', DEFAULT: 'DEFAULT' },
      SandboxMode: { IFRAME: 'IFRAME' }
    },
    console
  };
  vm.createContext(g);
  vm.runInContext(fs.readFileSync(CODE, 'utf8'), g, { filename: 'Code.gs' });
  /* each server call is its own execution: whatever it left pending is written when it ends */
  const ended = fn => function(){ try { return fn.apply(this, arguments); } finally { commit(); } };
  ['doGet', 'getLiveEdits', 'editUnlock', 'saveContentEdit', 'revertContentEdit'].forEach(k => { if(g[k]) g[k] = ended(g[k]); });
  return { g, props, cache, sheets, created: () => created, setEmail: e => { email = e; } };
}
const page = w => w.g.doGet({}).getContent();
const liveIn = html => { const m = html.match(/var LIVE = (.*?);<\/script>/); return m ? m[1] : null; };

console.log('\n1. before anything is set up');
{
  const w = world();
  ck('the page is served with an empty set of edits', liveIn(page(w)), '{}');
  ck('and serving it creates no spreadsheet', w.created(), 0);
  ck('unlocking says editing is not switched on', w.g.editUnlock({ password: 'x', name: 'Kate' }).reason, 'not-set');
}

console.log('\n2. the password');
{
  const w = world(); w.props.EDIT_PASSWORD = 'Correct Horse 7';
  const r = [1, 2, 3, 4].map(() => w.g.editUnlock({ password: 'nope', name: 'Kate' }));
  ck('wrong attempts count down', r.map(x => [x.reason, x.left]), [['wrong', 4], ['wrong', 3], ['wrong', 2], ['wrong', 1]]);
  ck('the fifth wrong attempt locks editing', w.g.editUnlock({ password: 'nope' }).reason, 'locked');
  ck('and the right password is refused while locked', w.g.editUnlock({ password: 'Correct Horse 7' }).reason, 'locked');
  w.setEmail('kayla.sgambellone@monash.edu');
  ck('the lock is per account, so someone else can still unlock', w.g.editUnlock({ password: 'Correct Horse 7', name: 'Kayla' }).ok, true);
  const u = w.g.editUnlock({ password: 'Correct Horse 7', name: 'Kayla' });
  ckt('a correct password returns a session token', /^[0-9a-f-]{36}$/.test(u.token));
  ck('that lasts three hours', u.ttl, 10800);
  ckt('the password itself is not stored with the session', !Object.values(w.cache).some(v => v.includes('Correct Horse 7')));
  ckt('and is never returned to the page', !JSON.stringify(u).includes('Correct Horse 7'));
}

console.log('\n3. saving');
{
  const w = world(); w.props.EDIT_PASSWORD = 'pw';
  const t = w.g.editUnlock({ password: 'pw', name: 'Kate Wrathall' }).token;
  const base = { token: t, block: 's5:1a2b3c4d', section: 's5', before: 'Old words', name: 'Kate Wrathall' };
  ck('a save without a session is refused', w.g.saveContentEdit(Object.assign({}, base, { token: 'x', after: 'New' })).reason, 'expired');
  ck('a made-up session is refused', w.g.saveContentEdit(Object.assign({}, base, { token: crypto.randomUUID(), after: 'New' })).reason, 'expired');
  const s = w.g.saveContentEdit(Object.assign({}, base, { after: 'New <b>words</b> with <span class="col">col F</span>' }));
  ck('a save succeeds', s.ok, true);
  ck('and comes back in the live set', s.live['s5:1a2b3c4d'].h, 'New <b>words</b> with <span class="col">col F</span>');
  ck('with who made it', s.live['s5:1a2b3c4d'].by, 'Kate Wrathall');
  ck('the first save creates the log', w.created(), 1);
  const sh = Object.values(w.sheets)[0];
  ck('which has the header row and one change', sh.rows.length, 2);
  ck('recording before, after, name, account and action',
     sh.rows[1].slice(1), ['s5:1a2b3c4d', 's5', 'Old words', 'New <b>words</b> with <span class="col">col F</span>', 'Kate Wrathall', 'kate.wrathall@monash.edu', 'edit']);
  const served = liveIn(page(w));
  ckt('the next page load carries the edit', served.includes('s5:1a2b3c4d'));
  ckt('with every < escaped, so it cannot close the script it sits in', !served.includes('<') && served.includes('\\u003cb>'));
  ck('and it parses back to the same edit', JSON.parse(served)['s5:1a2b3c4d'].h, 'New <b>words</b> with <span class="col">col F</span>');

  w.g.saveContentEdit(Object.assign({}, base, { after: 'Newer still' }));
  ck('a second save to the same block replaces it', w.g.doGet({}) && JSON.parse(liveIn(page(w)))['s5:1a2b3c4d'].h, 'Newer still');
  const dollar = w.g.saveContentEdit(Object.assign({}, base, { block: 's5:00000001', after: 'Costs $& and $1 and $$' }));
  ck('dollar signs survive being written into the page', JSON.parse(liveIn(page(w)))['s5:00000001'].h, 'Costs $& and $1 and $$');
  ckt('(save ok)', dollar.ok);
}

console.log('\n4. what a save may contain');
{
  const w = world(); w.props.EDIT_PASSWORD = 'pw';
  const t = w.g.editUnlock({ password: 'pw', name: 'K' }).token;
  const save = (after, extra) => w.g.saveContentEdit(Object.assign({ token: t, block: 's7:aaaaaaaa', section: 's7', after }, extra || {}));
  ck('a script is refused', save('Hi <script>alert(1)</script>').reason, 'unsafe');
  ck('an event handler is refused', save('<b onclick="x()">Hi</b>').reason, 'unsafe');
  ck('an image is refused', save('<img src=x>').reason, 'unsafe');
  ck('a javascript: link is refused', save('<a href="javascript:alert(1)">x</a>').reason, 'unsafe');
  ck('ordinary wording that looks similar is accepted', save('Working sheets data: 5. Onset = 3 minutes. Use javascript: no.').ok, true);
  ck('an empty block is refused', save('<b> </b>').reason, 'invalid');
  ck('an over-long block is refused', save('x'.repeat(8001)).reason, 'too-long');
  ck('a block from one section saved against another is refused', save('Hi', { section: 's8' }).reason, 'invalid');
  ck('a malformed block key is refused', save('Hi', { block: '../../etc', section: '..' }).reason, 'invalid');
  const f = save('=HYPERLINK("http://x","click")', { name: '=1+1' });
  ck('text that a spreadsheet would read as a formula is saved', f.ok, true);
  const raw = Object.values(w.sheets)[0].raw.pop();
  ck('but written as plain text', [raw[4][0], raw[5][0]], ["'", "'"]);
}

console.log('\n5. undo, and a change of password');
{
  const w = world(); w.props.EDIT_PASSWORD = 'pw';
  const t = w.g.editUnlock({ password: 'pw', name: 'K' }).token;
  w.g.saveContentEdit({ token: t, block: 's2:bbbbbbbb', section: 's2', after: 'Changed' });
  const u = w.g.revertContentEdit({ token: t, block: 's2:bbbbbbbb', name: 'K' });
  ck('undo succeeds', u.ok, true);
  ck('and the block leaves the live set', 's2:bbbbbbbb' in u.live, false);
  ck('the page is served without it', liveIn(page(w)), '{}');
  ck('the undo is logged, not the edit deleted', Object.values(w.sheets)[0].rows.map(r => r[7]).slice(1), ['edit', 'undo']);
  w.props.EDIT_PASSWORD = 'new password';
  ck('changing the password ends existing sessions', w.g.saveContentEdit({ token: t, block: 's2:bbbbbbbb', section: 's2', after: 'X' }).reason, 'expired');
  delete w.props.EDIT_PASSWORD;
  ck('deleting the password switches editing off', w.g.editUnlock({ password: 'pw' }).reason, 'not-set');
}

console.log('\n6. the guide still loads when the log cannot be read');
{
  const w = world(); w.props.EDITS_SHEET_ID = 'deleted-sheet';
  ck('a missing log gives an empty set, not an error', liveIn(page(w)), '{}');
}

console.log('\n7. a save shows on the next load even when Sheets batches the write');
{
  const w = world({ batched: true }); w.props.EDIT_PASSWORD = 'pw';
  const t = w.g.editUnlock({ password: 'pw', name: 'Jordan' }).token;
  const base = { token: t, section: 's2', before: 'Old', name: 'Jordan' };
  const s1 = w.g.saveContentEdit(Object.assign({ block: 's2:9cdbbfe3', after: 'First wording' }, base));
  ck('the save reports the new wording as live', s1.live['s2:9cdbbfe3'] && s1.live['s2:9cdbbfe3'].h, 'First wording');
  ck('and a reload straight after shows it', (JSON.parse(liveIn(page(w)))['s2:9cdbbfe3'] || {}).h, 'First wording');
  w.g.saveContentEdit(Object.assign({ block: 's2:9cdbbfe3', after: 'Second wording' }, base));
  ck('a second save to the same block shows on reload too', (JSON.parse(liveIn(page(w)))['s2:9cdbbfe3'] || {}).h, 'Second wording');
  w.g.revertContentEdit({ token: t, block: 's2:9cdbbfe3', name: 'Jordan' });
  ck('and Restore original takes effect on reload', JSON.parse(liveIn(page(w)))['s2:9cdbbfe3'], undefined);
}

console.log('\n8. the page can ask for the live edits as it loads');
{
  const w = world({ batched: true }); w.props.EDIT_PASSWORD = 'pw';
  ck('with nothing saved it gets an empty set', JSON.stringify(w.g.getLiveEdits()), '{}');
  const t = w.g.editUnlock({ password: 'pw', name: 'Jordan' }).token;
  w.g.saveContentEdit({ token: t, block: 's2:9cdbbfe3', section: 's2', before: 'Old', after: 'Via the QC sheet', name: 'Jordan' });
  ck('after a save it gets the new wording', (w.g.getLiveEdits()['s2:9cdbbfe3'] || {}).h, 'Via the QC sheet');
  ck('the same set that is written into the page', JSON.stringify(w.g.getLiveEdits()), liveIn(page(w)).replace(/\\u003c/g, '<'));
  ckt('and it needs no password', !('token' in JSON.parse(JSON.stringify(w.g.getLiveEdits()))));
  const gone = world(); gone.props.EDITS_SHEET_ID = 'deleted-sheet';
  ck('a missing log gives an empty set here too', JSON.stringify(gone.g.getLiveEdits()), '{}');
}

console.log(fails.length ? '\n' + fails.length + ' FAILURES\n' + fails.join('\n') : '\nall ' + n + ' server checks passed');
process.exit(fails.length ? 1 : 0);
