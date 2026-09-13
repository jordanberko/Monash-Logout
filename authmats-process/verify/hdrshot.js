const {chromium}=require('playwright');const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const F='file://'+path.resolve('variant-e.html');
(async()=>{
const b=await chromium.launch({executablePath:EXE});
for(const [w,h,tag] of [[1700,900,'1700'],[1440,900,'1440'],[768,900,'768'],[390,780,'390']]){
 for(const theme of ['light','dark']){
  const pg=await b.newPage({viewport:{width:w,height:h}});
  await pg.goto(F,{waitUntil:'load'});
  await pg.evaluate(t=>{localStorage.setItem('amqc-theme',t);localStorage.setItem('amqc-who','QA Tester');localStorage.setItem('amqc-visited','[]');},theme);
  await pg.reload({waitUntil:'load'});
  await pg.evaluate(()=>{const g=document.getElementById('gate');if(g)g.style.display='none';document.body.classList.remove('gated');});
  await pg.waitForTimeout(500);
  await pg.screenshot({path:`shots/wx-hdr-${tag}-${theme}.png`,clip:{x:0,y:0,width:w,height:Math.min(h,260)}});
  await pg.close();
 }
}
await b.close();console.log('done');
})();
