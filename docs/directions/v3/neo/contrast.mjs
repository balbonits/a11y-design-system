// CI contrast gate (R-2): every semantic text/bg and UI/bg pair in all neo light and dark.
import fs from 'node:fs';
const J=JSON.parse(fs.readFileSync(new URL('./tokens.json',import.meta.url)));
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};
const TEXT=[...['text','text-muted','accent','success','warning','danger','info'].flatMap(f=>['color-bg','surface'].map(b=>[f,b])),
 ['text','surface-muted'],['text-muted','surface-muted'],['text','accent-soft'],['accent','accent-soft'],
 ['accent-contrast','accent'],['accent-contrast','accent-hover'],['danger-contrast','danger'],['danger-contrast','danger-hover'],['color-bg','text'],['highlight-contrast','highlight']];
const UI=[['border','color-bg'],['border','surface'],['focus-ring-color','color-bg'],['focus-ring-color','surface'],['focus-ring-color','surface-muted'],['accent','surface-muted'],['focus-ring-color','border'],['border','surface-muted']];
let fail=0;const rows=[];
for(const [combo,t] of Object.entries(J.semantic)){
 for(const [list,min] of [[TEXT,4.5],[UI,3]])for(const [f,b] of list){const r=cr(t['--'+f],t['--'+b]);rows.push([combo,f,b,min,r]);if(r<min){fail++;console.log('FAIL',combo,f,'on',b,r.toFixed(2),'<',min)}}}
// Scrim (dialog backdrop): composite --scrim over page colors. Every color must get darker or stay equal (never lighten),
// and page text under the scrim stays recognizable (3:1 against the dimmed bg). The dialog itself is an opaque --surface,
// so its text pairs are the text/surface rows above and never depend on the scrim.
const hx=n=>Math.round(n).toString(16).padStart(2,'0');
const over=(s,b)=>{const a=parseInt(s.slice(7,9),16)/255;return '#'+[1,3,5].map(i=>hx(a*parseInt(s.slice(i,i+2),16)+(1-a)*parseInt(b.slice(i,i+2),16))).join('')};
const srows=[];
for(const [combo,t] of Object.entries(J.semantic)){const sc=t['--scrim'];if(!sc||sc.length!==9){fail++;console.log('FAIL',combo,'no 8-digit --scrim');continue}
 for(const k of ['color-bg','surface','surface-muted','text','text-muted','accent']){const o=t['--'+k],d=over(sc,o);const ok=lum(d)<=lum(o)+1e-9;if(!ok){fail++;console.log('FAIL',combo,k,'lightens under scrim')}srows.push([combo,k,o,d,ok?'dims':'LIGHTENS',''])}
 for(const [f,b] of [['text','color-bg'],['text','surface'],['text-muted','color-bg']]){const r=cr(over(sc,t['--'+f]),over(sc,t['--'+b]));if(r<3){fail++;console.log('FAIL',combo,f,'under scrim',r.toFixed(2))}srows.push([combo,f+' on '+b,'','','3',r.toFixed(2)])}
 // ARCH-REVIEW Addendum 9: the opaque dialog edge reads --dialog-border (registered extra, default var(--border)); lint that it resolves, then gate it 3:1 on the scrim composite (WCAG 1.4.11).
 {const db=t['--dialog-border'];if(!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(db||'')){fail++;console.log('FAIL lint',combo,'--dialog-border does not resolve to a color')}else{const g=over(sc,t['--color-bg']),r=cr(db,g);if(r<3){fail++;console.log('FAIL',combo,'dialog-border on scrim',r.toFixed(2))}srows.push([combo,'dialog-border (opaque) on scrim over color-bg',db,g,'3:1',r.toFixed(2)])}}}
const md=['| Combo | Foreground | Background | Min | Ratio |','|---|---|---|---|---|',...rows.map(([c,f,b,m,r])=>`| ${c} | ${f} | ${b} | ${m} | ${r.toFixed(2)} |`)].join('\n');
const smd=['','## Scrim (dialog backdrop)','','`--scrim` is ink `#111111` plus alpha (45% light `#11111173`, 55% dark `#1111118c`), composited over the page. Each color must dim or stay equal, never lighten, and page text under the scrim keeps at least 3:1 so it stays recognizable. The dialog is an opaque `--surface`, so its text contrast is the text/surface rows above and never depends on the scrim.','','| Combo | Token or pair | Base | Under scrim | Rule | Ratio |','|---|---|---|---|---|---|',...srows.map(([c,k,o,d,r,x])=>`| ${c} | ${k} | ${o?'`'+o+'`':''} | ${d?'`'+d+'`':''} | ${r==='3'?'3:1':r} | ${x} |`)].join('\n');
fs.writeFileSync(new URL('./CONTRAST.md',import.meta.url),md+'\n'+smd+'\n');
console.log(rows.length,'pairs checked,',srows.length,'scrim rows,',fail,'failures');process.exit(fail?1:0);
