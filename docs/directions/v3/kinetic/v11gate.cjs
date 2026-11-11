// V11-DASHBOARD.md gate + shots. Usage (from docs/directions/v3, server running there):
//   node kinetic/v11gate.cjs http://127.0.0.1:8942/kinetic/index.html
// Needs playwright-core and @axe-core/playwright on NODE_PATH. Writes kinetic/handoff/v11/gate.txt and PNGs. Exits 1 on any fail.
const {chromium}=require('playwright-core');const {AxeBuilder}=require('@axe-core/playwright');const path=require('path'),fs=require('fs');
const base=process.argv[2];const dir=path.join(__dirname,'handoff','v11');fs.mkdirSync(dir,{recursive:true});
const STATES=['','loading','error','empty','nofin','one','long','table'];const NAME=s=>s||'populated';
const ANN=()=>{const add=(r,txt,bg)=>{const d=document.createElement('div');d.className='__a';Object.assign(d.style,{position:'absolute',left:r.left+scrollX+'px',top:r.top+scrollY+'px',width:r.width+'px',height:r.height+'px',outline:'2px solid '+bg,pointerEvents:'none',zIndex:9999});
  const l=document.createElement('span');l.textContent=txt;Object.assign(l.style,{position:'absolute',left:0,top:'-14px',font:'600 10px/14px monospace',background:bg,color:'#fff',padding:'0 3px',whiteSpace:'nowrap'});d.appendChild(l);document.body.appendChild(d)};
 const root=document.querySelector('.v11');
 root.querySelectorAll('h2,h3:not(.sr),figure,ol,table,[role=group],[role=alert]').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&e.offsetParent)add(r,e.matches('h2,h3')?e.tagName:(e.getAttribute('role')||e.tagName.toLowerCase()),e.matches('h2,h3')?'#7a2bd6':'#0a7a3d')});
 root.querySelectorAll('a[href],button').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&e.offsetParent)add(r,`${Math.round(r.width)}x${Math.round(r.height)}`,'#d6005c')})};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const out=[];let fails=0;
for(const w of [320,375,768,1024,1280])for(const cs of ['light','dark'])for(const st of STATES){
 const c=await b.newContext({viewport:{width:w,height:900},colorScheme:cs,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(base+'#dashboard',{waitUntil:'networkidle'});await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}.reveal{opacity:1!important;transform:none!important}header{position:static!important}'});
 await p.evaluate(s=>{if(s==='table')document.querySelector('#rbar-tog').click();else document.querySelector(`.v11prev [data-v11="${s}"]`).click()},st);await p.waitForTimeout(80);
 const r=await p.evaluate(()=>{const v=document.querySelector('.v11');const vis=[...v.querySelectorAll('a[href],button')].filter(e=>e.offsetParent);
  return{hscroll:document.documentElement.scrollWidth-innerWidth,under44:vis.filter(e=>e.getBoundingClientRect().height<44).map(e=>e.textContent.trim()),
   overflow:[...v.querySelectorAll('*:not(.sr)')].filter(e=>e.offsetParent&&e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflowX!=='visible').length,
   rows:v.querySelectorAll('#rdep li').length,bars:v.querySelectorAll('.rb').length,trows:v.querySelectorAll('.rbtab tbody tr').length,
   stats:[...v.querySelectorAll('.num b')].map(b=>b.textContent||'(skeleton)').join(' | '),alerts:v.querySelectorAll('[role=alert]').length}});
 const ax=(await new AxeBuilder({page:p}).include('.v11').analyze()).violations;
 const bad=r.hscroll>0||r.under44.length||r.overflow||ax.length||errs.length;if(bad)fails++;
 out.push(`${w} ${cs} ${NAME(st)} | h-scroll ${r.hscroll} | <44px ${r.under44.length} | clipped ${r.overflow} | axe ${ax.length?ax.map(v=>v.id).join(','):0} | stats ${r.stats} | bars ${r.bars} table ${r.trows} list ${r.rows} alerts ${r.alerts}${errs.length?' | js '+errs.join(';'):''} | ${bad?'FAIL':'pass'}`);
 if((w===320||w===1280)&&(st===''||cs==='light')){const f=`kinetic-v11-${NAME(st)}-${w}-${cs}`;const el=p.locator('.v11');await el.screenshot({path:path.join(dir,f+'.png')});await p.evaluate(ANN);await el.screenshot({path:path.join(dir,f+'-annotated.png')})}
 await c.close()}
const c=await b.newContext({viewport:{width:320,height:900}});const p=await c.newPage();await p.goto(base+'#dashboard',{waitUntil:'networkidle'});
const k=await p.evaluate(async()=>{const t=document.querySelector('#rbar-tog');t.focus();t.click();const tab=!!document.querySelector('.rbtab')&&t.getAttribute('aria-pressed')==='true';
 const o=document.querySelector('#rdep button');o.focus();o.click();await new Promise(r=>setTimeout(r,600));const open=!!document.querySelector('#logd[open]');document.querySelector('#logclose').click();await new Promise(r=>setTimeout(r,50));return{tab,open,back:document.activeElement===o}});
const kok=k.tab&&k.open&&k.back;if(!kok)fails++;out.push(`keyboard 320 | toggle shows table ${k.tab} | Open log opens drawer ${k.open} | focus returns ${k.back} | ${kok?'pass':'FAIL'}`);
const c2=await b.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});const p2=await c2.newPage();await p2.goto(base+'#dashboard',{waitUntil:'networkidle'});
const an=await p2.evaluate(()=>getComputedStyle(document.querySelector('.rb-bar')).animationName);const rok=an==='none';if(!rok)fails++;out.push(`reduced motion | bar animation ${an} | ${rok?'pass':'FAIL'}`);
out.push(`${out.length} checks, ${fails} fail`);fs.writeFileSync(path.join(dir,'gate.txt'),out.join('\n')+'\n');console.log(out.join('\n'));await b.close();process.exit(fails?1:0)})();
