const {chromium}=require('playwright');const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const F='file://'+path.resolve('variant-e.html');
/* Page zoom is how a reader actually enlarges text in a browser, and in CSS
   terms it is the same as a proportionally narrower viewport. 200% of a
   1440 and of a 390 screen are the two worst cases. */
const CASES=[[1440,900,2,'1440 @200%'],[1440,900,1.5,'1440 @150%'],[390,844,2,'390 @200%'],[390,844,1.5,'390 @150%'],[1280,800,4,'1280 @400%']];
(async()=>{
const b=await chromium.launch({executablePath:EXE});
let fails=0;
for(const [w,h,z,tag] of CASES){ for(const theme of ['light','dark']){
  const pg=await b.newPage({viewport:{width:Math.round(w/z),height:Math.round(h/z)}});
  await pg.goto(F,{waitUntil:'load'});
  await pg.evaluate(t=>{localStorage.setItem('amqc-theme',t);localStorage.setItem('amqc-who','QA Tester');localStorage.setItem('amqc-visited','[]');},theme);
  await pg.reload({waitUntil:'load'});
  await pg.evaluate(()=>{const g=document.getElementById('gate');if(g)g.style.display='none';document.body.classList.remove('gated');
    document.querySelectorAll('#exlist .ex').forEach(e=>e.open=true);});
  await pg.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,22));}window.scrollTo(0,0);});
  await pg.waitForTimeout(500);
  const r=await pg.evaluate(()=>{
    const de=document.documentElement;const over=[];
    document.querySelectorAll('body *').forEach(el=>{const bb=el.getBoundingClientRect();
      if(bb.width===0&&bb.height===0)return;
      if(bb.right>de.clientWidth+1||bb.left<-1){let n=el,ok=false;
        while(n&&n!==document.body){const cs=getComputedStyle(n);
          if(['auto','scroll','hidden'].includes(cs.overflowX)){ok=true;break;}n=n.parentElement;}
        if(!ok)over.push(el.tagName+'.'+String(el.className||'').split(' ')[0]+' R'+Math.round(bb.right));}});
    return {docW:de.scrollWidth,cliW:de.clientWidth,over:over.slice(0,5),n:over.length};
  });
  const bad=r.docW>r.cliW+1||r.n>0; if(bad)fails++;
  console.log(`${tag.padEnd(12)} (${Math.round(w/z)}px css) ${theme.padEnd(5)} | hscroll ${r.docW>r.cliW+1?'YES':'no'} | overflowing ${r.n} | ${bad?'FAIL':'ok'}`);
  if(r.over.length)console.log('   ',r.over.join(' | '));
  await pg.close();
}}
console.log(fails?`\n${fails} enlarged-text cases failed`:'\nall enlarged-text cases pass');
await b.close();
})();
