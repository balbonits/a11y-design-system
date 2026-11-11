const {chromium}=require('playwright-core');const {AxeBuilder}=require('@axe-core/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const base=process.argv[2]||'http://127.0.0.1:8931/index.html';let bad=0;
for(const [w,h] of [[375,812],[1280,800]])for(const cs of ['light','dark']){const c=await b.newContext({viewport:{width:w,height:h},colorScheme:cs});const p=await c.newPage();
for(const v of ['components','tracker','dashboard','tokens']){await p.goto(base+'#'+v,{waitUntil:'networkidle'});await p.evaluate(()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))});await p.waitForTimeout(500);
const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);const a=await new AxeBuilder({page:p}).analyze();const s=a.violations.filter(x=>['serious','critical'].includes(x.impact));
if(ov||s.length){bad++;console.log(w,cs,v,'ov',ov,s.map(x=>x.id+':'+x.nodes[0].target).join(' '))}
if(v!=='tokens')await p.screenshot({path:`v3/neo/neo-${v}-${cs}-${w===375?'m':'d'}.png`});}
await c.close()}console.log('bad',bad);await b.close()})();
