const {chromium}=require('playwright');const path=require('path');
const F='file://'+path.resolve('variant-e.html');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const settle=async pg=>{await pg.waitForTimeout(500);let last=-1,same=0;
  for(let i=0;i<60;i++){await pg.waitForTimeout(100);
    const y=await pg.evaluate(()=>Math.round(window.scrollY));
    if(y===last){if(++same>=4) return y;} else {same=0;last=y;}} return last;};
(async()=>{
const b=await chromium.launch({executablePath:EXE});
const pg=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];pg.on('pageerror',e=>{if(!/reading 'focus'/.test(String(e)))errs.push(String(e));});
await pg.goto(F,{waitUntil:'load'});
await pg.evaluate(()=>{const g=document.getElementById('gate');if(g)g.style.display='none';document.body.classList.remove('gated');});
await pg.waitForTimeout(500);

console.log('=== landings ===');
const QS=['Opening eVigilation','Quick checklist','Always note these','Ready to QC','Glossary',
          'One check, start to finish','Where your own questions go','Opening the Lookup Tool',
          'Known platform limitations','Supervisor reminders','Second QC','Worked examples','Escalation'];
let bad=[];
for(const q of QS){
  await pg.evaluate(()=>window.scrollTo(0,0)); await pg.waitForTimeout(300);
  await pg.keyboard.press('Meta+k'); await pg.waitForTimeout(250);
  await pg.keyboard.type(q); await pg.waitForTimeout(350);
  const target=await pg.evaluate(()=>{const r=document.querySelector('.sitem.on .sname'); return r?r.textContent:null;});
  if(!target){console.log(('"'+q+'"').padEnd(30),'NO RESULT'); bad.push(q); await pg.keyboard.press('Escape'); continue;}
  await pg.keyboard.press('Enter'); await settle(pg);
  const top=await pg.evaluate(t=>{const hit=[...document.querySelectorAll('h2,h3')].find(h=>h.textContent.trim()===t);
    return hit? Math.round(hit.getBoundingClientRect().top):null;},target);
  const ok = top!==null && top>95 && top<235;
  if(!ok) bad.push(q);
  console.log(('"'+q+'"').padEnd(30),'->',(target+'').padEnd(30),'top='+String(top).padStart(4), ok?'ok':'OFF');
}
console.log(bad.length? 'OFF: '+bad.join(', ') : 'all landings sit just under the header');
console.log('\nerrors:', errs.length?errs:'none');
await b.close();})();
