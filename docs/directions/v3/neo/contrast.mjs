// CI contrast gate (R-2): every semantic text/bg and UI/bg pair in all neo light and dark.
import fs from 'node:fs';
const J=JSON.parse(fs.readFileSync(new URL('./tokens.json',import.meta.url)));
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};
const TEXT=[...['text','text-muted','accent','success','warning','danger','info'].flatMap(f=>['color-bg','surface'].map(b=>[f,b])),
 ['text','surface-muted'],['text-muted','surface-muted'],['text','accent-soft'],['accent','accent-soft'],
 ['accent-contrast','accent'],['accent-contrast','accent-hover'],['danger-contrast','danger'],['danger-contrast','danger-hover'],['color-bg','text'],['highlight-contrast','highlight']];
const UI=[['border','color-bg'],['border','surface'],['focus','color-bg'],['focus','surface'],['focus','surface-muted'],['accent','surface-muted']];
let fail=0;const rows=[];
for(const [combo,t] of Object.entries(J.semantic)){
 for(const [list,min] of [[TEXT,4.5],[UI,3]])for(const [f,b] of list){const r=cr(t['--'+f],t['--'+b]);rows.push([combo,f,b,min,r]);if(r<min){fail++;console.log('FAIL',combo,f,'on',b,r.toFixed(2),'<',min)}}}
const md=['| Combo | Foreground | Background | Min | Ratio |','|---|---|---|---|---|',...rows.map(([c,f,b,m,r])=>`| ${c} | ${f} | ${b} | ${m} | ${r.toFixed(2)} |`)].join('\n');
fs.writeFileSync(new URL('./CONTRAST.md',import.meta.url),md+'\n');
console.log(rows.length,'pairs checked,',fail,'failures');process.exit(fail?1:0);
