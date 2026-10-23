/* Arranging a blank guide, in a real browser with google.script.run
   mocked inside the page. The mock keeps every saved version, checks the
   version each save started from, and stores uploaded screenshots, so
   undo, conflicts and reloading the saved guide are all exercised.

     node editmode/tests/arrange.test.js [path/to/blank/appsscript/Index.html]  */
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const INDEX = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'blank', 'appsscript', 'Index.html'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'blank-arrange-'));

const fails = []; let n = 0;
function ck(label, got, want){
  n++;
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? '  ok   ' : '  FAIL ') + label + (ok ? '' : '  got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)));
  if(!ok) fails.push(label);
}
const ckt = (l, c) => ck(l, !!c, true);

/* the page as doGet would serve it, with these edits and screenshots */
function served(live, images){
  const j = v => JSON.stringify(v).replace(/</g, '\\u003c');
  const html = fs.readFileSync(INDEX, 'utf8')
    .replace('/*@@LIVE_EDITS@@*/null', () => j(live || {}))
    .replace('/*@@LIVE_IMAGES@@*/null', () => j(images || {}));
  const f = path.join(TMP, 'Index-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(f, html);
  return 'file://' + f;
}

const MOCK = `
window.__calls = [];
window.__srv = {password:'pw', live:{}, versions:{}, images:{}, n:0};
(function(){
  function runner(){
    var ok = null, S = window.__srv;
    function later(v){ var c = JSON.parse(JSON.stringify(v)); setTimeout(function(){ ok && ok(c); }, 15); }
    function stamp(){ S.n++; return new Date(Date.UTC(2026, 9, 23, 0, 0, S.n)).toISOString(); }
    var api = {
      withSuccessHandler:function(f){ ok = f; return api; },
      withFailureHandler:function(){ return api; },
      getViewer:function(){ later({name:'Kate Wrathall', email:'kate.wrathall@monash.edu'}); },
      getTrainingRecord:function(){ later([]); },
      addTrainingRecord:function(){ later([]); },
      editUnlock:function(p){ later(p.password === S.password ? {ok:true, token:'00000000-0000-0000-0000-000000000001', ttl:10800, live:S.live}
                                                              : {ok:false, reason:'wrong', left:3}); },
      saveContentEdit:function(p){
        window.__calls.push(['save', p.block, p.base]);
        var cur = S.live[p.block];
        if(p.base != null && String(p.base) !== (cur ? cur.at : '')){ later({ok:false, reason:'stale', live:S.live}); return; }
        var v = {h:p.after, by:p.name, at:stamp()};
        (S.versions[p.block] = S.versions[p.block] || []).push(v);
        S.live[p.block] = v;
        later({ok:true, live:S.live});
      },
      revertContentEdit:function(p){
        window.__calls.push(['revert', p.block, p.step || 'undo']);
        var st = S.versions[p.block] = S.versions[p.block] || [];
        if(p.step === 'back'){
          var cur = S.live[p.block];
          if(!cur || cur.at !== p.base){ later({ok:false, reason:'stale', live:S.live}); return; }
          st.pop();
        } else st.length = 0;
        if(st.length) S.live[p.block] = st[st.length - 1]; else delete S.live[p.block];
        later({ok:true, live:S.live});
      },
      uploadEditImage:function(p){
        window.__calls.push(['upload', p.type, p.data.length]);
        var id = 'img00000000' + (++S.n);
        S.images[id] = 'data:' + p.type + ';base64,' + p.data;
        later({ok:true, id:id, src:S.images[id]});
      }
    };
    return api;
  }
  window.google = {script:{}};
  Object.defineProperty(window.google.script, 'run', {get:runner});
})();`;

async function open(b, url){
  const pg = await b.newPage({viewport:{width:1440, height:900}});
  const errs = []; pg.on('pageerror', e => errs.push(String(e))); pg.errs = errs;
  pg.on('dialog', d => d.accept());
  await pg.addInitScript(MOCK);
  await pg.goto(url, {waitUntil:'load'});
  await pg.waitForTimeout(700);
  await pg.evaluate(() => { const g = document.getElementById('gate'); if(g) g.style.display = 'none';
    document.body.classList.remove('gated'); document.body.classList.add('entered'); });
  await pg.waitForTimeout(300);
  return pg;
}
async function unlock(pg){
  await pg.evaluate(() => document.querySelector('.edentry').scrollIntoView({block:'center'}));
  await pg.click('.edentry'); await pg.waitForTimeout(150);
  await pg.fill('#edname', 'Kate Wrathall'); await pg.fill('#edpw', 'pw');
  await pg.click('.edgo'); await pg.waitForTimeout(300);
}
async function show(pg, sel){
  await pg.evaluate(s => { const e = document.querySelector(s); e.scrollIntoView({block:'center'}); }, sel);
  await pg.waitForTimeout(250);
}
async function hover(pg, sel){
  await show(pg, sel);
  const r = await pg.locator(sel).first().boundingBox();
  await pg.mouse.move(r.x + Math.min(30, r.width / 2), r.y + Math.min(14, r.height / 2));
  await pg.waitForTimeout(120);
}
async function center(pg, sel){ const r = await pg.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; }
/* the options menu of the block under sel: a click on its handle */
async function blockMenu(pg, sel){
  await hover(pg, sel);
  const [x, y] = await center(pg, '.edgutter .grip');
  await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.up();
  await pg.waitForTimeout(150);
}
async function pick(pg, label){
  await pg.locator('.edmenu button', {hasText: label}).first().click();
  await pg.waitForTimeout(350);
}
async function itemButton(pg, sel, label){
  await hover(pg, sel);
  await pg.click('.editembar button[aria-label="' + label + '"]');
  await pg.waitForTimeout(350);
}
const saves = pg => pg.evaluate(() => window.__calls.filter(c => c[0] === 'save').map(c => c[1]));
const toast = pg => pg.evaluate(() => document.querySelector('.edtoast').textContent);
const count = (pg, sel) => pg.evaluate(s => document.querySelectorAll(s).length, sel);
const texts = (pg, sel) => pg.evaluate(s => [...document.querySelectorAll(s)].map(e => e.textContent.replace(/\s+/g, ' ').trim()), sel);

(async () => {
const b = await chromium.launch({executablePath:EXE});
let state;

console.log('\n1. the arranging controls');
{
  const pg = await open(b, served({}));
  ck('nothing shows before editing is unlocked', await count(pg, '.edaddend'), 0);
  await unlock(pg);
  ck('every section gets an Add a block button', await count(pg, 'main section .edaddend'), 12);
  await hover(pg, '#s1 > .content-inner > p:not(.secsub)');
  ck('pointing at a block shows its handle', await pg.evaluate(() => !document.querySelector('.edgutter').hidden), true);
  await hover(pg, '#s2 tbody tr');
  ck('pointing at a table row shows its own controls too',
     await pg.evaluate(() => [!document.querySelector('.edgutter').hidden, !document.querySelector('.editembar').hidden]), [true, true]);
  await blockMenu(pg, '#s1 > .content-inner > p:not(.secsub)');
  const items = await texts(pg, '.edmenu button');
  ckt('a click on the handle opens its options', ['Move up', 'Move down', 'Duplicate', 'Subheading', 'Note', 'Key point', 'Delete'].every(x => items.includes(x)));
  await pg.keyboard.press('Escape');

  console.log('\n2. changing blocks');
  const before = await count(pg, '#s1 > .content-inner > p:not(.secsub)');
  await blockMenu(pg, '#s1 > .content-inner > p:not(.secsub)');
  await pick(pg, 'Duplicate');
  ck('Duplicate adds a copy', await count(pg, '#s1 > .content-inner > p:not(.secsub)'), before + 1);
  ck('and saves the whole section', (await saves(pg)).pop(), 's1:all');
  ckt('the copy is editable straight away', await pg.evaluate(() => [...document.querySelectorAll('#s1 > .content-inner > p:not(.secsub)')].every(p => p.hasAttribute('data-ek'))));

  await blockMenu(pg, '#s1 > .content-inner > p:not(.secsub)');
  await pick(pg, 'Key point');
  ck('Turn into changes the style', await pg.evaluate(() => {
    const k = document.querySelector('#s1 > .content-inner > .note.key'); return k ? [k.querySelector('b').textContent, k.textContent.includes('Opening paragraph')] : null; }), ['Key point', true]);

  await blockMenu(pg, '#s1 > .content-inner > .note.key');
  await pick(pg, 'Delete');
  ck('Delete removes it', await count(pg, '#s1 > .content-inner > .note.key'), 0);
  ckt('and says Undo can bring it back', /Undo/.test(await toast(pg)));
  await pg.click('.edbar button:has-text("Undo")'); await pg.waitForTimeout(400);
  ck('Undo brings it back for everyone', await count(pg, '#s1 > .content-inner > .note.key'), 1);
  ck('by stepping the section back one save', (await pg.evaluate(() => window.__calls.filter(c => c[0] === 'revert').pop())).slice(1), ['s1:all', 'back']);

  await pg.click('#s4 .edaddend button'); await pg.waitForTimeout(150);
  await pick(pg, 'Table, two columns');
  ck('Add a block puts a new table at the end of the section', await pg.evaluate(() => {
    const t = [...document.querySelectorAll('#s4 > .content-inner > .tw')].pop(); return t.querySelectorAll('thead th').length; }), 2);
  await pg.evaluate(() => [...document.querySelectorAll('#s4 > .content-inner > .tw')].pop().setAttribute('data-t', 'new'));
  await blockMenu(pg, '#s4 [data-t="new"]');
  await pick(pg, 'Add a column');
  ck('a table takes another column', await pg.evaluate(() => [...[...document.querySelectorAll('#s4 > .content-inner > .tw')].pop().querySelectorAll('tr')].map(r => r.children.length)), [3, 3, 3]);

  console.log('\n3. rows, steps and cards');
  const rows = await count(pg, '#s2 tbody tr');
  await itemButton(pg, '#s2 tbody tr', 'Duplicate this row');
  ck('a row can be duplicated', await count(pg, '#s2 tbody tr'), rows + 1);
  const row1 = await pg.evaluate(() => document.querySelector('#s2 tbody tr').getAttribute('data-eid'));
  await itemButton(pg, '#s2 tbody tr:nth-child(1)', 'Move this row down');
  ck('and moved', await pg.evaluate(() => document.querySelector('#s2 tbody tr:nth-child(2)').getAttribute('data-eid')), row1);
  await itemButton(pg, '#s2 tbody tr', 'Delete this row');
  ck('and deleted', await count(pg, '#s2 tbody tr'), rows);
  const cards = await count(pg, '#s3 .sources .src');
  await itemButton(pg, '#s3 .sources .src', 'Duplicate this card');
  ck('a card can be duplicated', await count(pg, '#s3 .sources .src'), cards + 1);

  console.log('\n4. dragging');
  await show(pg, '#s2 .tw');
  const moving = await pg.evaluate(() => { const p = document.querySelector('#s2 .tw'); p.querySelector('td').textContent = p.querySelector('td').textContent; return document.querySelectorAll('#s2 .tw').length; });
  await hover(pg, '#s2 .tw');
  let [gx, gy] = await center(pg, '.edgutter .grip');
  await pg.mouse.move(gx, gy); await pg.mouse.down();
  await pg.mouse.move(gx, gy + 30, {steps: 3});
  ck('dragging shows where the block will land', await pg.evaluate(() => [!document.querySelector('.edghost').hidden, !document.querySelector('.eddrop').hidden]), [true, true]);
  /* down to the section after it, and in */
  for(let i = 0; i < 40 && !(await pg.evaluate(() => { const r = document.querySelector('#s3 .sources').getBoundingClientRect(); return r.top > 200 && r.top < 700; })); i++){
    await pg.mouse.move(gx, 880, {steps: 2}); await pg.waitForTimeout(60);
  }
  const target = await pg.evaluate(() => { const r = document.querySelector('#s3 .sources').getBoundingClientRect(); return r.top; });
  await pg.mouse.move(gx, target - 4, {steps: 4}); await pg.waitForTimeout(120);
  await pg.mouse.up(); await pg.waitForTimeout(500);
  ck('dropping moves the block into another section', [await count(pg, '#s2 .tw'), await count(pg, '#s3 .tw')], [moving - 1, 2]);
  ckt('right above where it was dropped', await pg.evaluate(() => document.querySelector('#s3 .sources').previousElementSibling.matches('.tw')));
  const last2 = (await saves(pg)).slice(-2);
  ck('both sections are saved, the one it landed in first', last2, ['s3:all', 's2:all']);

  await show(pg, '#s3 .sources');
  await hover(pg, '#s3 .sources .src:nth-child(1)');
  [gx, gy] = await center(pg, '.editembar .grip');
  const firstCard = await pg.evaluate(() => document.querySelector('#s3 .sources .src').getAttribute('data-eid'));
  const lastBox = await pg.locator('#s3 .sources .src:last-child').boundingBox();
  await pg.mouse.move(gx, gy); await pg.mouse.down();
  await pg.mouse.move(gx, gy + 20, {steps: 3});
  await pg.mouse.move(lastBox.x + lastBox.width / 2, lastBox.y + lastBox.height + 10, {steps: 6}); await pg.waitForTimeout(100);
  await pg.mouse.up(); await pg.waitForTimeout(500);
  ck('a card can be dragged to the end of its row', await pg.evaluate(e => document.querySelector('#s3 .sources .src:last-child').getAttribute('data-eid') === e, firstCard), true);

  console.log('\n5. sections');
  await hover(pg, '#s5 .sechead h2');
  await pg.click('.edsecbar button[aria-label="Move this section up"]'); await pg.waitForTimeout(400);
  ck('a section moves up', await pg.evaluate(() => [...document.querySelectorAll('main > section[id^="s"]')].map(s => s.id).slice(0, 6)), ['s1', 's2', 's3', 's5', 's4', 's6']);
  ck('its number and the contents bar follow', [await pg.textContent('#s5 .secnum'), (await texts(pg, '#toc a'))[3]], ['04', '04Section five']);
  ck('and the order is saved', (await saves(pg)).pop(), 'page:layout');
  await hover(pg, '#s5 .sechead h2');
  await pg.click('.edsecbar button[aria-label="Add a new section after this one"]'); await pg.waitForTimeout(500);
  ck('a new section goes in after it', await pg.evaluate(() => { const s = document.querySelector('#s5').nextElementSibling; return [s.id, s.querySelector('h2').textContent, s.querySelector('.secnum').textContent]; }), ['s13', 'New section', '05']);
  ck('and is saved, then the order', (await saves(pg)).slice(-2), ['s13:all', 'page:layout']);
  ckt('it is in the contents bar', (await texts(pg, '#toc a')).includes('05New section'));
  await hover(pg, '#s11 .sechead h2');
  await pg.click('.edsecbar button[aria-label="Delete this section"]'); await pg.waitForTimeout(500);
  ck('a section can be deleted', await count(pg, '#s11'), 0);
  ck('there are still 12 numbered sections', await count(pg, 'main > section[id^="s"]'), 12);

  console.log('\n6. the worked examples');
  await pg.evaluate(() => { document.querySelectorAll('#exlist .ex').forEach(d => d.open = true); });
  await itemButton(pg, '#exlist .ex:nth-of-type(4)', 'Add a self-test question to this example');
  ck('a question can be added to an example', await pg.evaluate(() => { const e = document.querySelectorAll('#exlist .ex')[3]; return [e.hasAttribute('data-scored'), !!e.querySelector('.ansbtn[data-correct]')]; }), [true, true]);
  await hover(pg, '#exlist .ex:nth-of-type(4) .ansbtn:not([data-correct])');
  await pg.click('.editembar button[aria-label="Make this the right answer"]'); await pg.waitForTimeout(350);
  ck('and a different answer made the right one', await pg.evaluate(() => [...document.querySelectorAll('#exlist .ex')[3].querySelectorAll('.ansbtn')].map(b => b.hasAttribute('data-correct'))), [false, true]);
  await itemButton(pg, '#exlist .ex:nth-of-type(1) .ansbtn', 'Duplicate this answer');
  ck('an answer can be added, and is not the right one', await pg.evaluate(() => [...document.querySelectorAll('#exlist .ex')[0].querySelectorAll('.ansbtn')].map(b => b.hasAttribute('data-correct'))), [true, false, false, false]);
  ck('clicking answers while editing never answers the question', await pg.evaluate(() => document.querySelectorAll('#exlist .ex.answered').length), 0);

  console.log('\n7. screenshots');
  const png = Buffer.from(await pg.evaluate(() => { const c = document.createElement('canvas'); c.width = 60; c.height = 40;
    const x = c.getContext('2d'); x.fillStyle = '#c00'; x.fillRect(0, 0, 60, 40); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
  await hover(pg, '#s6 figure img');
  const chooser = pg.waitForEvent('filechooser');
  await pg.click('.edfigbar button:has-text("Replace image")');
  await (await chooser).setFiles({name: 'shot.png', mimeType: 'image/png', buffer: png});
  await pg.waitForTimeout(900);
  const up = await pg.evaluate(() => window.__calls.filter(c => c[0] === 'upload').pop());
  ckt('the screenshot is resized and uploaded', up && /^image\/(webp|jpeg)$/.test(up[1]));
  ck('and shows in place, sized to the image', await pg.evaluate(() => { const i = document.querySelector('#s6 figure img');
    return [/^img/.test(i.getAttribute('data-img') || ''), /^data:image\/(webp|jpeg);base64,/.test(i.src), i.getAttribute('width'), i.getAttribute('height')]; }), [true, true, '60', '40']);
  ckt('the saved section holds the file id, not the image', await pg.evaluate(() => { const h = window.__srv.live['s6:all'].h; return h.includes('data-img="img') && !h.includes(';base64,'); }));

  ck('no page errors', pg.errs, []);
  state = await pg.evaluate(() => ({live: window.__srv.live, images: window.__srv.images}));
  await pg.close();
}

console.log('\n8. the saved guide, as the next person sees it');
{
  const pg = await open(b, served(state.live, state.images));
  ck('sections are in the saved order, with the new one and without the deleted one',
     await pg.evaluate(() => [...document.querySelectorAll('main > section[id^="s"]')].map(s => s.id)), ['s1', 's2', 's3', 's5', 's13', 's4', 's6', 's7', 's8', 's9', 's10', 's12']);
  ck('numbered in that order, in the contents bar too', [await pg.textContent('#s13 .secnum'), (await texts(pg, '#toc a')).slice(3, 6)], ['05', ['04Section five', '05New section', '06Section four']]);
  ck('the moved table is where it was dropped', [await count(pg, '#s2 .tw'), await count(pg, '#s3 .tw')], [0, 2]);
  ckt('the screenshot shows', await pg.evaluate(() => /^data:image\/(webp|jpeg);base64,/.test(document.querySelector('#s6 figure img').src)));
  ck('the self-test counts the added question', await pg.evaluate(() => document.querySelectorAll('#exlist .ex[data-scored]').length), 4);
  ck('search finds the new section', await pg.evaluate(async () => {
    document.getElementById('searchbtn').click(); await new Promise(r => setTimeout(r, 200));
    const f = document.getElementById('sinput'); f.value = 'New section'; f.dispatchEvent(new Event('input', {bubbles: true}));
    await new Promise(r => setTimeout(r, 300)); return document.getElementById('sresults').textContent.includes('New section'); }), true);
  ck('no page errors', pg.errs, []);
  await pg.close();
}

console.log('\n9. two people at once');
{
  const pg = await open(b, served(state.live, state.images));
  await pg.evaluate(l => { window.__srv.live = l; Object.keys(l).forEach(k => window.__srv.versions[k] = [l[k]]); }, state.live);
  await unlock(pg);
  /* someone else saves section one after this page loaded */
  await pg.evaluate(() => { window.__srv.live['s1:all'] = {h: '<div class="sechead"><span class="secnum">01</span><h2>Their heading</h2></div><p>Their wording.</p>', by: 'Sam', at: '2026-10-23T09:00:00.000Z'}; });
  await blockMenu(pg, '#s1 > .content-inner > p:not(.secsub)');
  await pick(pg, 'Duplicate');
  await pg.waitForTimeout(300);
  ckt('a save over someone else\'s is refused and says why', /Someone else changed this section/.test(await toast(pg)));
  ck('and their version shows instead', await pg.evaluate(() => [document.querySelector('#s1 h2').textContent, document.querySelector('#toc a[href="#s1"]').textContent]), ['Their heading', '01Their heading']);
  ck('no page errors', pg.errs, []);
  await pg.close();
}

console.log('\n10. a guide with no self-test and no checklist');
{
  const pg0 = await open(b, served({}));
  await unlock(pg0);
  for(const id of ['s9', 's12']){
    await hover(pg0, '#' + id + ' .sechead h2');
    await pg0.click('.edsecbar button[aria-label="Delete this section"]'); await pg0.waitForTimeout(500);
  }
  const live = await pg0.evaluate(() => window.__srv.live);
  await pg0.close();
  const pg = await open(b, served(live));
  ck('loads without errors', pg.errs, []);
  ck('the completion page asks only for reading', await pg.evaluate(() => [...document.querySelectorAll('#gates > li')].filter(l => !l.hidden).map(l => l.dataset.gate)), ['read']);
  await pg.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await pg.waitForTimeout(1200);
  await pg.fill('#whoami', 'Kate Wrathall');
  ck('and can be completed', await pg.evaluate(() => document.getElementById('certtitle').textContent), "You're ready");
  await pg.close();
}

await b.close();
console.log(fails.length ? '\n' + fails.length + ' of ' + n + ' arranging checks FAILED' : '\nall ' + n + ' arranging checks passed');
process.exit(fails.length ? 1 : 0);
})();
