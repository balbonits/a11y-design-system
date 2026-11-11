// Hover+focus state shots (H-4): the inset hover ring and the offset focus ring together, dusk and kinetic, 320 and 1280, light and dark.
// Run from this directory: NODE_PATH=<node_modules with playwright-core> node hoverfocus.cjs http://127.0.0.1:PORT/docs/components/video-player/index.html
const {chromium}=require('playwright-core');
const base=process.argv[2]||'http://127.0.0.1:8944/docs/components/video-player/index.html';
const T={secondary:'[data-theme-pick][aria-pressed="false"]',primary:'.gal .vp .bigplay'};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const out=[];
for(const th of ['dusk','kinetic'])for(const w of [320,1280])for(const cs of ['light','dark']){const c=await b.newContext({viewport:{width:w,height:900},colorScheme:cs});const p=await c.newPage();
 await p.goto(base+'?theme='+th,{waitUntil:'load'});await p.waitForFunction(()=>document.querySelectorAll('.gal .vp').length>=10);await p.waitForTimeout(700);
 for(const [v,s] of Object.entries(T)){const el=p.locator(s).first();await el.scrollIntoViewIfNeeded();await p.keyboard.press('Shift');await el.evaluate(e=>e.focus());await el.hover();await p.waitForTimeout(350);
  const st=await el.evaluate(e=>{const s=getComputedStyle(e);return{fv:e.matches(':focus-visible'),hv:e.matches(':hover'),outline:s.outlineStyle+' '+s.outlineWidth+' off '+s.outlineOffset,shadow:s.boxShadow.slice(0,90)}});
  const r=await el.boundingBox();
  await p.evaluate(([r,txt])=>{const d=document.createElement('div');Object.assign(d.style,{position:'absolute',left:Math.max(0,r.x+scrollX-6)+'px',top:(r.y+scrollY+r.height+12)+'px',background:'#111',color:'#fff',font:'12px/1.3 system-ui',padding:'3px 6px',zIndex:99999,pointerEvents:'none',maxWidth:'300px'});d.className='__hf';d.textContent=txt;document.body.appendChild(d)},[r,`${th} ${cs} ${w}px, ${v}: ${th==='dusk'?'hover ring (inset)':'inverted hover'} + focus ring (outline, offset ${(await el.evaluate(e=>getComputedStyle(e).outlineOffset))})`]);
  const pad=24;await p.screenshot({path:`handoff/vp-${th}-${w}-${cs}-hoverfocus-${v}.png`,clip:{x:Math.max(0,r.x-pad),y:Math.max(0,r.y-pad),width:Math.min(w-Math.max(0,r.x-pad),Math.max(r.width+pad*2,320)),height:r.height+pad*2+28}});
  await p.evaluate(()=>document.querySelectorAll('.__hf').forEach(e=>e.remove()));
  out.push(`${th} ${w} ${cs} ${v} focus-visible=${st.fv} hover=${st.hv} | ${st.outline} | ${st.shadow}`)}
 await c.close()}
await b.close();console.log(out.join('\n'))})();
