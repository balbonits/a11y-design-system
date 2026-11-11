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
await b.close();})();
