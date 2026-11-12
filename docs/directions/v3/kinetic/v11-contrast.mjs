// V11-DASHBOARD.md H-7 contrast gate. Reads tokens.json; exits 1 on any fail.
// Run: node kinetic/v11-contrast.mjs (from docs/directions/v3)
import fs from 'node:fs';
const T=JSON.parse(fs.readFileSync(new URL('./tokens.json',import.meta.url))).semantic;
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};
const PAIRS=[
 ['text','--text',4.5,'stat numbers, labels, bar values, table text'],
 ['text','--text-muted',4.5,'stat sublines, scale line, meta, ago'],
 ['text','--danger',4.5,'FAILED status word (chart, list)'],
 ['text','--success',4.5,'SUCCEEDED status word (list)'],
 ['text','--info',4.5,'RUNNING status word (list)'],
 ['text','--warning',4.5,'IN PROGRESS status word (prototype list)'],
 ['mark','--text',3,'succeeded bar fill and edge'],
 ['mark','--danger',3,'failed bar: 135deg hatch stripes and 2px edge'],
 ['mark','--text-muted',3,'canceled bar: 45deg hatch stripes and 2px edge'],
 ['mark','--border',3,'chart baseline (2px left rule), stats top rule, list top rule'],
 ['mark','--focus-ring-color',3,'focus ring on toggle, Open log, previews'],
];
const FR={'kinetic-light':'#1434B8','kinetic-dark':'#C2CFFF'};
let fails=0;const out=['V11 dashboard contrast, every pair on --color-bg','mode | kind | token | ratio | min | use | result'];
for(const mode of ['kinetic-light','kinetic-dark']){const bg=T[mode]['--color-bg'];
 for(const [kind,tok,min,use] of PAIRS){const fg=tok==='--focus-ring-color'?FR[mode]:T[mode][tok];const r=cr(fg,bg);const ok=r>=min;if(!ok)fails++;
  out.push(`${mode} | ${kind} | ${tok} ${fg} on ${bg} | ${r.toFixed(2)}:1 | ${min}:1 | ${use} | ${ok?'pass':'FAIL'}`)}}
out.push(`${PAIRS.length*2} pairs, ${fails} fail`);fs.mkdirSync(new URL('./handoff/v11/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('./handoff/v11/contrast.txt',import.meta.url),out.join('\n')+'\n');console.log(out.join('\n'));process.exit(fails?1:0);
