/* Shared v3 prototype behavior (mode toggle, hash routing, reveal, ticker pause, toast, modal, tabs, swatches).
   Used by every v3 direction's index.html. Expects: #mode, nav.views a, sections #v-components #v-tracker #v-dashboard #v-tokens (prefixed so a route hash never scroll-jumps to an anchor), #main, #toast, #dlg/#openm/#dok/#dno, [role=tab], #sw; optional #ticker/#tickbtn. */
(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const R=document.documentElement,mb=$('#mode'),RM=matchMedia('(prefers-reduced-motion: reduce)');
window.V3={$,$$,RM};
function isDark(){return R.dataset.mode?R.dataset.mode==='dark':matchMedia('(prefers-color-scheme: dark)').matches}
function syncMode(){const d=isDark();mb.setAttribute('aria-pressed',d);mb.querySelector('.lbl').textContent=d?'Light mode':'Dark mode';drawSw()}
mb.onclick=()=>{const d=isDark();R.dataset.mode=d?'light':'dark';try{localStorage.setItem('jdilig:mode',R.dataset.mode)}catch(e){}syncMode();toast((d?'Light':'Dark')+' mode on')};
const views=['components','tracker','dashboard','tokens'];
function route(){const id=views.includes(location.hash.slice(1))?location.hash.slice(1):'components';
 const go=()=>{views.forEach(v=>{$('#v-'+v).hidden=v!==id});$$('nav.views a').forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});reveal();document.dispatchEvent(new CustomEvent('v3:view',{detail:id}))};
 document.startViewTransition&&!RM.matches?document.startViewTransition(go):go()}
addEventListener('hashchange',()=>{route();$('#main').focus({preventScroll:true});scrollTo(0,0)});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
function reveal(){$$('.reveal:not(.in)').forEach(el=>io.observe(el))}
const tk=$('#ticker'),tb=$('#tickbtn');
if(tk){const set=p=>{tk.toggleAttribute('data-paused',p);tb.textContent=p?'Play ticker':'Pause ticker';tb.setAttribute('aria-pressed',p)};
 tb.onclick=()=>set(!tk.hasAttribute('data-paused'));if(RM.matches)set(true)}
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),4000)}
window.V3.toast=toast;
$$('[data-toast]').forEach(b=>b.addEventListener('click',()=>toast(b.dataset.toast)));
const dlg=$('#dlg');let opener;$('#openm').onclick=e=>{opener=e.currentTarget;dlg.showModal()};
$('#dno').onclick=()=>dlg.close();$('#dok').onclick=()=>{dlg.close();toast('Role deleted')};dlg.onclose=()=>opener&&opener.focus();
const tabs=$$('[role=tab]');function sel(t){tabs.forEach(x=>{const on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;$('#'+x.getAttribute('aria-controls')).hidden=!on});t.focus()}
tabs.forEach((t,i)=>{t.onclick=()=>sel(t);t.onkeydown=e=>{const k={ArrowRight:i+1,ArrowLeft:i-1,Home:0,End:tabs.length-1}[e.key];if(k!==undefined){e.preventDefault();sel(tabs[(k+tabs.length)%tabs.length])}}});
const names=['color-bg','surface','surface-muted','text','text-muted','border','border-subtle','accent','accent-hover','accent-soft','focus-ring-color','highlight','success','warning','danger','info'];
function drawSw(){const cs=getComputedStyle(R);$('#sw').innerHTML=names.map(n=>{const v=cs.getPropertyValue('--'+n).trim();return `<div><i style="background:${v}"></i><span>--${n}<br>${v}</span></div>`}).join('')}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',syncMode);
syncMode();route();
})();
/* States panel: Retry re-shows the load error as role=alert, the way a failure that happens after load is announced. */
(function(){const b=document.getElementById('st-retry');if(!b)return;b.onclick=()=>{const w=document.getElementById('st-err');const e=w.querySelector('.err');e.remove();b.setAttribute('aria-busy','true');setTimeout(()=>{const n=document.createElement('p');n.className='err';n.setAttribute('role','alert');n.innerHTML='<span class="badge" aria-hidden="true">!</span>Couldn\'t load rows.';w.prepend(n);b.removeAttribute('aria-busy')},600)}})();
