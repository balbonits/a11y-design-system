// Dialog-open handoff shots (PR #49): the Keyboard shortcuts modal over --scrim, light and dark, 320 and 1280.
// Run from docs/directions/v3: NODE_PATH=<node_modules with playwright-core> node kinetic/dialogopen.cjs http://127.0.0.1:PORT/docs/directions/v3/kinetic/index.html
// Truecolor PNG straight from Chrome (no quantize step). Prints the computed edges so the shot can be checked against tokens.json.
const {chromium}=require('playwright-core');const path=require('path');
const base=process.argv[2];const out=path.join(__dirname,'handoff');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
for(const w of [320,1280])for(const cs of ['light','dark']){const c=await b.newContext({viewport:{width:w,height:800},colorScheme:cs});const p=await c.newPage();
 await p.goto(base+'#dashboard',{waitUntil:'networkidle'});await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
 await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));
 const k=p.locator('#keysbtn');await k.scrollIntoViewIfNeeded();await k.click();await p.waitForSelector('#keys[open]');await p.waitForTimeout(300);
 const info=await p.evaluate(()=>{const s=getComputedStyle(document.querySelector('#keys'));return {top:s.borderTopWidth+' '+s.borderTopColor,side:s.borderLeftWidth+' '+s.borderLeftColor}});
 const f=`kinetic-dialog-open-${w}-${cs}.png`;await p.screenshot({path:path.join(out,f)});console.log(f,JSON.stringify(info));await c.close()}
await b.close()})();
