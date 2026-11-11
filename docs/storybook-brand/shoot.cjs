// Annotated shots of a scratch Storybook build with mock/manager.ts + mock/manager-head.html applied (see HANDOFF "Reproduce").
// Usage: NODE_PATH=<dir with playwright-core> node docs/storybook-brand/shoot.cjs http://127.0.0.1:8961/
const {chromium}=require('playwright-core');const path=require('path');
const base=process.argv[2]||'http://127.0.0.1:8961/';const dir=path.join(__dirname,'handoff');
const ANN=(items)=>{const add=(r,txt,bg,pos)=>{const d=document.createElement('div');Object.assign(d.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',outline:`2px dashed ${bg}`,zIndex:2147483647,pointerEvents:'none'});const t=document.createElement('span');t.textContent=txt;const at=pos==='right'?{left:'calc(100% + 4px)',top:'50%',transform:'translateY(-50%)'}:pos==='below'||r.top<20?{left:'0',top:'100%',transform:'translateY(2px)'}:{left:'0',top:'-2px',transform:'translateY(-100%)'};Object.assign(t.style,at,{position:'absolute',background:bg,color:'#fff',font:'700 11px/1.3 monospace',padding:'1px 4px',whiteSpace:'nowrap'});d.appendChild(t);document.body.appendChild(d)};
 for(const [sel,txt,bg,pos] of items){const e=document.querySelector(sel);if(!e)continue;const r=e.getBoundingClientRect();if(!r.width)continue;add(r,txt.replace('{wh}',Math.round(r.width)+'x'+Math.round(r.height)),bg,pos)}};
const G='#008a5a',P='#7a2bd6';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
for(const [w,h] of [[320,640],[768,800],[1280,800]])for(const cs of ['light','dark']){
 const p=await b.newPage({viewport:{width:w,height:h},colorScheme:cs});
 await p.goto(base+'?path=/docs/components-button--docs',{waitUntil:'networkidle'});await p.waitForTimeout(1200);
 let items;
 if(w<600){ // Storybook mobile nav: open the drawer from the bottom bar
  await p.click('nav button:has-text("Components/Button/Docs"), button:has-text("Components/Button/Docs")');await p.waitForTimeout(800);
  await p.keyboard.press('Tab');await p.focus('a:has(> .ember-brand)');
  items=[['a:has(> .ember-brand)','1 brand link {wh}, focus ring --focus-ring-color 3px/3px',G,'below'],['.sidebar-item[data-selected="true"]','2 selected row',P,'below'],['#storybook-explorer-searchfield','3 search: inputBg/inputBorder',P,'below']];
 } else if(w<1024){
  items=[['.sb-bar','1 toolbar: --surface, --text-muted, selected --accent',P],['[aria-label="Show sidebar"], button[title="Show sidebar"]','2 Show sidebar (collapsed 600-1023, manager.ts navSize 0) {wh}',G]];
 } else {
  await p.keyboard.press('Tab');await p.focus('a:has(> .ember-brand)');
  items=[['a:has(> .ember-brand)','1 brand link {wh}, focus ring 3px/3px',G,'right'],['#storybook-explorer-searchfield','2 search: inputBg/inputBorder',P,'below'],['.sidebar-item[data-selected="true"]','3 selected row: --accent-contrast on --accent',P,'right'],['.sb-bar','4 toolbar: barBg --surface, barText --text-muted, selected --accent',P]];
 }
 await p.mouse.move(w-2,h/2);await p.evaluate(ANN,items);await p.waitForTimeout(150);
 const f=path.join(dir,`sb-brand-${w}-${cs}.png`);await p.screenshot({path:f});console.log(f);await p.close();}
// FU-SB-TOOLBAR-44: hit-area shots below 600 (story view). Dashed green = each control's 44px ::before hit area; no labels on the boxes.
const HIT=()=>{const box=(l,t,w,h,c)=>{const d=document.createElement('div');Object.assign(d.style,{position:'fixed',left:l+'px',top:t+'px',width:w+'px',height:h+'px',outline:`1px dashed ${c}`,outlineOffset:'-1px',zIndex:2147483647,pointerEvents:'none'});document.body.appendChild(d)};
 for(const x of document.querySelectorAll('.sb-bar button[title], .sb-bar a[title], .sidebar-header button[title]')){const r=x.getBoundingClientRect();if(!r.width)continue;const s=getComputedStyle(x,'::before');if(s.content==='none')continue;const t=parseFloat(s.top),l=parseFloat(s.left);box(r.left+l,r.top+t,r.width-2*l,r.height-2*t,'#008a5a')}};
for(const w of [320,599])for(const cs of ['light','dark']){
 const p=await b.newPage({viewport:{width:w,height:640},colorScheme:cs});
 await p.goto(base+'?path=/story/components-button--primary',{waitUntil:'networkidle'});await p.waitForTimeout(1200);
 await p.evaluate(()=>document.querySelector('.sb-bar button[title="Zoom in"]').focus({focusVisible:true}));
 await p.mouse.move(w-2,320);await p.evaluate(HIT);
 await p.evaluate(ANN,[['.sb-bar button[title="Zoom in"]','1 focus ring 3px, offset 2',G,'below'],['.sb-bar:has(button[title="Open navigation menu"])','2 bars 48px; dashed = 44px hit, pitch 50+',P]]);
 await p.evaluate(()=>{const r=document.querySelector('main > .sb-bar').getBoundingClientRect();const d=document.createElement('div');Object.assign(d.style,{position:'fixed',left:(r.right-16)+'px',top:r.top+'px',width:'16px',height:r.height+'px',outline:'2px dashed #7a2bd6',outlineOffset:'-2px',zIndex:2147483647,pointerEvents:'none'});const t=document.createElement('span');t.textContent='3 more tools: edge rule + shade';Object.assign(t.style,{position:'absolute',right:'0',top:'100%',transform:'translateY(2px)',background:'#7a2bd6',color:'#fff',font:'700 11px/1.3 monospace',padding:'1px 4px',whiteSpace:'nowrap'});d.appendChild(t);document.body.appendChild(d)});
 await p.evaluate(()=>document.querySelector('.sb-bar button[title="Zoom in"]').focus({focusVisible:true}));await p.waitForTimeout(150);
 const f=path.join(dir,`sb-toolbar-hit-${w}-${cs}.png`);await p.screenshot({path:f});console.log(f);await p.close();}
// The drawer header (About Storybook, Close menu) and the addon panel's Close button, light only (same CSS in dark).
for(const w of [320,599])for(const [open,name,ann] of [['button[title="Open navigation menu"]','drawer',[['.sidebar-header','1 About + Close menu: 44x44 hit',G,'below']]],['button[title="Open addon panel"]','addons',[['.sb-bar:has(button[title="Close addon panel"])','1 addon bar 48px, Close 44x44; tabs: spike',P]]]]){
 const p=await b.newPage({viewport:{width:w,height:640},colorScheme:'light',reducedMotion:'reduce'});
 await p.goto(base+'?path=/story/components-button--primary',{waitUntil:'networkidle'});await p.waitForTimeout(1200);
 await p.click(open);await p.waitForTimeout(900);
 await p.evaluate(()=>document.querySelectorAll('*').forEach(e=>{if(e.scrollTop>0&&e.closest('body'))e.scrollTop=0}));
 await p.mouse.move(w-2,100);await p.evaluate(HIT);await p.evaluate(ANN,ann);await p.waitForTimeout(150);
 const f=path.join(dir,`sb-toolbar-hit-${w}-${name}-light.png`);await p.screenshot({path:f});console.log(f);await p.close();}
await b.close();})();
