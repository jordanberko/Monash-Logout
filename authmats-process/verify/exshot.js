const {chromium}=require('playwright');const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const F='file://'+path.resolve('variant-e.html');
const args=process.argv.slice(2);
const W=+(args[0]||1440), TAG=args[1]||'1440';
(async()=>{
const b=await chromium.launch({executablePath:EXE});
for(const theme of ['light','dark']){
  const pg=await b.newPage({viewport:{width:W,height:1000}});
  await pg.goto(F,{waitUntil:'load'});
  await pg.evaluate(t=>{localStorage.setItem('amqc-theme',t);localStorage.setItem('amqc-who','QA Tester');localStorage.setItem('amqc-visited','[]');},theme);
  await pg.reload({waitUntil:'load'});
  await pg.evaluate(()=>{const g=document.getElementById('gate');if(g)g.style.display='none';document.body.classList.remove('gated');});
  await pg.waitForTimeout(400);
  await pg.evaluate(()=>{document.querySelectorAll('#exlist .ex').forEach((e,i)=>{if(i<3)e.open=true;});
    document.getElementById('s9').scrollIntoView();});
  await pg.waitForTimeout(700);
  const box=await pg.evaluate(()=>{const r=document.getElementById('exlist').getBoundingClientRect();
    return {x:0,y:Math.max(0,r.top-140),w:window.innerWidth,h:Math.min(960,r.height+150)};});
  await pg.screenshot({path:`shots/wx-ex-${TAG}-${theme}.png`,clip:{x:box.x,y:box.y,width:box.w,height:box.h}});
  await pg.close();
}
await b.close();console.log('ex shots done '+TAG);
})();
