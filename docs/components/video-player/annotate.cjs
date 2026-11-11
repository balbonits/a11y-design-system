// R-4 VideoPlayer annotate, all three themes (neo, kinetic, dusk): neo pattern (docs/directions/v3/neo/annotate.cjs) adapted to one page.
// Run: NODE_PATH=<node_modules with playwright-core + @axe-core/playwright> node annotate.cjs http://127.0.0.1:PORT/docs/components/video-player/index.html
const {chromium}=require('playwright-core');const {AxeBuilder}=require('@axe-core/playwright');
const base=process.argv[2]||'http://127.0.0.1:8943/docs/components/video-player/index.html';
const SEL='a,button,input,select,textarea,summary,[tabindex="0"],[role=tab],[role=slider]';
const ANN=SEL=>{const add=(r,txt,bg,fg,dash)=>{const d=document.createElement('div');d.className='__a';Object.assign(d.style,{position:'absolute',left:r.left+scrollX+'px',top:r.top+scrollY+'px',width:r.width+'px',height:r.height+'px',outline:`2px ${dash?'dashed':'solid'} ${bg}`,zIndex:99998,pointerEvents:'none'});const t=document.createElement('span');t.textContent=txt;Object.assign(t.style,{position:'absolute',left:'0',top:'-2px',transform:'translateY(-100%)',background:bg,color:fg,font:'700 11px/1.3 monospace',padding:'1px 4px',whiteSpace:'nowrap'});d.appendChild(t);document.body.appendChild(d)};
 document.querySelectorAll('header,nav,main,footer,[role=region],section[aria-label]').forEach(e=>{const r=e.getBoundingClientRect();if(r.width)add(r,(e.getAttribute('role')||e.tagName.toLowerCase())+(e.getAttribute('aria-label')?': '+e.getAttribute('aria-label'):''),'#008a5a','#fff',true)});
 document.querySelectorAll('h1,h2,h3,h4').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&e.offsetParent)add(r,e.tagName,'#7a2bd6','#fff',false)});
 let n=0;document.querySelectorAll(SEL).forEach(e=>{const r=(e.type==='radio'||e.type==='checkbox')&&e.closest('label')?e.closest('label').getBoundingClientRect():e.getBoundingClientRect();if(!r.width||!e.offsetParent||e.closest('[hidden]')||e.tabIndex<0)return;n++;const small=r.height<44||r.width<44;add(r,n+(small?' <44':' '+Math.round(r.width)+'x'+Math.round(r.height)),small?'#d00':'#e0217a','#fff',false)})};
const SMALL=SEL=>[...document.querySelectorAll(SEL)].filter(e=>{const r=(e.type==='radio'||e.type==='checkbox')&&e.closest('label')?e.closest('label').getBoundingClientRect():e.getBoundingClientRect();return r.width&&e.offsetParent&&!e.closest('[hidden]')&&e.tabIndex>=0&&(r.height<44||r.width<44)}).map(e=>e.outerHTML.slice(0,70));
const open=async(p,th='neo')=>{await p.goto(base+'?theme='+th,{waitUntil:'load'});await p.waitForFunction(()=>document.querySelectorAll('.gal .vp').length>=10);await p.waitForTimeout(900)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const out=[];
for(const th of ['neo','kinetic','dusk'])for(const w of [320,375,768,1024,1440])for(const cs of ['light','dark']){const c=await b.newContext({viewport:{width:w,height:900},colorScheme:cs});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await open(p,th);
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);const a=await new AxeBuilder({page:p}).analyze();const ser=a.violations.filter(x=>['serious','critical'].includes(x.impact));
 const small=await p.evaluate(SMALL,SEL);if(small.length)out.push(`${th} ${w} ${cs} SMALL ${JSON.stringify(small)}`);
 await p.screenshot({path:`handoff/vp-${th}-${w}-${cs}.png`,fullPage:true});
 await p.evaluate(ANN,SEL);await p.screenshot({path:`handoff/vp-${th}-${w}-${cs}-annotated.png`,fullPage:true});await p.screenshot({path:`handoff/vp-${th}-${w}-${cs}-annotated-top.png`});
 await p.evaluate(()=>{document.querySelectorAll('.__a').forEach(e=>e.remove());const st=document.createElement('style');st.textContent='*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';document.head.appendChild(st)});
 await p.waitForTimeout(200);
 const ov2=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 const clip=await p.evaluate(()=>[...document.querySelectorAll('button,a,label,h1,h2,h3,.tnum,.time')].filter(e=>!e.classList.contains('sr')&&e.offsetParent&&e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflow!=='visible').map(e=>e.className||e.tagName));
 out.push(`${th} ${w} ${cs} overflow ${ov} axe ${ser.length}${ser.length?' '+ser.map(x=>x.id).join(','):''} | text-spacing overflow ${ov2} clipped ${clip.length}${clip.length?' '+clip.slice(0,4).join(','):''}${errs.length?' ERR '+errs.join(';'):''}`);await c.close()}
for(const th of ['neo','kinetic','dusk']){const c=await b.newContext({viewport:{width:640,height:400},deviceScaleFactor:2});const p=await c.newPage();await open(p,th);out.push(th+' zoom200 overflow '+await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));await c.close()}
console.log(out.join('\n'));await b.close()})();
