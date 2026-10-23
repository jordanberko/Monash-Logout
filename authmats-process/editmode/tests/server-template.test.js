/* The server side of arranging a blank guide: whole-section saves, the
   section order, saves that started from an older version, stepping back
   one save, and screenshots. Runs the built Code.gs in Node against
   in-memory stand-ins for the Apps Script services, as server.test.js does.

     node editmode/tests/server-template.test.js [path/to/Code.gs]        */
const fs = require('fs'), vm = require('vm'), crypto = require('crypto'), path = require('path');
const CODE = process.argv[2] || path.join(__dirname, '..', '..', 'blank', 'appsscript', 'Code.gs');

const fails = []; let n = 0;
function ck(label, got, want){
  n++;
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? '  ok   ' : '  FAIL ') + label + (ok ? '' : '  got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)));
  if(!ok) fails.push(label);
}

function world(){
  const props = {}, cache = {}, sheets = {}, files = {}, folders = {}; let nextId = 1, clock = Date.UTC(2026, 9, 23);
  const INDEX = '<html><body><main>x</main><script>var LIVE = /*@@LIVE_EDITS@@*/null; var IMAGES = /*@@LIVE_IMAGES@@*/null;</script></body></html>';
  function sheet(){
    const rows = [];
    return {
      rows,
      appendRow(r){ rows.push(r.map(v => (typeof v === 'string' && v[0] === "'") ? v.slice(1) : v)); },
      getLastRow(){ return rows.length; },
      setFrozenRows(){},
      getRange(r, c, nr, nc){ return { getValues: () => rows.slice(r - 1, r - 1 + nr).map(x => x.slice(c - 1, c - 1 + nc)) }; }
    };
  }
  function output(content){
    const o = { content, setTitle(){ return o; }, addMetaTag(){ return o; }, setXFrameOptionsMode(){ return o; }, getContent(){ return content; } };
    return o;
  }
  function blob(bytes, type, name){ return { bytes, type, name, getBytes: () => bytes, getContentType: () => type, getName: () => name }; }
  function folder(name){
    const id = 'folder' + (nextId++) + 'xxxxxxxx';
    const f = { id, name, getId: () => id,
      createFile(b){ const fid = 'file' + (nextId++) + 'xxxxxxxx'; files[fid] = { blob: b, parent: id, reads: 0 }; return { getId: () => fid }; } };
    folders[id] = f;
    return f;
  }
  const g = {
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (k in props ? props[k] : null),
      setProperty: (k, v) => { props[k] = String(v); },
      deleteProperty: k => { delete props[k]; } }) },
    CacheService: { getScriptCache: () => ({
      get: k => (k in cache ? cache[k] : null),
      getAll: ks => { const o = {}; ks.forEach(k => { if(k in cache) o[k] = cache[k]; }); return o; },
      put: (k, v) => { cache[k] = String(v); },
      putAll: o => { Object.keys(o).forEach(k => { cache[k] = String(o[k]); }); },
      remove: k => { delete cache[k]; } }) },
    SpreadsheetApp: {
      create(){ const id = 'ss' + (nextId++); sheets[id] = sheet(); return { getId: () => id, getSheets: () => [sheets[id]] }; },
      openById(id){ if(!sheets[id]) throw new Error('gone'); return { getId: () => id, getSheets: () => [sheets[id]] }; }
    },
    DriveApp: {
      createFolder: name => folder(name),
      getFolderById(id){ if(!folders[id]) throw new Error('gone'); return folders[id]; },
      getFileById(id){
        const f = files[id];
        if(!f) throw new Error('gone');
        return { getBlob: () => { f.reads++; return f.blob; },
                 getParents: () => { let done = false; return { hasNext: () => !done, next: () => { done = true; return { getId: () => f.parent }; } }; } };
      }
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock(){}, releaseLock(){} }) },
    Session: { getActiveUser: () => ({ getEmail: () => 'kate.wrathall@monash.edu' }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest(alg, s){ return [...crypto.createHash('sha256').update(String(s), 'utf8').digest()].map(b => b > 127 ? b - 256 : b); },
      getUuid: () => crypto.randomUUID(),
      base64Decode: s => [...Buffer.from(s, 'base64')],
      base64Encode: bytes => Buffer.from(bytes.map(b => b & 255)).toString('base64'),
      newBlob: (bytes, type, name) => blob(bytes, type, name)
    },
    HtmlService: { createHtmlOutputFromFile: () => output(INDEX), createHtmlOutput: c => output(c),
                   XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' } },
    console
  };
  /* every save gets its own second, as rows saved by people would */
  const RealDate = Date;
  g.Date = class extends RealDate { constructor(...a){ if(a.length) super(...a); else { clock += 1000; super(clock); } } };
  vm.createContext(g);
  vm.runInContext(fs.readFileSync(CODE, 'utf8'), g, { filename: 'Code.gs' });
  props.EDIT_PASSWORD = 'pw';
  const token = g.editUnlock({ password: 'pw', name: 'Kate' }).token;
  return { g, props, cache, files, folders, token };
}
const SEC = '<div class="sechead"><span class="secnum">01</span><h2>Intro</h2></div><p>Hello.</p>';
const page = w => w.g.doGet({}).getContent();
const json = (html, name) => JSON.parse(html.match(name === 'LIVE' ? /var LIVE = (.*?); var IMAGES/ : /var IMAGES = (.*?);<\/script>/)[1]);

