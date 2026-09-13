const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('variant-e.html');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const log = (...a) => console.log(...a);

(async () => {
  const b = await chromium.launch({executablePath: EXE});

  // ---- 1. plain load: onboarding gate intact, no page errors ----
  {
    const pg = await b.newPage({viewport:{width:1440,height:900}});
    const errs = []; pg.on('pageerror', e => errs.push(String(e)));
    await pg.goto(FILE, {waitUntil:'load'});
    await pg.waitForTimeout(700);
    log('gate visible          ', await pg.isVisible('#gate'));
    log('body.gated            ', await pg.evaluate(()=>document.body.classList.contains('gated')));
    log('plain-load errors     ', errs.length ? errs : 'none');
    // walk the gate: identity -> homepage -> document
    const steps = await pg.evaluate(()=>[...document.querySelectorAll('.gatestep')].map(s=>s.id||s.className));
    log('gate steps            ', steps.join(' | '));
    await pg.click('.gatestep.on .gatebtn').catch(()=>{});
    await pg.waitForTimeout(500);
    const second = await pg.evaluate(()=>{const s=document.querySelector('.gatestep.on'); return s? s.id||s.className : null;});
    log('after first button    ', second);
    await pg.click('.gatestep.on .gatebtn').catch(()=>{});
    await pg.waitForTimeout(900);
    log('gate dismissed        ', await pg.evaluate(()=>!document.body.classList.contains('gated')));
    log('errors after entry    ', errs.length ? errs : 'none');
    await pg.close();
  }

  const open = async (w=1440) => {
    const pg = await b.newPage({viewport:{width:w,height:1000}});
    const errs=[]; pg.on('pageerror', e=>errs.push(String(e)));
    await pg.goto(FILE, {waitUntil:'load'});
    await pg.evaluate(()=>{ try{localStorage.clear()}catch(e){}
      document.querySelectorAll('.gatestep').forEach(s=>s.classList.remove('on'));
      const g=document.getElementById('gate'); if(g) g.style.display='none';
      document.body.classList.remove('gated'); });
    await pg.waitForTimeout(400);
    pg._errs = errs;
    return pg;
  };

  // ---- 2. search (modal) ----
  {
    const pg = await open();
    await pg.keyboard.press('Meta+k'); await pg.waitForTimeout(300);
    console.log('\nmodal opens (Cmd-K) ', await pg.evaluate(()=>!document.getElementById('smodal').hidden));
    console.log('browse list         ', await pg.evaluate(()=>document.querySelectorAll('#sresults .sitem').length), 'sections');
    await pg.keyboard.type('calculator'); await pg.waitForTimeout(400);
    console.log('"calculator"        ', await pg.evaluate(()=>document.querySelectorAll('#sresults .sitem').length), 'shown |',
      await pg.evaluate(()=>{const m=document.getElementById('smore'); return m.classList.contains('hidden')?'no more':m.textContent.trim();}));
    await pg.evaluate(()=>{const m=document.getElementById('smore'); if(!m.classList.contains('hidden')) m.click();});
    await pg.waitForTimeout(250);
    console.log('after See all       ', await pg.evaluate(()=>document.querySelectorAll('#sresults .sitem').length), 'shown');
    await pg.evaluate(()=>{document.getElementById('sinput').value='zzzzzz';
      document.getElementById('sinput').dispatchEvent(new Event('input'));});
    await pg.waitForTimeout(300);
    console.log('no matches          ', await pg.evaluate(()=>!!document.querySelector('.snone')));
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
    console.log('Escape closes       ', await pg.evaluate(()=>document.getElementById('smodal').hidden));
    console.log('errors              ', pg._errs.length? pg._errs : 'none');
    await pg.close();
  }

  // ---- 3. example filters + stable ordinals ----
  {
    const pg = await open();
    await pg.click('#exfilters .fbtn[data-v="ok"]');
    await pg.waitForTimeout(300);
    const r = await pg.evaluate(()=>{
      const vis=[...document.querySelectorAll('#exlist .ex')].filter(e=>e.offsetParent!==null);
      return {n:vis.length, nums:vis.map(e=>e.querySelector('summary').dataset.n).join(','),
              titles:vis.slice(0,2).map(e=>e.querySelector('.example-title').textContent)};
    });
    log('\nfilter "not a discrepancy":', r.n, 'shown; ordinals', r.nums);
    log('  titles              ', JSON.stringify(r.titles));
    await pg.click('#exfilters .fbtn[data-v="all"]');
    await pg.waitForTimeout(300);
    log('back to all           ', await pg.evaluate(()=>[...document.querySelectorAll('#exlist .ex')].filter(e=>e.offsetParent!==null).length));
    await pg.close();
  }

  // ---- 4. expand all / collapse all ----
  {
    const pg = await open();
    await pg.click('#expandall');
    await pg.waitForTimeout(300);
    log('\nexpand all            ', await pg.evaluate(()=>document.querySelectorAll('#exlist .ex[open]').length), 'open; button reads', await pg.textContent('#expandall'));
    await pg.click('#expandall');
    await pg.waitForTimeout(300);
    log('collapse all          ', await pg.evaluate(()=>document.querySelectorAll('#exlist .ex[open]').length), 'open');
    await pg.close();
  }

  // ---- 5. study mode + scoring ----
  {
    const pg = await open();
    await pg.click('.segbtn[data-mode="test"]');
    await pg.waitForTimeout(400);
    log('\ntesting class         ', await pg.evaluate(()=>document.body.classList.contains('testing')));
    log('quiz blocks           ', await pg.evaluate(()=>document.querySelectorAll('#exlist .quiz').length));
    log('verdicts hidden       ', await pg.evaluate(()=>getComputedStyle(document.querySelector('.ex>summary .verdict')).display));
    log('studynote shown       ', await pg.isVisible('#studynote'));
    log('exbody dl columns     ', await pg.evaluate(()=>getComputedStyle(document.querySelector('.exbody dl')).gridTemplateColumns));
    // answer the first question correctly
    await pg.evaluate(()=>{
      const ex=document.querySelector('#exlist .ex[data-scored]');
      ex.querySelector('.ansbtn[data-correct]').click();
    });
    await pg.waitForTimeout(300);
    log('after one answer      ', await pg.textContent('#tally'), await pg.textContent('#tallytxt'));
    log('answered card         ', await pg.evaluate(()=>{const e=document.querySelector('#exlist .ex[data-scored]'); return e.className;}));
    log('revealed dl columns   ', await pg.evaluate(()=>getComputedStyle(document.querySelector('.ex.answered .exbody dl')).gridTemplateColumns));
    await pg.click('#resetquiz');
    await pg.waitForTimeout(300);
    log('after reset           ', await pg.textContent('#tally'));
    await pg.click('.segbtn[data-mode="ref"]');
    await pg.waitForTimeout(300);
    log('back to reference     ', await pg.evaluate(()=>document.body.classList.contains('testing')));
    log('errors                ', pg._errs.length? pg._errs : 'none');
    await pg.close();
  }

  // ---- 6. conditional delivery steps ----
  {
    const pg = await open();
    const count = s => pg.evaluate(sel=>({A:[...document.querySelectorAll(sel+' .pathA')].filter(e=>e.offsetParent!==null).length,
                                          B:[...document.querySelectorAll(sel+' .pathB')].filter(e=>e.offsetParent!==null).length}), s);
    log('\npath A (default)      ', JSON.stringify(await count('#s7')));
    await pg.click('#pB'); await pg.waitForTimeout(400);
    log('path B                ', JSON.stringify(await count('#s7')));
    log('  steps shown         ', await pg.evaluate(()=>[...document.querySelectorAll('#s7 .steps > li')].filter(e=>e.offsetParent!==null).length));
    await pg.click('#pA'); await pg.waitForTimeout(400);
    log('back to A, steps      ', await pg.evaluate(()=>[...document.querySelectorAll('#s7 .steps > li')].filter(e=>e.offsetParent!==null).length));
    await pg.close();
  }

  // ---- 7. checklist + saved progress ----
  {
    const pg = await open();
    await pg.evaluate(()=>{[...document.querySelectorAll('.chk input')].slice(0,3).forEach(b=>b.click());});
    await pg.waitForTimeout(400);
    log('\nchecklist 3 ticked    ', await pg.textContent('.chkbar .pct'));
    const keys = await pg.evaluate(()=>Object.keys(localStorage).filter(k=>k.indexOf('amqc-')===0).sort());
    log('storage keys          ', keys.join(','));
    await pg.reload({waitUntil:'load'});
    await pg.evaluate(()=>{document.querySelectorAll('.gatestep').forEach(s=>s.classList.remove('on'));
      const g=document.getElementById('gate'); if(g) g.style.display='none'; document.body.classList.remove('gated');});
    await pg.waitForTimeout(600);
    log('after reload          ', await pg.textContent('.chkbar .pct'));
    await pg.click('.chkbar button');
    await pg.waitForTimeout(300);
    log('after reset           ', await pg.textContent('.chkbar .pct'));
    await pg.close();
  }

  // ---- 8. lightbox, theme, nav ----
  {
    const pg = await open();
    await pg.evaluate(()=>{document.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager');});
    await pg.waitForFunction(()=>[...document.images].every(i=>i.complete),null,{timeout:20000});
    await pg.evaluate(()=>document.querySelector('.shot.filled img').click());
    await pg.waitForTimeout(400);
    log('\nlightbox open         ', await pg.isVisible('#lbox'));
    await pg.click('#lclose'); await pg.waitForTimeout(400);
    log('lightbox closed       ', await pg.evaluate(()=>!document.getElementById('lbox').classList.contains('on')));
    await pg.click('.themebtn:not(#expandall)').catch(async()=>{ await pg.click('.railutil .themebtn'); });
    await pg.waitForTimeout(400);
    log('theme attr            ', await pg.evaluate(()=>document.documentElement.getAttribute('data-theme')));
    const nav = await pg.evaluate(()=>{
      const ol=document.querySelector('nav ol');
      return {links: ol.querySelectorAll('a').length, scrollable: ol.scrollWidth > ol.clientWidth + 1};
    });
    log('nav links             ', nav.links, '| scrollable', nav.scrollable);
    log('errors                ', pg._errs.length? pg._errs : 'none');
    await pg.close();
  }

  // ---- 9. Apps Script hooks still referenced ----
  {
    const pg = await open();
    const src = await pg.content();
    log('\ngoogle.script.run refs ', (src.match(/google\.script\.run/g)||[]).length);
    ['getViewer','getTrainingRecord','addTrainingRecord'].forEach(f=>log('  ' + f.padEnd(20), src.indexOf(f) > -1));
    log('rollmsg (offline)     ', await pg.textContent('#rollmsg'));
    await pg.close();
  }

  await b.close();
})();
