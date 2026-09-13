const {chromium}=require('playwright');const path=require('path');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const pg=await b.newPage({viewport:{width:1200,height:760}});
const errs=[];pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file://'+path.resolve('variant-e.html'),{waitUntil:'load'});
await pg.evaluate(()=>{const g=document.getElementById('gate');if(g)g.remove();document.body.classList.remove('gated');
  document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));});
await pg.waitForTimeout(500);
console.log('startViewTransition available :', await pg.evaluate(()=>'startViewTransition' in document));
console.log('@property registered          :', await pg.evaluate(()=>{
  try{ return CSS.supports('--vt-slat','72px') || [...document.styleSheets].some(sh=>{
    try{return [...sh.cssRules].some(r=>r.constructor.name==='CSSPropertyRule'&&r.name==='--vt-slat')}catch(e){return false}
  }); }catch(e){ return 'n/a'; }
}));
console.log('theme before                  :', await pg.evaluate(()=>document.documentElement.getAttribute('data-theme')));

// click, then sample the sweep at intervals
await pg.click('#theme');
for (const t of [80, 200, 340, 480]) {
  await pg.waitForTimeout(t === 80 ? 80 : 120);
  const state = await pg.evaluate(()=>({
    vt: document.documentElement.getAttribute('data-vt'),
    theme: document.documentElement.getAttribute('data-theme'),
    transitioning: !!document.documentElement.getAttribute('data-vt')
  }));
  await pg.screenshot({path:`vt-${t}.png`});
  console.log(`  t≈${String(t).padStart(3)}ms  data-vt=${state.vt}  data-theme=${state.theme}`);
}
await pg.waitForTimeout(700);
console.log('after settle                  :', await pg.evaluate(()=>({
  vt: document.documentElement.getAttribute('data-vt'),
  theme: document.documentElement.getAttribute('data-theme'),
  stored: localStorage.getItem('amqc-theme')})));
console.log('theming class left behind     :', await pg.evaluate(()=>document.documentElement.classList.contains('theming')));
console.log('errors                        :', errs.length?errs:'none');
await b.close();
})();