console.log('\n1. saving a whole section');
{
  const w = world(), t = w.token, G = w.g;
  let r = G.saveContentEdit({ token: t, block: 's1:all', section: 's1', after: SEC, base: '', name: 'Kate' });
  ck('a section saves whole', [r.ok, r.live['s1:all'].h], [true, SEC]);
  const at1 = r.live['s1:all'].at;
  ck('a save that starts from an older version is refused', G.saveContentEdit({ token: t, block: 's1:all', section: 's1', after: SEC + '<p>2</p>', base: '' }).reason, 'stale');
  ck('and says what is there now', G.saveContentEdit({ token: t, block: 's1:all', section: 's1', after: SEC, base: 'old' }).live['s1:all'].h, SEC);
  r = G.saveContentEdit({ token: t, block: 's1:all', section: 's1', after: SEC + '<p>Two.</p>', base: at1 });
  ck('one that starts from the latest is not', [r.ok, r.live['s1:all'].h.endsWith('<p>Two.</p>')], [true, true]);
  const at2 = r.live['s1:all'].at;
  ck('the page heading saves too', G.saveContentEdit({ token: t, block: 'mast:all', section: 'mast', after: '<h1>T</h1>', base: '' }).ok, true);
  const bad = [
    ['a script', SEC + '<script>alert(1)</script>'], ['an event handler', '<p onclick="x()">Hi</p>'],
    ['a javascript: link', '<a href="javascript:x()">Hi</a>'], ['a non-image data: URL', '<img src="data:text/html;base64,PHA+">'],
    ['an iframe', '<iframe src="https://x"></iframe>'], ['a style tag', '<style>p{}</style>'], ['an svg', '<svg></svg>'],
    ['a form', '<form><input type="checkbox"></form>']
  ];
  ck('anything that could run code is refused', bad.map(b => G.saveContentEdit({ token: t, block: 's2:all', section: 's2', after: b[1], base: '' }).reason), bad.map(() => 'unsafe'));
  ck('the guide\'s own checklist boxes, buttons and screenshots are not',
     G.saveContentEdit({ token: t, block: 's2:all', section: 's2', base: '',
       after: '<label><input type="checkbox" data-k="c1"></label><button class="ansbtn" type="button">A</button><img src="data:image/png;base64,iVBOR" data-img="file9xxxxxxxx">' }).ok, true);
  ck('a section that is too long is refused', G.saveContentEdit({ token: t, block: 's3:all', section: 's3', after: '<p>' + 'x'.repeat(46000) + '</p>', base: '' }).reason, 'too-long');
  ck('as is a key that does not match its section', G.saveContentEdit({ token: t, block: 's3:all', section: 's4', after: SEC, base: '' }).reason, 'invalid');
  ck('or a section that is not one', G.saveContentEdit({ token: t, block: 'done:all', section: 'done', after: SEC, base: '' }).reason, 'invalid');

  console.log('\n2. stepping back, and putting back the original');
  r = G.revertContentEdit({ token: t, block: 's1:all', step: 'back', base: at2 });
  ck('stepping back goes to the save before', [r.ok, r.live['s1:all'].h, r.live['s1:all'].at], [true, SEC, at1]);
  ck('only if the save being undone is still the latest', G.revertContentEdit({ token: t, block: 's1:all', step: 'back', base: at2 }).reason, 'stale');
  r = G.revertContentEdit({ token: t, block: 's1:all', step: 'back', base: at1 });
  ck('stepping back past the first save leaves the original', [r.ok, 's1:all' in r.live], [true, false]);
  G.saveContentEdit({ token: t, block: 's1:all', section: 's1', after: SEC, base: '' });
  r = G.saveContentEdit({ token: t, block: 's1:all', section: 's1', after: SEC + '<p>3</p>', base: G.liveEdits_()['s1:all'].at });
  r = G.revertContentEdit({ token: t, block: 's1:all', name: 'Kate' });
  ck('putting back the original clears every save', [r.ok, 's1:all' in r.live], [true, false]);
  ck('a single block cannot step back', G.revertContentEdit({ token: t, block: 's1:0123abcd', step: 'back', base: 'x' }).reason, 'invalid');
}

