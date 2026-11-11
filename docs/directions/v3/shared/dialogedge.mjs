// Which colour is the dialog's drawn 1.4.11 edge? CA ruling on #49, matching BED's #48 rule (signed at daa49c2):
// if the theme's `dialog{}` rule draws no border (border shorthand 0/none, or width 0), the edge is the dialog surface
// (its background var, else --surface); otherwise it is --dialog-border. Reads <dir>/index.html, so the gate measures what renders.
import fs from 'node:fs'; import path from 'node:path';
export function dialogEdge(dir){
  const css=fs.readFileSync(path.join(dir,'index.html'),'utf8');const m=css.match(/(?:^|[>}\s])dialog\{([^}]*)\}/);
  if(!m)throw new Error(`${dir}: no dialog{} rule found`);
  const decl=Object.fromEntries(m[1].split(';').map(d=>d.split(':')).filter(a=>a.length>1).map(([k,...v])=>[k.trim(),v.join(':').trim()]));
  const b=decl['border'],w=decl['border-width'];
  const none=(b!==undefined&&/^(0(px)?|none)$/.test(b))||(w!==undefined&&/^0(px)?$/.test(w));
  if(!none)return '--dialog-border';
  const bg=(decl['background']||decl['background-color']||'').match(/var\((--[\w-]+)\)/);return bg?bg[1]:'--surface';
}
