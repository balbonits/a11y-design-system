const {chromium}=require('playwright-core');const {AxeBuilder}=require('@axe-core/playwright');
// Usage: node v3/shared/annotate.cjs <id> <url-to-index.html> [views]  (generalised from neo/annotate.cjs)
const path=require('path'),fs=require('fs');const id=process.argv[2],base=process.argv[3];const views=(process.argv[4]||'components,tracker,dashboard,tokens').split(',');
const dir=path.join(__dirname,'..',id,'handoff');fs.mkdirSync(dir,{recursive:true});
const ANN=()=>{const add=(r,txt,bg,fg,dash)=>{const d=document.createElement('div');d.className='__a';Object.assign(d.style,{position:'absolute',left:r.left+scrollX+'px',top:r.top+scrollY+'px',width:r.width+'px',height:r.height+'px',outline:`2px ${dash?'dashed':'solid'} ${bg}`,zIndex:99998,pointerEvents:'none'});const t=document.createElement('span');t.textContent=txt;Object.assign(t.style,{position:'absolute',left:'0',top:'-2px',transform:'translateY(-100%)',background:bg,color:fg,font:'700 11px/1.3 monospace',padding:'1px 4px',whiteSpace:'nowrap'});d.appendChild(t);document.body.appendChild(d)};
 document.querySelectorAll('header,nav,main,footer,[role=region]').forEach(e=>{const r=e.getBoundingClientRect();if(r.width)add(r,(e.getAttribute('role')||e.tagName.toLowerCase())+(e.getAttribute('aria-label')?': '+e.getAttribute('aria-label'):''),'#008a5a','#fff',true)});
 document.querySelectorAll('h1,h2,h3,h4').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&e.offsetParent)add(r,e.tagName,'#7a2bd6','#fff',false)});
 let n=0;document.querySelectorAll('a[href],button,input,select,[tabindex="0"]').forEach(e=>{const r=(e.type==='checkbox'&&e.closest('label')?e.closest('label'):e).getBoundingClientRect();if(!r.width||!e.offsetParent||e.closest('[hidden]')||e.tabIndex<0)return;n++;const small=r.height<44||r.width<44;add(r,n+(small?' <44':' '+Math.round(r.width)+'x'+Math.round(r.height)),small?'#d00':'#e0217a','#fff',false)})};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const out=[];
for(const v of views)for(const w of [320,375,768,1024,1440])for(const cs of ['light','dark']){const c=await b.newContext({viewport:{width:w,height:900},colorScheme:cs});const p=await c.newPage();
 await p.goto(base+'#'+v,{waitUntil:'networkidle'});await p.addStyleTag({content:'*,*::before,*::after{transition:none!important}'});await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));await p.waitForTimeout(400);
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);const a=await new AxeBuilder({page:p}).analyze();const s=a.violations.filter(x=>['serious','critical'].includes(x.impact)).length;
 await p.screenshot({path:path.join(dir,`${id}-${v}-${w}-${cs}.png`),fullPage:true});
 await p.evaluate(ANN);await p.screenshot({path:path.join(dir,`${id}-${v}-${w}-${cs}-annotated.png`),fullPage:true});
 // text spacing 1.4.12
 await p.evaluate(()=>{document.querySelectorAll('.__a').forEach(e=>e.remove());const st=document.createElement('style');st.textContent='*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';document.head.appendChild(st)});
 const ov2=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 const clip=await p.evaluate(()=>[...document.querySelectorAll('button,a,label,h1,h2,h3')].filter(e=>e.offsetParent&&e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflow!=='visible').length);
 out.push(`${v} ${w} ${cs} overflow ${ov} axe ${s} | text-spacing overflow ${ov2} clipped ${clip}`);await c.close()}
// 200% zoom = 640 css px at 1280
const c=await b.newContext({viewport:{width:640,height:400},deviceScaleFactor:2});const p=await c.newPage();await p.goto(base,{waitUntil:'networkidle'});for(const v of views){await p.goto(base+'#'+v,{waitUntil:'networkidle'});out.push(v+' zoom200 overflow '+await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))}
console.log(out.join('\n'));await b.close()})();
