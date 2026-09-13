/* Apps Script compatibility check for appsscript/Index.html.
   google.script.run is mocked in-page: nothing leaves the browser and no
   training record is submitted anywhere. The addTrainingRecord path is
   exercised only far enough to prove the wiring and the payload shape --
   the mock records the call and returns a canned roll. */
const {chromium}=require('playwright');const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const F='file://'+path.resolve('appsscript/Index.html');
const MOCK=`
window.__calls=[];
(function(){
  function runner(){
    var ok=null, fail=null;
    var api={
      withSuccessHandler:function(f){ok=f;return api;},
      withFailureHandler:function(f){fail=f;return api;},
      getViewer:function(){window.__calls.push(['getViewer']);
        setTimeout(function(){ok({name:'Robin Avery',email:'robin.avery@monash.edu'});},10);},
      getTrainingRecord:function(){window.__calls.push(['getTrainingRecord']);
        setTimeout(function(){ok([{name:'Prior Person',date:'2026-09-01'}]);},10);},
      addTrainingRecord:function(n,d){window.__calls.push(['addTrainingRecord',n,d]);
        /* mock only -- nothing is written and nothing is sent */
        setTimeout(function(){ok([{name:'Prior Person',date:'2026-09-01'},{name:n,date:d}]);},10);}
    };
    return api;
  }
  window.google={script:{run:runner()}};
  Object.defineProperty(window.google.script,'run',{get:runner});
})();
`;
(async()=>{
const b=await chromium.launch({executablePath:EXE});
const pg=await b.newPage({viewport:{width:1280,height:900}});
const errs=[];pg.on('pageerror',e=>{if(!/reading 'focus'/.test(String(e)))errs.push(String(e));});
await pg.addInitScript(MOCK);
await pg.goto(F,{waitUntil:'load'});
await pg.waitForTimeout(900);

// 1. the gate should have read the mocked Google identity
const gate=await pg.evaluate(()=>({
  gated:document.body.classList.contains('gated'),
  name:(document.getElementById('whoName')||{}).textContent,
  mail:(document.getElementById('whoMail')||{}).textContent,
  yesDisabled:(document.getElementById('whoYes')||{}).disabled,
  verified:(document.getElementById('whoYes')||{}).dataset&&document.getElementById('whoYes').dataset.verified,
}));
console.log('identity from getViewer :', JSON.stringify(gate));

// 2. enter the document through the verified path
await pg.click('#whoYes');
await pg.waitForTimeout(900);
// the entry screen has a second step; walk it to the end
for(let i=0;i<4;i++){
  const still=await pg.evaluate(()=>document.body.classList.contains('gated'));
  if(!still) break;
  const btn=await pg.evaluate(()=>{
    const v=[...document.querySelectorAll('#gate button, #gate a')]
      .filter(b=>b.offsetParent!==null&&!b.disabled&&b.id!=='whoNo');
    if(!v.length) return null; v[0].click(); return v[0].id||v[0].textContent.trim();
  });
  console.log('  gate step ->', btn);
  await pg.waitForTimeout(800);
}
const entered=await pg.evaluate(()=>({gated:document.body.classList.contains('gated'),
  who:localStorage.getItem('amqc-who')}));
console.log('after Continue          :', JSON.stringify(entered));

// 3. the shared roll should have loaded from the mocked getTrainingRecord
const roll=await pg.evaluate(()=>{
  const el=document.getElementById('rollmsg');
  const rows=document.querySelectorAll('#rolllist li, #rolllist tr');
  return {msg:el?el.textContent.trim():'(no #rollmsg)', rows:rows.length,
    addBtn:(document.getElementById('addtoroll')||{}).textContent,
    addDisabled:(document.getElementById('addtoroll')||{}).disabled};
});
console.log('shared record           :', JSON.stringify(roll));

// 4. the Add button must stay gated until completion is confirmed --
//    which is exactly why no record is submitted by this check
console.log('add button gated        :', roll.addDisabled===true ? 'yes (nothing submitted)' : 'NO - button is live');

const calls=await pg.evaluate(()=>window.__calls);
console.log('server calls made       :', JSON.stringify(calls));
console.log('addTrainingRecord called:', calls.some(c=>c[0]==='addTrainingRecord') ? 'YES' : 'no');

// 5. fonts, view transitions and storage all have to work under the
//    Apps Script iframe-style document too
const env=await pg.evaluate(()=>({
  fonts:[...document.fonts].map(f=>f.family).filter((v,i,a)=>a.indexOf(v)===i),
  vt:typeof document.startViewTransition==='function',
  head:getComputedStyle(document.documentElement).getPropertyValue('--head-h').trim(),
  frame:Math.round(document.querySelector('.main').getBoundingClientRect().width),
  panelR:getComputedStyle(document.querySelector('#s1')).borderTopLeftRadius,
  bodyFont:getComputedStyle(document.body).fontFamily.split(',')[0],
  h2Font:getComputedStyle(document.querySelector('#s1 h2')).fontFamily.split(',')[0],
  build:(document.querySelector('.build,[class*=build]')||{}).textContent,
}));
console.log('runtime                 :', JSON.stringify(env));
console.log('page errors             :', errs.length?errs:'none');
await b.close();
})();
