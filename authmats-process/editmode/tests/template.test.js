/* Live editing on a blank guide (main[data-edit-template]), in a real
   browser with google.script.run mocked inside the page, as in ui.test.js.

     node editmode/tests/template.test.js [path/to/blank/appsscript/Index.html]  */
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const INDEX = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'blank', 'appsscript', 'Index.html'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'blank-edit-'));

const fails = []; let n = 0;
function ck(label, got, want){
  n++;
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? '  ok   ' : '  FAIL ') + label + (ok ? '' : '  got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)));
  if(!ok) fails.push(label);
}
const ckt = (l, c) => ck(l, !!c, true);

function served(live){
  const html = fs.readFileSync(INDEX, 'utf8')
    .replace('/*@@LIVE_EDITS@@*/null', () => JSON.stringify(live).replace(/</g, '\\u003c'));
  const f = path.join(TMP, 'Index-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(f, html);
  return 'file://' + f;
}

const MOCK = `
window.__calls = [];
window.__srv = {password:'pw', live:{}};
(function(){
  function runner(){
    var ok = null, S = window.__srv;
    function later(v){ setTimeout(function(){ ok && ok(JSON.parse(JSON.stringify(v))); }, 15); }
    var api = {
      withSuccessHandler:function(f){ ok = f; return api; },
      withFailureHandler:function(){ return api; },
      getViewer:function(){ later({name:'Kate Wrathall', email:'kate.wrathall@monash.edu'}); },
      getTrainingRecord:function(){ later([]); },
      addTrainingRecord:function(){ later([]); },
      editUnlock:function(p){ later(p.password === S.password ? {ok:true, token:'00000000-0000-0000-0000-000000000001', ttl:10800, live:S.live}
                                                              : {ok:false, reason:'wrong', left:3}); },
      saveContentEdit:function(p){ window.__calls.push(['saveContentEdit', p]);
        S.live[p.block] = {h:p.after, by:p.name, at:new Date().toISOString()}; later({ok:true, live:S.live}); },
      revertContentEdit:function(p){ delete S.live[p.block]; later({ok:true, live:S.live}); }
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
const keyOf = (pg, sel) => pg.evaluate(s => { const e = document.querySelector(s); return e && e.getAttribute('data-ek'); }, sel);

(async () => {
const b = await chromium.launch({executablePath:EXE});

console.log('\n1. what a blank guide lets people edit');
let K = {};
{
  const pg = await open(b, served({}));
  const editable = ['.mast .ttlname', '.mast .ttlqual', '.mast .mastkicker', '.mast .lede', '.mast .pill', '#s1 .sechead h2',
    '#s3 .src .who', '#s3 .src .applies', '#exlist .ex summary .verdict', '#exlist .ex summary .example-title', '#exlist dd',
    '#exlist .quizq', '#exlist .ansbtn > span', '#s7 .pathbtn > b', '#s7 .pathbtn > span', '#studynote', '#done h2', '#done .donelede', '#done .certnote'];
  const r = await pg.evaluate(sels => sels.map(s => { const e = document.querySelector(s); return !!(e && e.hasAttribute('data-ek')); }), editable);
  ck('the heading, cards, examples, questions, answers, options and completion wording', r, editable.map(() => true));
  const locked = ['nav', '#gates', '.certtitle', '.certmsg', '.buildstamp', '.roll', '.chkbar', '#exfilters', '.modebar', '#gate'];
  ck('the contents bar, requirements, record, counters and sign-in screen are not',
     await pg.evaluate(sels => sels.map(s => [...document.querySelectorAll(s)].some(x => x.matches('[data-ek]') || x.querySelector('[data-ek]'))), locked),
     locked.map(() => false));
  ck('no other button is editable', await pg.evaluate(() =>
    [...document.querySelectorAll('button[data-ek], button [data-ek]')].filter(x => !x.closest('.ansbtn,.pathbtn')).length), 0);
  ck('every block has its own key', await pg.evaluate(() => { const k = [...document.querySelectorAll('[data-ek]')].map(x => x.dataset.ek); return k.length === new Set(k).size; }), true);
  ck('and blocks never sit inside each other', await pg.evaluate(() => document.querySelectorAll('[data-ek] [data-ek]').length), 0);
  ckt('keys are ones the server accepts', await pg.evaluate(() =>
    [...document.querySelectorAll('[data-ek]')].every(x => /^[A-Za-z0-9_-]{1,32}:[0-9a-f]{8}(:\d{1,3})?$/.test(x.dataset.ek))));
  for(const [name, sel] of Object.entries({title:'.mast .ttlname', kicker:'.mast .mastkicker', lede:'.mast .lede', pill:'.mast .pill',
      s2:'#s2 .sechead h2', verdict:'#exlist .ex[data-v="disc"] summary .verdict', right:'#exlist .ex .ansbtn[data-correct] > span'})) K[name] = await keyOf(pg, sel);
  ck('the page heading is keyed to its own area', K.title.split(':')[0], 'mast');
  ck('no page errors', pg.errs, []);
  await pg.close();
}

console.log('\n2. copies follow the edited original');
{
  const at = '2026-10-23T00:00:00Z';
  const pg = await open(b, served({
    [K.title]: {h:'Exam Rooms Guide', by:'Kate', at}, [K.kicker]: {h:'Venue Team', by:'Kate', at},
    [K.lede]: {h:'How to set up an exam room.', by:'Kate', at}, [K.pill]: {h:'20 minutes', by:'Kate', at},
    [K.s2]: {h:'Glossary', by:'Kate', at}, [K.verdict]: {h:'Needs work', by:'Kate', at}, [K.right]: {h:'Yes, always', by:'Kate', at}}));
  const r = await pg.evaluate(() => ({
    rail: document.querySelector('.rail .brand .name').textContent,
    home: document.querySelector('#step-home h1').textContent,
    aria: document.getElementById('gate').getAttribute('aria-label'),
    eyebrows: [...new Set([...document.querySelectorAll('.gateeyebrow')].map(x => x.textContent))],
    gatelede: document.querySelector('#step-home .gatelede').textContent,
    gatepill: document.querySelector('#step-home .gatepill').textContent,
    nav: document.querySelector('#toc a[href="#s2"] span:last-child').textContent,
    filter: document.querySelector('#exfilters .fbtn[data-v="disc"]').textContent,
    right: [...document.querySelectorAll('#exlist .ex')][0].querySelector('.ansbtn[data-correct]').textContent
  }));
  ck('the title in the top bar and on the sign-in screen', [r.rail, r.home, r.aria], ['Exam Rooms Guide', 'Exam Rooms Guide', 'Sign in to Exam Rooms Guide']);
  ck('the team name, summary and pills on the sign-in screen', [r.eyebrows, r.gatelede, r.gatepill], [['Venue Team'], 'How to set up an exam room.', '20 minutes']);
  ck('a section heading in the contents bar', r.nav, 'Glossary');
  ck('an example group on its filter button', r.filter, 'Needs work');
  ck('the right answer is reworded and is still the right answer', r.right, 'Yes, always');
  await pg.keyboard.press('Control+k'); await pg.waitForTimeout(300);
  await pg.keyboard.type('Glossary'); await pg.waitForTimeout(500);
  ckt('search finds the edited heading', await pg.evaluate(() => document.querySelector('#sresults').textContent.includes('Glossary')));
  await pg.keyboard.press('Escape');

  /* complete the training: the line under the tick reads the edited heading */
  await pg.click('.segbtn[data-mode="test"]'); await pg.waitForTimeout(200);
  for(const ex of await pg.$$('#exlist .ex[data-scored]')){
    await ex.evaluate(e => { e.open = true; e.scrollIntoView(); }); await pg.waitForTimeout(100);
    await (await ex.$('.ansbtn[data-correct]')).click(); await pg.waitForTimeout(100);
  }
  for(const c of await pg.$$('#chk input')){ await c.scrollIntoViewIfNeeded(); await c.check(); }
  await pg.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await pg.waitForTimeout(1200);
  await pg.fill('#whoami', 'Kate Wrathall');
  await pg.click('#confirmdone'); await pg.waitForTimeout(300);
  ck('the completion line uses the edited title and team', await pg.textContent('#certmsg'), 'Exam Rooms Guide, Venue Team.');
  ck('no page errors', pg.errs, []);
  await pg.close();
}

console.log('\n3. editing from the page');
{
  const pg = await open(b, served({}));
  await pg.evaluate(() => document.querySelector('.edentry').scrollIntoView({block:'center'}));
  await pg.click('.edentry'); await pg.waitForTimeout(200);
  await pg.fill('#edname', 'Kate Wrathall'); await pg.fill('#edpw', 'pw');
  await pg.click('.edgo'); await pg.waitForTimeout(300);
  ck('editing turns on', await pg.evaluate(() => document.body.classList.contains('editing-on')), true);

  async function edit(sel, text){
    await pg.evaluate(s => document.querySelector(s).scrollIntoView({block:'center'}), sel);
    await pg.waitForTimeout(150);
    await pg.click(sel); await pg.waitForTimeout(150);
    const ce = await pg.evaluate(s => document.querySelector(s).getAttribute('contenteditable'), sel);
    await pg.keyboard.press('Control+a');
    await pg.keyboard.type(text);
    const typed = await pg.evaluate(s => document.querySelector(s).textContent, sel);
    await pg.keyboard.press('Control+Enter'); await pg.waitForTimeout(250);
    const last = await pg.evaluate(() => window.__calls.filter(c => c[0] === 'saveContentEdit').pop());
    return {ce, typed, last};
  }

  const has = (r, text) => r.last[1].after.includes(text);
  let r = await edit('#s4 .sechead h2', 'Room layout');
  ck('a section heading saves, as its whole section', [r.ce, r.last[1].block, r.last[1].section, has(r, '<h2>Room layout</h2>')], ['true', 's4:all', 's4', true]);
  ck('and the contents bar follows straight away', await pg.textContent('#toc a[href="#s4"] span:last-child'), 'Room layout');

  r = await edit('.mast .ttlname', 'Exam Rooms Guide');
  ck('the page title saves under the heading area', [r.last[1].block, has(r, '<span class="ttlname">Exam Rooms Guide</span>')], ['mast:all', true]);
  ck('and the top bar follows', await pg.textContent('.rail .brand .name'), 'Exam Rooms Guide');

  r = await edit('#exlist .ex:nth-of-type(2) summary .example-title', 'Late arrival');
  ck('an example title takes a space and saves', [r.typed, has(r, '<span class="example-title">Late arrival</span>')], ['Late arrival', true]);
  ck('without opening the card', await pg.evaluate(() => document.querySelector('#exlist .ex:nth-of-type(2)').open), false);

  await pg.click('.segbtn[data-mode="test"]'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { const d = document.querySelector('#exlist .ex'); d.open = true; });
  await pg.waitForTimeout(200);
  r = await edit('#exlist .ex:nth-of-type(1) .ansbtn[data-correct] > span', 'Yes always');
  ck('an answer takes a space and saves', [r.ce, r.typed, has(r, 'data-correct="1"><span>Yes always</span>')], ['true', 'Yes always', true]);
  ck('without answering the question', await pg.evaluate(() => document.querySelector('#exlist .ex').classList.contains('answered')), false);
  ck('and it is still the right answer', await pg.evaluate(() => document.querySelector('#exlist .ex .ansbtn[data-correct]').textContent), 'Yes always');

  r = await edit('#pB > b', 'Venue staff');
  ck('an option button takes a space and saves', [r.typed, has(r, '<b>Venue staff</b>')], ['Venue staff', true]);
  ck('without switching the option', await pg.getAttribute('#pB', 'aria-pressed'), 'false');

  await pg.click('.edbar .edgo'); await pg.waitForTimeout(200);
  await pg.click('#pB'); await pg.waitForTimeout(200);
  ck('once editing is finished the option button works again', await pg.getAttribute('#pB', 'aria-pressed'), 'true');
  ck('no page errors', pg.errs, []);
  await pg.close();
}

await b.close();
console.log(fails.length ? '\n' + fails.length + ' of ' + n + ' template checks FAILED' : '\nall ' + n + ' template checks passed');
process.exit(fails.length ? 1 : 0);
})();
