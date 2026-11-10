const {chromium}=require('playwright-core');const AxeBuilder=require('@axe-core/playwright').default;
const U='file:///workspace/ux-projects/directions/themes/index.html';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
for(const t of ['editorial','bold','tactile'])for(const m of ['light','dark'])for(const [w,h,n] of [[375,812,'m'],[1280,800,'d']]){
 const c=await b.newContext({viewport:{width:w,height:h}});await c.addInitScript(([t,m])=>{localStorage.setItem('jd-theme',t);localStorage.setItem('jd-mode',m)},[t,m]);
 const p=await c.newPage();await p.goto(U,{waitUntil:'networkidle'});await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));await p.waitForTimeout(900);
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);const r=await new AxeBuilder({page:p}).analyze();
 await p.screenshot({path:`${t}-${m}-${n}.png`,fullPage:n==='m'});console.log(t,m,n,'ov',ov,'axe',r.violations.map(v=>v.id+':'+v.nodes.length).join(',')||0);await c.close();}
// keyboard + persistence + announce + system default
const c=await b.newContext({viewport:{width:375,height:812},colorScheme:'dark'});const p=await c.newPage();await p.goto(U);
console.log('default',await p.evaluate(()=>[document.documentElement.dataset.theme,document.documentElement.dataset.mode]));
await p.focus('input[value=editorial]');await p.keyboard.press('ArrowRight');await p.waitForTimeout(500);
console.log('after arrow',await p.evaluate(()=>[document.documentElement.dataset.theme,localStorage.getItem('jd-theme'),document.getElementById('sw-live').textContent]));
await p.reload();console.log('persist',await p.evaluate(()=>document.documentElement.dataset.theme));await b.close()})();
