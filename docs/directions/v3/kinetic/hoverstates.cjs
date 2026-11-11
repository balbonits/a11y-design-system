// FIX-KINETIC-PROTO-HOVER gate: Button rest / hover / active / focus for default, primary and danger,
// light and dark (prefers-color-scheme), 320 and 1280. Compares the prototype with FSD's #27 Storybook render
// (Components/Button stories, theme kinetic) and checks contrast: hover label/fill >= 4.5, ring vs page+gap >= 3.
// Active is checked against the variant's own rest fill (HANDOFF:52), not #27, which presses to -hover (KI-2).
// Run: NODE_PATH=<node_modules with playwright-core> node kinetic/hoverstates.cjs <proto index.html URL> <storybook base URL>
// States are forced with CDP CSS.forcePseudoState (active = hover+active, focus = focus+focus-visible), transitions off.
// Writes truecolor PNG crops to kinetic/handoff/hover/ (the committed grids kinetic-button-states-*.png are composed from them) and prints PASS/FAIL lines; exit 1 on any FAIL.
const {chromium}=require('playwright-core');const path=require('path');const fs=require('fs');
const [proto,sb]=process.argv.slice(2);const out=path.join(__dirname,'handoff','hover');fs.mkdirSync(out,{recursive:true});
const STATES={rest:[],hover:['hover'],active:['hover','active'],focus:['focus','focus-visible']};
const lum=c=>{const m=c.match(/[\d.]+/g).map(Number);const a=m.length>3?m[3]:1;const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return {L:.2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2]),a}};
const cr=(x,y)=>{const a=lum(x).L,b=lum(y).L;return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
let fails=0,passes=0;const ok=(c,msg)=>{if(c)passes++;else{fails++;console.log('FAIL',msg)}};
async function probe(p,sel){const cdp=await p.context().newCDPSession(p);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const {root}=await cdp.send('DOM.getDocument',{depth:-1});const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:sel});
 const r={};for(const [st,pc] of Object.entries(STATES)){await cdp.send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:pc});await p.waitForTimeout(60);
  r[st]=await p.evaluate(s=>{const e=document.querySelector(s);const c=getComputedStyle(e);const bg=getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
   return {bg:c.backgroundColor,fg:c.color,border:c.borderTopColor,outline:c.outlineStyle==='none'?null:c.outlineWidth+' '+c.outlineColor,pageBg:(()=>{for(let n=e.parentElement;n;n=n.parentElement){const b=getComputedStyle(n).backgroundColor;if(!/rgba\(0, 0, 0, 0\)/.test(b))return b}return 'rgb(255, 255, 255)'})(),tf:c.transform}},sel);
  const bb=await p.locator(sel).boundingBox();r[st].png=await p.screenshot({clip:{x:Math.max(0,bb.x-10),y:Math.max(0,bb.y-10),width:bb.width+20,height:bb.height+20}});}
 await cdp.send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:[]});return r}
const solid=c=>c.replace(/rgba\((\d+), (\d+), (\d+), 0\)/,'transparent');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const report=[];
for(const w of [320,1280])for(const cs of ['light','dark']){const c=await b.newContext({viewport:{width:w,height:900},colorScheme:cs,reducedMotion:'no-preference'});const p=await c.newPage();
 await p.goto(proto+'#components',{waitUntil:'networkidle'});await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
 await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));
 const P={default:'#openm',primary:'.btn.primary[data-toast="Saved"]'};const pr={};
 for(const [v,s] of Object.entries(P)){await p.locator(s).scrollIntoViewIfNeeded();pr[v]=await probe(p,s)}
 await p.evaluate(()=>document.getElementById('dlg').showModal());await p.waitForTimeout(150);pr.danger=await probe(p,'#dok');
 const q=await c.newPage();const S={default:'secondary',primary:'primary',danger:'danger'};const sr={};
 for(const [v,id] of Object.entries(S)){await q.goto(`${sb}/iframe.html?id=components-button--${id}&viewMode=story&globals=theme:kinetic;mode:${cs}`,{waitUntil:'networkidle'});
  await q.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});await q.waitForSelector('.em-btn');sr[v]=await probe(q,'.em-btn')}
 const tag=`${w}-${cs}`;
 for(const v of ['default','primary','danger']){const a=pr[v],z=sr[v];
  for(const st of Object.keys(STATES)){fs.writeFileSync(path.join(out,`proto-${v}-${st}-${tag}.png`),a[st].png);fs.writeFileSync(path.join(out,`sb27-${v}-${st}-${tag}.png`),z[st].png)}
  // hover: inverted, and matches #27's fill + label
  ok(a.hover.bg===z.hover.bg,`${tag} ${v} hover fill proto ${a.hover.bg} vs #27 ${z.hover.bg}`);
  ok(a.hover.fg===z.hover.fg,`${tag} ${v} hover label proto ${a.hover.fg} vs #27 ${z.hover.fg}`);
  const hc=cr(a.hover.fg,a.hover.bg);ok(hc>=4.5,`${tag} ${v} hover label/fill ${hc.toFixed(2)} < 4.5`);
  // active: back to the variant's own rest fill and label
  ok(a.active.bg===a.rest.bg&&a.active.fg===a.rest.fg,`${tag} ${v} active ${a.active.bg}/${a.active.fg} != rest ${a.rest.bg}/${a.rest.fg}`);
  ok(/translateY|matrix\(1, 0, 0, 1, 0, 1\)/.test(a.active.tf),`${tag} ${v} active has no 1px press (${a.active.tf})`);
  // focus ring: present, 3:1 against the inverted fill and against the page
  ok(!!a.focus.outline,`${tag} ${v} no focus ring`);
  const ring=a.focus.outline?a.focus.outline.replace(/^[\d.]+px /,''):'rgb(0,0,0)';const rf=cr(ring,a.hover.bg),rp=cr(ring,a.rest.pageBg);
  // 1.4.11: the ring is offset 3px, so the colour next to it (and in the gap) is the page, not the fill.
  ok(rp>=3,`${tag} ${v} ring/page+gap ${rp.toFixed(2)} < 3`);
  // KI-1 (Creatives ruling): ring vs the inverted fill is informational. It never touches the fill, and #27 is identical.
  console.log('INFO',`${tag} ${v} ring/inverted fill ${rf.toFixed(2)} (KI-1, informational)`);
  report.push({tag,v,rest:[a.rest.bg,a.rest.fg,a.rest.border].map(solid),hover:[a.hover.bg,a.hover.fg,a.hover.border],hoverCR:+hc.toFixed(2),active:[a.active.bg,a.active.fg],sb27active:[z.active.bg,z.active.fg],ring,ringFill:+rf.toFixed(2),ringPage:+rp.toFixed(2)})}
 await c.close()}
await b.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,1));
for(const r of report)console.log(r.tag.padEnd(10),r.v.padEnd(8),'hover',r.hover.join(' '),'CR',r.hoverCR,'| active',r.active.join(' '),'| #27 active',r.sb27active.join(' '),'| ring',r.ring,r.ringFill,r.ringPage);
console.log(`${passes} pass, ${fails} fail`);process.exit(fails?1:0)})();
