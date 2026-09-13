const {chromium}=require('playwright');const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const F='file://'+path.resolve('variant-e.html');
(async()=>{
const b=await chromium.launch({executablePath:EXE});
for(const theme of ['light','dark']){
  // gate (first visit, nothing stored)
  let pg=await b.newPage({viewport:{width:1440,height:900}});
  await pg.goto(F,{waitUntil:'load'});
  await pg.evaluate(t=>localStorage.setItem('amqc-theme',t),theme);
  await pg.reload({waitUntil:'load'});
  await pg.waitForTimeout(900);
  await pg.screenshot({path:`shots/wx-gate-${theme}.png`});
  await pg.close();
  // search modal
  pg=await b.newPage({viewport:{width:1440,height:900}});
  await pg.goto(F,{waitUntil:'load'});
  await pg.evaluate(t=>{localStorage.setItem('amqc-theme',t);localStorage.setItem('amqc-who','QA Tester');localStorage.setItem('amqc-visited','[]');},theme);
  await pg.reload({waitUntil:'load'});
  await pg.evaluate(()=>{const g=document.getElementById('gate');if(g)g.style.display='none';document.body.classList.remove('gated');});
  await pg.waitForTimeout(400);
  await pg.click('#searchbtn');
  await pg.waitForTimeout(300);
  await pg.fill('#sinput','QC sheet');
  await pg.waitForTimeout(400);
  await pg.keyboard.press('ArrowDown');
  await pg.waitForTimeout(200);
  await pg.screenshot({path:`shots/wx-search-${theme}.png`});
  await pg.close();
  // lightbox
  pg=await b.newPage({viewport:{width:1440,height:900}});
  await pg.goto(F,{waitUntil:'load'});
  await pg.evaluate(t=>{localStorage.setItem('amqc-theme',t);localStorage.setItem('amqc-who','QA Tester');localStorage.setItem('amqc-visited','[]');},theme);
  await pg.reload({waitUntil:'load'});
  await pg.evaluate(()=>{const g=document.getElementById('gate');if(g)g.style.display='none';document.body.classList.remove('gated');});
  await pg.waitForTimeout(400);
  await pg.evaluate(()=>document.querySelector('.shot.filled img').scrollIntoView({block:'center'}));
  await pg.waitForTimeout(500);
  await pg.click('.shot.filled img');
  await pg.waitForTimeout(600);
  await pg.screenshot({path:`shots/wx-lbox-${theme}.png`});
  await pg.close();
}
await b.close();console.log('chrome shots done');
})();
