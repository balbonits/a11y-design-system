import re
from pal import P,S
src=open('../directions/v2/gen.py').read().split("for k,d in D.items():")[0]
ns={};exec(src,ns)
css=ns['CSS'] % dict(scheme="light dark",body="var(--font-body)",dispw="var(--display-weight)",disp="var(--font-display)")
css=css.replace("filter:blur(60px);opacity:.55","filter:blur(var(--blob-blur));opacity:var(--blob-opacity)")
css=css.replace("box-shadow:var(--btnsh,none)","box-shadow:var(--btn-shadow)").replace("border:var(--tb,0)","border:var(--tile-border)")
css=css.replace("animation:tk 28s linear infinite","animation:tk var(--ticker-loop) linear infinite")
# tokens.css
def block(d):return ";".join(f"--{k.replace('_','-')}:{v}" for k,v in d.items())
tok=["/* jdilig.me UX themes: one token layer. Switch = data-theme on <html> (editorial|bold|tactile) + data-mode (light|dark). */"]
for t in P:
    tok.append(f"[data-theme={t}]{{{block(S[t])}}}")
    for mo,c in P[t].items():
        tok.append(f"[data-theme={t}][data-mode={mo}]{{color-scheme:{mo};{block(c)}}}")
tok.append("[data-theme=tactile] .btn{border:2px solid var(--line)}[data-theme=tactile] .btn:active{transform:translate(3px,3px);box-shadow:0 0 0 var(--line)}[data-theme=tactile] .tile:has(a.cta:hover){transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--line)}[data-theme=tactile] .blob{border:2px solid var(--line)}[data-theme=tactile] .b1{left:auto;right:-140px;top:-40px}[data-theme=tactile] .b3{left:auto;right:-60px;top:300px}")
tokens="\n".join(tok);open('tokens.css','w').write(tokens+"\n")
# page: reuse editorial page markup, swap head/style, add switcher
html=ns['page']('a-editorial',ns['D']['a-editorial'])
html=re.sub(r"<style>.*?</style>",lambda m:"<style>"+tokens+css+SW_CSS+"</style>",html,flags=re.S) if False else html
SW_CSS=""".sw{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.sw fieldset{border:0;margin:0;padding:0;display:flex;gap:2px;background:var(--surface2);border-radius:999px;padding:3px}
.sw legend{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.sw label{position:relative;display:inline-flex;align-items:center;min-height:40px;padding:0 12px;border-radius:999px;font:600 13px/1 var(--font-body);cursor:pointer;color:var(--ink)}
.sw input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}.sw label:has(input:checked){background:var(--surface);box-shadow:0 1px 3px rgb(0 0 0/.18)}.sw label:has(input:focus-visible){outline:3px solid var(--accent);outline-offset:2px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}header.nav .wrap{flex-wrap:wrap;padding-block:6px}
html{transition:background-color var(--dur-3)}"""
FONTS='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Geist:wght@400;500;600;700;800&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=JetBrains+Mono:wght@500&display=swap">'
BOOT="""<script>(function(){var d=document.documentElement,t=localStorage.getItem('jd-theme')||'editorial',m=localStorage.getItem('jd-mode')||'system';
d.dataset.theme=t;d.dataset.pref=m;d.dataset.mode=m==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;d.classList.add('js')})()</script>"""
html=re.sub(r'<link rel="stylesheet" href="https://fonts[^>]*>',FONTS,html)
html=re.sub(r"<style>.*?</style><script>document.documentElement.classList.add\('js'\)</script>",lambda m:BOOT+"<style>"+tokens+css+SW_CSS+"</style>",html,flags=re.S)
html=html.replace("<title>A. Soft editorial – jdilig.me UX direction</title>","<title>UX themes – jdilig.me prototype</title>")
html=html.replace("Direction A</p>","Three themes, one token layer</p>").replace("Direction A. Soft editorial","Current theme")
SW="""<div class="sw" id="sw"><fieldset><legend>Theme</legend><label><input type="radio" name="theme" value="editorial">Editorial</label><label><input type="radio" name="theme" value="bold">Bold</label><label><input type="radio" name="theme" value="tactile">Tactile</label></fieldset>
<fieldset><legend>Color mode</legend><label><input type="radio" name="mode" value="system">Auto</label><label><input type="radio" name="mode" value="light">Light</label><label><input type="radio" name="mode" value="dark">Dark</label></fieldset><p class="sr" aria-live="polite" id="sw-live"></p></div>"""
html=html.replace('</nav></div></header>','</nav>'+SW+'</div></header>')
html=html.replace('Inspired by: <a href="https://stripe.com">Stripe</a> · <a href="https://www.apple.com/iphone/">Apple iPhone page</a> · <a href="https://godly.website">Godly</a>','Inspired by: Editorial, <a href="https://stripe.com">Stripe</a> and <a href="https://www.apple.com/iphone/">Apple iPhone page</a>; Bold, <a href="https://linear.app">Linear</a> and <a href="https://www.raycast.com">Raycast</a>; Tactile, <a href="https://arc.net">Arc</a> and <a href="https://www.framer.com">Framer</a>.')
# token table: show live computed values
html=re.sub(r"<tbody>.*?</tbody>","<tbody id=\"tokrows\"></tbody>",html,flags=re.S)
JS="""<script>(function(){var d=document.documentElement,live=document.getElementById('sw-live'),N={editorial:'Editorial',bold:'Bold',tactile:'Tactile'};
var K=['--r-card','--r-btn','--gap','--pad','--elev','--dur-1','--dur-2','--dur-3','--dur-4','--ease-out','--ease-press','--ticker-loop','--accent','--bg','--ink'];
function rows(){var cs=getComputedStyle(d);document.getElementById('tokrows').innerHTML=K.map(function(k){return '<tr><th scope=row><code>'+k+'</code></th><td><code>'+cs.getPropertyValue(k).trim()+'</code></td></tr>'}).join('')}
function sync(){document.querySelectorAll('#sw input').forEach(function(i){i.checked=(i.name==='theme'?d.dataset.theme:d.dataset.pref)===i.value})}
function apply(t,m,say){var sw=function(){d.dataset.theme=t;d.dataset.pref=m;d.dataset.mode=m==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;localStorage.setItem('jd-theme',t);localStorage.setItem('jd-mode',m);sync();rows()};
 if(say&&document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.startViewTransition(sw);else sw();
 if(say)live.textContent='Theme '+N[t]+', '+(m==='system'?'automatic ('+d.dataset.mode+')':m)+' mode'}
document.getElementById('sw').addEventListener('change',function(e){apply(e.target.name==='theme'?e.target.value:d.dataset.theme,e.target.name==='mode'?e.target.value:d.dataset.pref,true)});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){if(d.dataset.pref==='system')apply(d.dataset.theme,'system',false)});
sync();rows()})()</script>"""
html=html.replace("</body>",JS+"</body>")
open('index.html','w').write(html);print('ok',len(html))
