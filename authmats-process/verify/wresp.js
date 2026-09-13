const {chromium}=require('playwright');const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const F='file://'+path.resolve('variant-e.html');
const SIZES=[[1700,1000],[1440,900],[768,1024],[390,844]];
const THEMES=['light','dark'];
(async()=>{
const b=await chromium.launch({executablePath:EXE});
let fails=0;
for(const [w,h] of SIZES){ for(const theme of THEMES){
  const pg=await b.newPage({viewport:{width:w,height:h}});
  const errs=[];pg.on('pageerror',e=>{if(!/reading 'focus'/.test(String(e)))errs.push(String(e));});
  await pg.goto(F,{waitUntil:'load'});
  await pg.evaluate(t=>{localStorage.setItem('amqc-theme',t);localStorage.setItem('amqc-who','QA Tester');localStorage.setItem('amqc-visited','[]');},theme);
  await pg.reload({waitUntil:'load'});
  await pg.evaluate(()=>{const g=document.getElementById('gate');if(g)g.style.display='none';document.body.classList.remove('gated');
    document.querySelectorAll('#exlist .ex').forEach(e=>e.open=true);});
  // scroll the whole page so every lazy image and reveal resolves
  await pg.evaluate(async()=>{const step=600;for(let y=0;y<document.body.scrollHeight;y+=step){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,26));}window.scrollTo(0,0);});
  await pg.waitForTimeout(700);
  const r=await pg.evaluate(()=>{
    const de=document.documentElement;
    const over=[];
    document.querySelectorAll('body *').forEach(el=>{
      const b=el.getBoundingClientRect();
      if(b.width===0&&b.height===0) return;
      if(b.right>de.clientWidth+1||b.left<-1){
        // a .tw scroller is allowed to hold something wider than itself
        let n=el,inScroller=false;
        while(n&&n!==document.body){const cs=getComputedStyle(n);
          if(cs.overflowX==='auto'||cs.overflowX==='scroll'||cs.overflowX==='hidden'){inScroller=true;break;} n=n.parentElement;}
        if(!inScroller) over.push(el.tagName+'.'+(el.className||'').toString().split(' ').slice(0,2).join('.')+
          ' L'+Math.round(b.left)+' R'+Math.round(b.right));
      }
    });
    // tables must live inside a scroller
    const loose=[...document.querySelectorAll('main table')].filter(t=>{
      let n=t.parentElement;while(n&&n!==document.body){const cs=getComputedStyle(n);
        if(cs.overflowX==='auto'||cs.overflowX==='scroll')return false;n=n.parentElement;}return true;});
    // how much of the viewport the frame actually uses
    const main=document.querySelector('.main').getBoundingClientRect();
    const sec=document.querySelector('#s1').getBoundingClientRect();
    // multi-column blocks: are any columns cramped?
    const narrow=[];
    document.querySelectorAll('.sources,.exbody dl,.rules,.fields').forEach(g=>{
      const cs=getComputedStyle(g); if(cs.display!=='grid')return;
      const cols=cs.gridTemplateColumns.split(' ').filter(Boolean);
      if(cols.length<2) return;   /* a single column is stacked, not cramped */
      cols.forEach(c=>{const v=parseFloat(c);
        if(v&&v<300) narrow.push((g.className||g.tagName)+' '+cols.length+' cols, one at '+Math.round(v)+'px');});
    });
    return {docW:de.scrollWidth, cliW:de.clientWidth, over:over.slice(0,8), overN:over.length,
      loose:loose.length, mainW:Math.round(main.width), mainL:Math.round(main.left),
      secW:Math.round(sec.width), side:Math.round(de.clientWidth-main.width),
      narrow:[...new Set(narrow)].slice(0,6)};
  });
  const hscroll = r.docW>r.cliW+1;
  const bad = hscroll||r.overN>0||r.loose>0||errs.length>0;
  if(bad) fails++;
  console.log(`${String(w).padStart(4)}x${h} ${theme.padEnd(5)} | hscroll ${hscroll?'YES '+r.docW+'>'+r.cliW:'no '} | overflowing ${r.overN} | loose tables ${r.loose} | frame ${r.mainW}px at x=${r.mainL} (side ${r.side}px) | ${bad?'FAIL':'ok'}`);
  if(r.over.length) console.log('      ',r.over.join('\n       '));
  if(r.narrow.length) console.log('       narrow cols:',r.narrow.join(' | '));
  if(errs.length) console.log('       errors:',errs.join(' | '));
  await pg.close();
}}
console.log(fails? `\n${fails} viewport/theme combinations failed` : '\nall viewport/theme combinations pass');
await b.close();
})();
