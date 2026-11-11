// Dialog-open handoff shots (DUSK-SCRIM-LIGHT, ARCH-REVIEW Addendum 9): the Delete dialog over --scrim, light and dark, 320 and 1280.
// Run from docs/directions/v3: NODE_PATH=<node_modules with playwright-core> node dusk/dialogopen.cjs http://127.0.0.1:PORT/docs/directions/v3/dusk/index.html
// Truecolor PNG straight from Chrome (no quantize step). Also prints the dialog's computed border so the shot can be checked against tokens.json.
const {chromium}=require('playwright-core');const path=require('path');
const base=process.argv[2];const out=path.join(__dirname,'handoff');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
for(const w of [320,1280])for(const cs of ['light','dark']){const c=await b.newContext({viewport:{width:w,height:800},colorScheme:cs});const p=await c.newPage();
 await p.goto(base+'#tracker',{waitUntil:'networkidle'});await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
 await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));
 const mvb=p.locator('.job .mvb').first();await mvb.scrollIntoViewIfNeeded();await mvb.click();await p.locator('.job [data-act=del]').first().click();
 await p.waitForSelector('#deld[open]');await p.waitForTimeout(300);
 const info=await p.evaluate(()=>{const d=document.querySelector('#deld'),s=getComputedStyle(d);return {border:s.borderTopWidth+' '+s.borderTopStyle+' '+s.borderTopColor,token:getComputedStyle(document.documentElement.querySelector('[data-theme]')||document.documentElement).getPropertyValue('--dialog-border').trim()}});
 const f=`dusk-dialog-open-${w}-${cs}.png`;await p.screenshot({path:path.join(out,f)});console.log(f,JSON.stringify(info));await c.close()}
await b.close()})();
