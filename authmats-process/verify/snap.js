const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const FILE='file://'+path.resolve(process.argv[2]||'variant-e.html');
const OUT=process.argv[3]||'baseline/snap.json';
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const pg=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto(FILE,{waitUntil:'load'});
await pg.evaluate(()=>{const g=document.getElementById('gate');if(g)g.style.display='none';document.body.classList.remove('gated');});
await pg.waitForTimeout(600);
const snap=await pg.evaluate(()=>{
  const txt=n=>(n.textContent||'').replace(/\s+/g,' ').trim();
  const all=s=>[...document.querySelectorAll(s)];
  return {
    // every visible word, in order
    bodyText: txt(document.querySelector('main')),
    gateText: txt(document.getElementById('gate')),
    sections: all('main section[id]').map(s=>({id:s.id, h2:txt(s.querySelector('h2')||{}), sub:txt(s.querySelector('.secsub')||{})})),
    headings: all('main h3').map(h=>txt(h)),
    tables: all('main .tw table').map(t=>({head:[...t.querySelectorAll('thead th')].map(txt), rows:t.querySelectorAll('tbody tr').length})),
    figures: all('.shot.filled').map(f=>({ref:txt(f.querySelector('.ref')||{}), cap:txt(f.querySelector('figcaption')||{}),
      alt:f.querySelector('img').getAttribute('alt'), src:f.querySelector('img').src.slice(0,60),
      w:f.querySelector('img').getAttribute('width'), h:f.querySelector('img').getAttribute('height')})),
    cases: all('#exlist .ex').map(e=>({v:e.dataset.v, scored:!!e.dataset.scored,
      title:txt(e.querySelector('.example-title')), verdict:txt(e.querySelector('.verdict')),
      see:txt(e.querySelectorAll('.exbody dd')[0]||{}), doo:txt(e.querySelectorAll('.exbody dd')[1]||{}),
      q:txt(e.querySelector('.quizq')||{}),
      opts:[...e.querySelectorAll('.ansbtn')].map(b=>({t:txt(b), o:b.dataset.o, correct:b.hasAttribute('data-correct')}))})),
    checklist: all('.chk label').map(l=>({k:l.querySelector('input').dataset.k, txt:txt(l.querySelector('.txt')), ref:txt(l.querySelector('.ref'))})),
    fields: all('.field').map(f=>({h4:txt(f.querySelector('h4')), where:txt(f.querySelector('.where')), miss:txt(f.querySelector('.miss'))})),
    nav: all('nav ol a').map(a=>({href:a.getAttribute('href'), n:txt(a.querySelector('.n')), label:txt(a.querySelector('span:not(.n)'))})),
    gates: all('.gates li').map(l=>({gate:l.dataset.gate, b:txt(l.querySelector('b')), sub:txt(l.querySelector('.gsub')), meta:txt(l.querySelector('.gmeta'))})),
    ids: all('[id]').map(e=>e.id).sort(),
    dataAttrs: [...new Set(all('*').flatMap(e=>[...e.attributes].map(a=>a.name).filter(n=>n.startsWith('data-'))))].sort(),
    keyframes: [...document.styleSheets].flatMap(sh=>{try{return [...sh.cssRules]}catch(e){return []}})
      .filter(r=>r.type===7).map(r=>r.name).sort(),
    animSelectors: [...document.styleSheets].flatMap(sh=>{try{return [...sh.cssRules]}catch(e){return []}})
      .filter(r=>r.style&&(r.style.animation||r.style.animationName||r.style.transition))
      .map(r=>r.selectorText).filter(Boolean).sort(),
    appsScript: (document.documentElement.innerHTML.match(/google\.script\.run[\s\S]{0,120}?\.(\w+)\(/g)||[]).length,
    storageKeys: (document.documentElement.innerHTML.match(/"amqc-[a-z0-9-]+"/g)||[]).sort(),
  };
});
fs.writeFileSync(OUT, JSON.stringify(snap,null,1));
console.log('bodyText chars:',snap.bodyText.length,'| sections:',snap.sections.length,'| h3:',snap.headings.length,
 '| tables:',snap.tables.length,'| figures:',snap.figures.length,'| cases:',snap.cases.length,
 '| checklist:',snap.checklist.length,'| fields:',snap.fields.length,'| ids:',snap.ids.length);
console.log('keyframes:',snap.keyframes.join(','));
console.log('storage keys:',[...new Set(snap.storageKeys)].join(','));
console.log('errors:',errs.filter(e=>!/reading 'focus'/.test(e)));
await b.close();
})();
