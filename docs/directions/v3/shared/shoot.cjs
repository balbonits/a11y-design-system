// v3 self-check + screenshots. Usage (from docs/directions): NODE_PATH=<node_modules> node v3/shared/shoot.cjs <id> <base-url>
// axe serious/critical and horizontal overflow at 375 and 1280, light and dark; PNGs to v3/<id>/<id>-<view>-<mode>-<m|d>.png
const {chromium}=require('playwright-core');const {AxeBuilder}=require('@axe-core/playwright');
(async()=>{const id=process.argv[2],base=process.argv[3];const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});let bad=0;
for(const [w,h] of [[375,812],[1280,800]])for(const cs of ['light','dark']){const c=await b.newContext({viewport:{width:w,height:h},colorScheme:cs});const p=await c.newPage();
for(const v of ['components','tracker','dashboard','tokens']){await p.goto(base+'#'+v,{waitUntil:'networkidle'});await p.evaluate(()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))});await p.waitForTimeout(700);
const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);const a=await new AxeBuilder({page:p}).analyze();const s=a.violations.filter(x=>['serious','critical'].includes(x.impact));
if(ov||s.length){bad++;console.log(w,cs,v,'ov',ov,s.map(x=>x.id+':'+x.nodes.map(n=>n.target).join(',')).join(' '))}
if(v!=='tokens')await p.screenshot({path:`v3/${id}/${id}-${v}-${cs}-${w===375?'m':'d'}.png`});}
await c.close()}console.log(id,'bad',bad);await b.close();process.exit(bad?1:0)})();
