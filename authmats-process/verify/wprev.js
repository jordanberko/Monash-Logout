const {chromium}=require('playwright');const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const F='file://'+path.resolve('variant-e.html');
const VIEWS=[
  ['top',   null],
  ['deep',  '#s3'],
  ['table', '#s5'],
  ['done',  '#s12'],
];
(async()=>{
const b=await chromium.launch({executablePath:EXE});
for(const [w,h,dev] of [[1440,980,'desktop'],[390,844,'mobile']]){
 for(const theme of ['light','dark']){
  const pg=await b.newPage({viewport:{width:w,height:h}});
  await pg.goto(F,{waitUntil:'load'});
  await pg.evaluate(t=>{localStorage.setItem('amqc-theme',t);
    localStorage.setItem('amqc-who',JSON.stringify({name:'Robin Avery',email:'robin.avery@monash.edu',verified:true}));
    localStorage.setItem('amqc-visited','[]');},theme);
  await pg.reload({waitUntil:'load'});
  await pg.evaluate(()=>{const g=document.getElementById('gate');if(g)g.style.display='none';document.body.classList.remove('gated');});
  await pg.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,20));}window.scrollTo(0,0);});
  await pg.waitForTimeout(700);
  for(const [tag,sel] of VIEWS){
    if(sel){ await pg.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView();},sel);
             await pg.waitForTimeout(700); }
    else   { await pg.evaluate(()=>window.scrollTo(0,0)); await pg.waitForTimeout(400); }
    await pg.screenshot({path:`shots/wx-${dev}-${theme}-${tag}.png`});
  }
  await pg.close();
 }
}
await b.close();console.log('previews done');
})();
