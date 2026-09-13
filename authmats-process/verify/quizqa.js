const {chromium}=require('playwright');const path=require('path');
const F='file://'+path.resolve('variant-e.html');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const open=async(b,seed)=>{const pg=await b.newPage({viewport:{width:1440,height:900}});
 pg.on('pageerror',e=>{if(!/reading 'focus'/.test(String(e)))console.log('  ERR',String(e));});
 await pg.goto(F,{waitUntil:'load'});
 await pg.evaluate(s=>{try{localStorage.clear(); if(s) localStorage.setItem('amqc-quiz',s);}catch(e){}},seed||null);
 await pg.reload({waitUntil:'load'});
 await pg.evaluate(()=>{document.querySelectorAll('.gatestep').forEach(x=>x.classList.remove('on'));
  const g=document.getElementById('gate');if(g)g.style.display='none';document.body.classList.remove('gated');
  document.body.classList.add('entered');});
 await pg.waitForTimeout(500); return pg;};
const answer=(pg,nRight)=>pg.evaluate(n=>{
 const exs=[...document.querySelectorAll('#exlist .ex[data-scored]')];
 exs.forEach((ex,i)=>{
   const sel = i<n ? '.ansbtn[data-correct]' : '.ansbtn:not([data-correct])';
   const btn=ex.querySelector(sel); if(btn) btn.click();
 });},nRight);
const state=pg=>pg.evaluate(()=>({tally:document.getElementById('tally').textContent,
 txt:document.getElementById('tallytxt').textContent,
 gate:document.querySelector('[data-meta="test"]').textContent,
 met:document.querySelector('.gates li[data-gate="test"]').classList.contains('met')}));
(async()=>{const b=await chromium.launch({executablePath:EXE});
for(const n of [14,12,11]){
  const pg=await open(b); await pg.click('.segbtn[data-mode="test"]'); await pg.waitForTimeout(400);
  await answer(pg,n); await pg.waitForTimeout(700);
  const r=await state(pg);
  console.log(String(n).padStart(3)+' correct -> tally '+r.tally+' ('+r.txt+')  gate '+r.gate+'  passes: '+r.met);
  await pg.close();
}
// stale answers from the old assessment must not count
const stale=JSON.stringify({q1:'ok',q2:'esc',q3:'disc',q4:'disc',q5:'ok',q6:'ok',q7:'ok',q8:'ok',q9:'ok',q10:'ok',q11:'ok',q12:'ok',q13:'ok',q14:'ok'});
let pg=await open(b,stale);
console.log('old-format store -> tally', (await state(pg)).tally, '| gate', (await state(pg)).gate);
await pg.close();
// current-version answers must survive a reload
pg=await open(b); await pg.click('.segbtn[data-mode="test"]'); await pg.waitForTimeout(400);
await answer(pg,14); await pg.waitForTimeout(600);
const before=(await state(pg)).tally;
await pg.reload({waitUntil:'load'});
await pg.evaluate(()=>{document.querySelectorAll('.gatestep').forEach(x=>x.classList.remove('on'));
 const g=document.getElementById('gate');if(g)g.style.display='none';document.body.classList.remove('gated');});
await pg.waitForTimeout(800);
console.log('after reload     -> was '+before+', now '+(await state(pg)).tally);
console.log('stored shape     ->', await pg.evaluate(()=>localStorage.getItem('amqc-quiz').slice(0,48)));
await pg.close(); await b.close();})();
