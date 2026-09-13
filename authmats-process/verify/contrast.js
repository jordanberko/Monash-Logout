const {chromium}=require('playwright');const path=require('path');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const pg=await b.newPage({viewport:{width:1440,height:1000}});
await pg.goto('file://'+path.resolve(process.env.T || 'variant-e.html'),{waitUntil:'load'});
await pg.evaluate(t=>{const g=document.getElementById('gate');if(g)g.style.display='none';
 document.body.classList.remove('gated');
 document.documentElement.classList.remove('anim');
 document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));
 if(t)document.documentElement.setAttribute('data-theme',t);}, process.env.THEME||null);
await pg.waitForTimeout(600);
const out=await pg.evaluate(()=>{
  const parse=c=>{const m=(c||'').match(/[\d.]+/g); if(!m) return null;
    return {r:+m[0],g:+m[1],b:+m[2],a:m.length>3?+m[3]:1};};
  // composite a stack of rgba layers over an opaque base, front last
  const over=(fg,bg)=>({r:fg.r*fg.a+bg.r*(1-fg.a), g:fg.g*fg.a+bg.g*(1-fg.a),
                        b:fg.b*fg.a+bg.b*(1-fg.a), a:1});
  const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};
    return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);};
  // the real painted background behind an element
  const bgOf=el=>{
    const layers=[]; let n=el;
    while(n){ const c=parse(getComputedStyle(n).backgroundColor);
      if(c&&c.a>0){ layers.push(c); if(c.a===1) break; } n=n.parentElement; }
    if(!layers.length) return {r:255,g:255,b:255,a:1};
    let base=layers[layers.length-1]; if(base.a<1) base=over(base,{r:255,g:255,b:255,a:1});
    for(let i=layers.length-2;i>=0;i--) base=over(layers[i],base);
    return base;
  };
  const res=[];
  document.querySelectorAll('main p, main li, main td, main th, main h2, main h3, main h4, main dd, main dt, main span, main b, main strong, main a, main button, main label').forEach(el=>{
    if(!el.textContent.trim()||el.offsetParent===null) return;
    if(el.querySelector('p,li,td,div')) return;                 // containers only
    const cs=getComputedStyle(el);
    const fg=parse(cs.color); if(!fg||fg.a===0) return;
    const bg=bgOf(el);
    const fgc=fg.a<1?over(fg,bg):fg;
    const l1=lum(fgc), l2=lum(bg);
    const ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
    const px=parseFloat(cs.fontSize), bold=+cs.fontWeight>=700;
    const need=(px>=24||(px>=18.66&&bold))?3:4.5;
    if(ratio<need) res.push({sec:(el.closest('section')||{}).id, tag:el.tagName,
      cls:(el.className||'').toString().slice(0,20), size:Math.round(px),
      ratio:+ratio.toFixed(2), need, t:el.textContent.trim().slice(0,38)});
  });
  const seen=new Set();
  return res.filter(x=>{const k=x.sec+x.tag+x.cls+x.ratio; if(seen.has(k))return false; seen.add(k); return true;});
});
console.log((process.env.THEME||'light')+' theme: '+(out.length? out.length+' below WCAG AA' : 'all text meets WCAG AA'));
out.slice(0,16).forEach(x=>console.log('  ',(x.sec||'-').padEnd(5),x.tag.padEnd(6),x.cls.padEnd(20),
  x.size+'px  ratio '+String(x.ratio).padEnd(5)+' need '+x.need+'  | '+x.t));
await b.close();})();
