const {chromium}=require('playwright-core');const J=require('./tokens.json');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});let bad=0;
for(const cs of ['light','dark']){const c=await b.newContext({colorScheme:cs});const p=await c.newPage();await p.goto('file://'+__dirname+'/t.html');
 const cases=[[null,null],...['editorial','bold','tactile'].flatMap(t=>[[t,null],[t,'light'],[t,'dark']])];
 for(const [t,m] of cases){const r=await p.evaluate(([t,m])=>{const d=document.documentElement;t?d.dataset.theme=t:delete d.dataset.theme;m?d.dataset.mode=m:delete d.dataset.mode;const s=getComputedStyle(d);return [s.getPropertyValue('--color-bg').trim(),s.getPropertyValue('--accent').trim(),s.getPropertyValue('--button-radius').trim(),s.getPropertyValue('--radius-control').trim()]},[t,m]);
  const exp=J.semantic[`${t||'editorial'}.${m||cs}`];const ok=r[0]===exp['--color-bg']&&r[1]===exp['--accent']&&r[3]===J.semantic_shape[t||'editorial']['--radius-control'];if(!ok)bad++;
  console.log(cs,t,m,ok?'ok':'MISMATCH '+r.join(' '))}await c.close()}
console.log('mismatches',bad);await b.close()})();
