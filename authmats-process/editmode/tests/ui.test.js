/* The editing interface in a real browser, with google.script.run mocked
   inside the page. Nothing leaves the browser: the mock holds the password
   and the live edits in memory.

     node editmode/tests/ui.test.js [path/to/edit-enabled/Index.html]       */
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const INDEX = path.resolve(process.argv[2] || path.join(__dirname, '..', 'build-snapshot', 'Index.html'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'amqc-edit-'));

const fails = []; let n = 0;
function ck(label, got, want){
  n++;
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? '  ok   ' : '  FAIL ') + label + (ok ? '' : '  got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)));
  if(!ok) fails.push(label);
}
const ckt = (l, c) => ck(l, !!c, true);

/* The page as doGet would serve it, with these edits written in. */
function served(live){
  const html = fs.readFileSync(INDEX, 'utf8')
    .replace('/*@@LIVE_EDITS@@*/null', () => JSON.stringify(live).replace(/</g, '\\u003c'));
  const f = path.join(TMP, 'Index-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(f, html);
  return 'file://' + f;
}

const MOCK = `
window.__calls = [];
window.__srv = {password:'pw', live:{}, expired:false};
(function(){
  function runner(){
    var ok = null, fail = null, S = window.__srv;
    function later(v){ setTimeout(function(){ ok && ok(JSON.parse(JSON.stringify(v))); }, 15); }
    var api = {
      withSuccessHandler:function(f){ ok = f; return api; },
      withFailureHandler:function(f){ fail = f; return api; },
      getViewer:function(){ later({name:'Kate Wrathall', email:'kate.wrathall@monash.edu'}); },
      getCapabilities:function(){ later({contract:2}); },
      getTrainingRecord:function(){ later([]); },
      addTrainingRecord:function(){ later([]); },
      editUnlock:function(p){ window.__calls.push(['editUnlock', p.name]);
        later(p.password === S.password ? {ok:true, token:'00000000-0000-0000-0000-000000000001', ttl:10800, live:S.live}
                                        : {ok:false, reason:'wrong', left:3}); },
      saveContentEdit:function(p){ window.__calls.push(['saveContentEdit', p]);
        if(S.expired){ S.expired = false; later({ok:false, reason:'expired'}); return; }
        S.live[p.block] = {h:p.after, by:p.name, at:new Date().toISOString()}; later({ok:true, live:S.live}); },
      revertContentEdit:function(p){ window.__calls.push(['revertContentEdit', p]);
        delete S.live[p.block]; later({ok:true, live:S.live}); }
    };
    return api;
  }
  window.google = {script:{}};
  Object.defineProperty(window.google.script, 'run', {get:runner});
})();`;

async function open(b, url, w){
  const pg = await b.newPage({viewport:{width:w || 1440, height:900}});
  const errs = []; pg.on('pageerror', e => errs.push(String(e))); pg.errs = errs;
  pg.on('dialog', d => d.accept());             /* the confirm() before an undo */
  await pg.addInitScript(MOCK);
  await pg.goto(url, {waitUntil:'load'});
  await pg.waitForTimeout(700);
  /* past the entry screen, the way the existing checks do it */
  await pg.evaluate(() => { const g = document.getElementById('gate'); if(g) g.style.display = 'none';
    document.body.classList.remove('gated'); document.body.classList.add('entered'); });
  await pg.waitForTimeout(300);
  return pg;
}

(async () => {
const b = await chromium.launch({executablePath:EXE});

console.log('\n1. the page as most people see it');
{
  const pg = await open(b, served({}));
  const r = await pg.evaluate(() => ({
    blocks: document.querySelectorAll('[data-ek]').length,
    edited: document.querySelectorAll('[data-edited]').length,
    entries: [...document.querySelectorAll('.edentry')].map(x =>
      [x.closest('#outline .olfoot') ? 'contents panel' : x.closest('.edstampwrap') ? 'build line' : 'elsewhere', x.textContent]),
    panelFoot: !!document.querySelector('#outline .olfoot'),
    bar: !document.querySelector('.edbar').hidden,
    locked: ['#exlist', '.qa', '#done', 'nav', '.pagenav'].map(s =>
      [...document.querySelectorAll(s)].some(x => x.querySelector('[data-ek]') || x.matches('[data-ek]'))),
    keysUnique: (() => { const k = [...document.querySelectorAll('[data-ek]')].map(x => x.dataset.ek); return k.length === new Set(k).size; })(),
    nested: [...document.querySelectorAll('[data-ek] [data-ek]')].length
  }));
  console.log('   editable blocks found:', r.blocks);
  ckt('text blocks are marked as editable', r.blocks > 300);
  ck('nothing is shown as edited', r.edited, 0);
  /* One at the foot of the Contents panel, in builds that have one, and one
     by the build line at the end of the guide. Nowhere else. */
  ck('there is a quiet Edit button in each of its two places', r.entries,
     (r.panelFoot ? [['contents panel', 'Edit this guide']] : []).concat([['build line', 'Edit this guide']]));
  ck('and no editing bar', r.bar, false);
  ck('the self-test, completion page and navigation are not editable', r.locked, [false, false, false, false, false]);
  ck('every block has its own key', r.keysUnique, true);
  ck('and blocks never sit inside each other', r.nested, 0);
  if(r.panelFoot){
    await pg.click('#outlinebtn'); await pg.waitForTimeout(250);
    await pg.click('#outline .edentry'); await pg.waitForTimeout(200);
    ck('the one in the Contents panel opens the password dialog', await pg.evaluate(() => !document.querySelector('.edlg').hidden), true);
  }
  ck('no page errors', pg.errs, []);
  await pg.close();
}

console.log('\n2. a page served with live edits');
let key, original;
{
  const pg0 = await open(b, served({}));
  [key, original] = await pg0.evaluate(() => { const p = document.querySelector('#s5 p[data-ek]'); return [p.dataset.ek, p.textContent]; });
  await pg0.close();
  const evil = 'Zebracorn check <b>first</b> <script>window.__pwned=1</script><img src=x onerror="window.__pwned=2">' +
               '<a href="javascript:window.__pwned=3">bad</a> <a href="https://example.org">good</a> <span class="col" style="color:red" onclick="x">col F</span>';
  const pg = await open(b, served({[key]: {h: evil, by: 'Kate', at: '2026-10-12T00:00:00Z'}, 's5:deadbeef': {h: 'orphan'}}));
  await pg.waitForTimeout(300);
  const r = await pg.evaluate(k => {
    const el = document.querySelector('[data-ek="' + k + '"]');
    return {text: el.textContent, html: el.innerHTML, edited: el.hasAttribute('data-edited'), pwned: window.__pwned || 0,
            orphans: window.AMQC_EDITS.orphans()};
  }, key);
  ckt('the block shows the edited wording', r.text.startsWith('Zebracorn check first'));
  ck('no script in an edit ever runs', r.pwned, 0);
  ckt('scripts, images and handlers are stripped', !/script|<img|onerror|onclick|style=/.test(r.html));
  ckt('a javascript: link keeps its text but loses the link', /bad/.test(r.text) && !/javascript/.test(r.html));
  ckt('a normal link survives and opens in a new tab', /href="https:\/\/example.org"[^>]*target="_blank"/.test(r.html));
  ckt('the guide\'s own column chip survives', /<span class="col">col F<\/span>/.test(r.html));
  ck('an edit for a block that no longer exists is set aside', r.orphans, ['s5:deadbeef']);
  await pg.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k'); await pg.waitForTimeout(300);
  await pg.keyboard.type('Zebracorn'); await pg.waitForTimeout(500);
  const hits = await pg.evaluate(() => document.querySelectorAll('.sitem').length);
  ckt('search finds the edited wording', hits > 0);
  ck('no page errors', pg.errs, []);
  await pg.close();
}

console.log('\n3. unlocking');
{
  const pg = await open(b, served({}));
  await pg.evaluate(() => document.querySelector('.edstampwrap .edentry').scrollIntoView({block: 'center'}));
  await pg.click('.edstampwrap .edentry');
  await pg.waitForTimeout(200);
  ck('the password dialog opens', await pg.evaluate(() => !document.querySelector('.edlg').hidden), true);
  ck('with the name already filled in when known', await pg.inputValue('#edname'), await pg.evaluate(() => {
    const w = window.AMQC && window.AMQC.who; return typeof w === 'string' ? w : (w && w.name) || ''; }));
  await pg.fill('#edname', 'Kate Wrathall');
  await pg.fill('#edpw', 'NotThePassword-913');
  await pg.click('.edgo'); await pg.waitForTimeout(200);
  ck('a wrong password says so', await pg.textContent('.edmsg'), 'That password is not right. 3 attempts left.');
  ck('and editing stays off', await pg.evaluate(() => document.body.classList.contains('editing-on')), false);
  ckt('the password typed is not stored in the browser', !(await pg.evaluate(() =>
    JSON.stringify(sessionStorage) + JSON.stringify(localStorage))).includes('NotThePassword-913'));
  await pg.fill('#edpw', 'pw');
  await pg.click('.edgo'); await pg.waitForTimeout(250);
  const r = await pg.evaluate(() => ({on: document.body.classList.contains('editing-on'), bar: !document.querySelector('.edbar').hidden,
    dlg: document.querySelector('.edlg').hidden, text: document.querySelector('.edbartext').textContent,
    stored: sessionStorage.getItem('amqc-edit-token')}));
  ck('the right password turns editing on', [r.on, r.bar, r.dlg], [true, true, true]);
  ckt('and says who is editing', r.text.startsWith('Editing as Kate Wrathall.'));
  ckt('the session token, not the password, is kept for this tab', r.stored && !r.stored.includes('"pw"'));

  console.log('\n4. changing a block');
  const sel = '[data-ek="' + key + '"]';
  await pg.evaluate(s => document.querySelector(s).scrollIntoView({block: 'center'}), sel);
  await pg.waitForTimeout(150);
  await pg.click(sel);
  await pg.waitForTimeout(150);
  const e1 = await pg.evaluate(s => ({ce: document.querySelector(s).getAttribute('contenteditable'), tools: !document.querySelector('.edtools').hidden,
    restore: document.querySelector('.edrestore').hidden}), sel);
  ck('selecting a block makes it editable with a toolbar', [e1.ce, e1.tools], ['true', true]);
  ck('Restore original is hidden for an unchanged block', e1.restore, true);
  await pg.keyboard.press('Control+a');
  await pg.keyboard.type('Rewritten by the test.');
  await pg.click('.edtools .edgo'); await pg.waitForTimeout(250);
  const s1 = await pg.evaluate(s => ({text: document.querySelector(s).textContent, ce: document.querySelector(s).getAttribute('contenteditable'),
    edited: document.querySelector(s).hasAttribute('data-edited'), call: window.__calls.filter(c => c[0] === 'saveContentEdit').pop(),
    changes: document.querySelector('.edbar .edquiet').textContent, toast: document.querySelector('.edtoast').textContent}), sel);
  ck('Save keeps the new wording on the page', s1.text, 'Rewritten by the test.');
  ck('and ends editing that block', s1.ce, null);
  ck('the server is sent the block, its section and the new wording', [s1.call[1].block, s1.call[1].section, s1.call[1].after], [key, key.split(':')[0], 'Rewritten by the test.']);
  ck('with the old wording for the log', s1.call[1].before, original.replace(/\s+/g, ' ').trim());
  ck('and the editor\'s name', s1.call[1].name, 'Kate Wrathall');
  ck('the changes count goes up', s1.changes, 'Changes (1)');
  ck('and the editor is told it is live', s1.toast, 'Saved. It is live for everyone.');

  /* an editing session that ran out while somebody was mid-change */
  await pg.click(sel); await pg.waitForTimeout(100);
  await pg.keyboard.press('End'); await pg.keyboard.type(' More.');
  await pg.evaluate(() => { window.__srv.expired = true; });
  await pg.click('.edtools .edgo'); await pg.waitForTimeout(300);
  ck('an expired session asks for the password again', await pg.evaluate(() => !document.querySelector('.edlg').hidden), true);
  ck('without losing the change being made', await pg.evaluate(s => document.querySelector(s).textContent, sel), 'Rewritten by the test. More.');
  await pg.fill('#edpw', 'pw'); await pg.click('.edgo'); await pg.waitForTimeout(400);
  ck('the name is still filled in when asked again', await pg.inputValue('#edname'), 'Kate Wrathall');
  ck('and saves it once unlocked again', await pg.evaluate(k => window.__srv.live[k].h, key), 'Rewritten by the test. More.');

  console.log('\n5. pasting, links and the rest of the page');
  const linkBlock = await pg.evaluate(() => { const a = [...document.querySelectorAll('[data-ek] a[href^="#"]')][0]; return a.closest('[data-ek]').dataset.ek; });
  const ls = '[data-ek="' + linkBlock + '"]';
  const y0 = await pg.evaluate(s => { const el = document.querySelector(s); el.scrollIntoView({block: 'center'}); return scrollY; }, ls);
  await pg.waitForTimeout(150);
  await pg.click(ls + ' a[href^="#"]'); await pg.waitForTimeout(400);
  ck('clicking a link inside a block edits the block instead of jumping', await pg.evaluate(([s, y]) =>
    [document.querySelector(s).getAttribute('contenteditable'), Math.abs(scrollY - y) < 5], [ls, y0]), ['true', true]);
  await pg.evaluate(() => { const dt = new DataTransfer(); dt.setData('text/html', '<b style="color:red">Loud</b>'); dt.setData('text/plain', 'Plain');
    document.activeElement.dispatchEvent(new ClipboardEvent('paste', {clipboardData: dt, bubbles: true, cancelable: true})); });
  ckt('pasting brings plain text only', await pg.evaluate(s => { const h = document.querySelector(s).innerHTML; return h.includes('Plain') && !h.includes('Loud'); }, ls));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  ck('Escape cancels without saving', await pg.evaluate(s => [document.querySelector(s).getAttribute('contenteditable'), document.querySelector(s).innerHTML.includes('Plain')], ls), [null, false]);
  /* In Test yourself the guide holds the question cards open on purpose, and
     later builds open in that mode for a new reader. Opening and closing a
     card is a Reference behaviour, so check it there. */
  const qa = await pg.evaluate(() => { const s = document.querySelector('#exlist details summary'); if(!s) return null;
    const rb = document.querySelector('.segbtn[data-mode="ref"]');
    if(rb && document.body.classList.contains('testing')) rb.click();
    const d = s.parentElement, before = d.open; s.click(); return [before, d.open, document.body.classList.contains('testing')]; });
  ckt('the worked examples still open and close while editing', !qa || (qa[0] !== qa[1] && !qa[2]));

  console.log('\n6. the list of changes, and undo');
  await pg.click('.edbar .edquiet'); await pg.waitForTimeout(150);
  const p = await pg.evaluate(() => ({open: !document.querySelector('.edpanel').hidden, items: document.querySelectorAll('.edlist li').length,
    meta: (document.querySelector('.edmeta') || {}).textContent}));
  ck('Changes lists what is live', [p.open, p.items], [true, 1]);
  ckt('with who changed it and when', /^Changed by Kate Wrathall, /.test(p.meta));
  await pg.click('.edlist .edacts button:last-child'); await pg.waitForTimeout(300);
  ck('Restore original puts the wording back', await pg.evaluate(s => document.querySelector(s).textContent, sel), original);
  ck('for everyone', await pg.evaluate(() => Object.keys(window.__srv.live).length), 0);
  ck('and the list empties', await pg.evaluate(() => (document.querySelector('.edempty') || {}).textContent),
     'Nothing has been changed. The guide shows its original wording.');

  console.log('\n7. finishing');
  await pg.click('.edbar .edgo'); await pg.waitForTimeout(200);
  const f = await pg.evaluate(() => ({on: document.body.classList.contains('editing-on'), bar: document.querySelector('.edbar').hidden,
    token: sessionStorage.getItem('amqc-edit-token'), ce: document.querySelectorAll('[contenteditable]').length}));
  ck('Finish editing turns it off and forgets the session', [f.on, f.bar, f.token, f.ce], [false, true, null, 0]);
  await pg.click(sel); await pg.waitForTimeout(150);
  ck('after which clicking text does nothing special', await pg.evaluate(s => document.querySelector(s).getAttribute('contenteditable'), sel), null);
  ck('no page errors', pg.errs, []);
  await pg.close();
}

console.log('\n8. a phone, and print');
{
  const pg = await open(b, served({}), 390);
  await pg.evaluate(() => document.querySelector('.edstampwrap .edentry').scrollIntoView({block: 'center'}));
  await pg.click('.edstampwrap .edentry'); await pg.waitForTimeout(150);
  await pg.fill('#edname', 'Kate'); await pg.fill('#edpw', 'pw'); await pg.click('.edgo'); await pg.waitForTimeout(250);
  const m = await pg.evaluate(() => { const r = document.querySelector('.edbar').getBoundingClientRect();
    return {fits: r.left >= 0 && r.right <= innerWidth, hscroll: document.documentElement.scrollWidth > innerWidth + 1}; });
  ck('the editing bar fits a phone screen without sideways scrolling', [m.fits, m.hscroll], [true, false]);
  await pg.emulateMedia({media: 'print'});
  ck('none of the editing controls print', await pg.evaluate(() =>
    [...document.querySelectorAll('.edentry,.edbar')].every(x => getComputedStyle(x).display === 'none')), true);
  ck('no page errors', pg.errs, []);
  await pg.close();
}

await b.close();
fs.rmSync(TMP, {recursive: true, force: true});
console.log(fails.length ? '\n' + fails.length + ' FAILURES\n' + fails.join('\n') : '\nall ' + n + ' interface checks passed');
process.exit(fails.length ? 1 : 0);
})();