console.log('\n3. the order of sections');
{
  const w = world(), t = w.token, G = w.g;
  ck('an order of sections saves', G.saveContentEdit({ token: t, block: 'page:layout', section: 'page', after: '["s2","s1","s13"]', base: '' }).ok, true);
  const badOrders = ['not json', '[]', '["s1","s1"]', '["done"]', '["s1",2]', '{"a":1}', JSON.stringify(Array.from({length: 61}, (_, i) => 's' + i))];
  ck('anything else is refused', badOrders.map(a => G.saveContentEdit({ token: t, block: 'page:layout', section: 'page', after: a, base: G.liveEdits_()['page:layout'].at }).reason),
     badOrders.map(() => 'invalid'));
  ck('and must be saved under the page', G.saveContentEdit({ token: t, block: 'page:layout', section: 's1', after: '["s1"]', base: '' }).reason, 'invalid');
  ck('the page is served with it', json(page(w), 'LIVE')['page:layout'].h, '["s2","s1","s13"]');
}

console.log('\n4. single blocks behave as before');
{
  const w = world(), t = w.token, G = w.g;
  G.saveContentEdit({ token: t, block: 'done:0123abcd', section: 'done', after: 'One' });
  G.saveContentEdit({ token: t, block: 'done:0123abcd', section: 'done', after: 'Two' });
  ck('the newest wording is live', G.liveEdits_()['done:0123abcd'].h, 'Two');
  ck('without needing a version to start from', G.saveContentEdit({ token: t, block: 'done:0123abcd', section: 'done', after: 'Three' }).ok, true);
  G.revertContentEdit({ token: t, block: 'done:0123abcd' });
  ck('and an undo still puts back the original', 'done:0123abcd' in G.liveEdits_(), false);
  ck('an image tag in a single block is still refused', G.saveContentEdit({ token: t, block: 'done:0123abcd', section: 'done', after: '<img src="x">' }).reason, 'unsafe');
}

console.log('\n5. screenshots');
{
  const w = world(), t = w.token, G = w.g;
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex').toString('base64');
  ck('before any upload the page has no screenshots', json(page(w), 'IMAGES'), {});
  let r = G.uploadEditImage({ token: t, type: 'image/png', data: png, name: 'shot one.png', editor: 'Kate' });
  ck('an upload is stored and handed back', [r.ok, /^file/.test(r.id), r.src], [true, true, 'data:image/png;base64,' + png]);
  const folderId = w.props.EDIT_IMAGES_FOLDER_ID;
  ck('in a folder named after the guide', w.folders[folderId].name, w.g.PAGE_TITLE + ' - Images');
  ck('with the editor\'s name in the log, not as a live edit', [G.editsSheet_(false).rows.pop()[7], Object.keys(G.liveEdits_()).length], ['image', 0]);
  G.saveContentEdit({ token: t, block: 's6:all', section: 's6', base: '', after: '<figure><img src="data:image/png;base64,iVBOR" data-img="' + r.id + '"></figure>' });
  ck('a section that uses it gets it when the page is served', json(page(w), 'IMAGES')[r.id], 'data:image/png;base64,' + png);
  page(w);
  ck('from the cache after the first time', w.files[r.id].reads, 1);
  /* a file elsewhere in the owner's Drive */
  const other = w.g.DriveApp.createFolder('Private').createFile(w.g.Utilities.newBlob([1, 2, 3], 'image/png', 'p.png')).getId();
  G.saveContentEdit({ token: t, block: 's7:all', section: 's7', base: '', after: '<img src="data:image/png;base64,iVBOR" data-img="' + other + '">' });
  ck('a file outside the images folder is never served', other in json(page(w), 'IMAGES'), false);
  ck('an unknown file id is skipped without breaking the page', (() => {
    G.saveContentEdit({ token: t, block: 's8:all', section: 's8', base: '', after: '<img src="data:image/png;base64,iVBOR" data-img="filedoesnotexist">' });
    return Object.keys(json(page(w), 'IMAGES')).length; })(), 1);
  ck('only images are accepted', G.uploadEditImage({ token: t, type: 'text/html', data: png }).reason, 'invalid');
  ck('as base64', G.uploadEditImage({ token: t, type: 'image/png', data: '<script>' }).reason, 'invalid');
  ck('and not too large', G.uploadEditImage({ token: t, type: 'image/png', data: 'A'.repeat(4000004) }).reason, 'too-long');
  ck('and only while unlocked', G.uploadEditImage({ token: '00000000-0000-0000-0000-000000000000', type: 'image/png', data: png }).reason, 'expired');
}

console.log(fails.length ? '\n' + fails.length + ' of ' + n + ' server template checks FAILED' : '\nall ' + n + ' server template checks passed');
process.exit(fails.length ? 1 : 0);
