import json,re
# ---------- Layer 1: primitives (raw palette + ramps). Only this layer has raw values. ----------
PRIM={
# editorial (= current Ember UI stone/ember palette)
"stone-0":"#fffdf8","stone-50":"#f4f1ea","stone-100":"#e9e4d8","stone-200":"#d9d3c7","stone-400":"#6b7077","stone-700":"#3b3f45","stone-900":"#16181b",
"stone-950d":"#12110f","stone-900d":"#1b1a17","stone-800d":"#26241f","stone-600d":"#8a8479","stone-100d":"#cfcac0","stone-50d":"#f1ede4",
"ember-50":"#f6e6dc","ember-300":"#ffa676","ember-400":"#ff8a4c","ember-700":"#b93d0b","ember-800":"#9a3209","ember-950":"#2a1509",
# bold (night/violet)
"night-0":"#ffffff","night-50":"#f6f5fa","night-100":"#e9e7f2","night-200":"#d6d3e3","night-400":"#6c6680","night-600":"#565068","night-900":"#13111a",
"night-950d":"#0b0a10","night-900d":"#15131c","night-800d":"#24202e","night-600d":"#7d7691","night-300d":"#b3adc2","night-50d":"#f4f1fa",
"flare-50":"#fef3ec","flare-300":"#ffa070","flare-400":"#ff7a3d","flare-700":"#c2410c","flare-800":"#9a330a","flare-950":"#2b1206",
"violet-400":"#9d86ff","violet-700":"#5b3fd6",
# tactile (oat/forest)
"oat-0":"#fcf5e8","oat-50":"#f3ead9","oat-100":"#f6d9a6","oat-200":"#e5d6bb","oat-600":"#5e4c38","oat-900":"#2a1f14",
"oat-950d":"#1f1a14","oat-900d":"#2a231b","oat-800d":"#4a3a26","oat-300d":"#cbbba4","oat-50d":"#f6ecdc",
"forest-50":"#dcebe1","forest-300":"#a6dbbb","forest-400":"#86c9a2","forest-700":"#2f6b4f","forest-800":"#24543e","forest-950":"#10251a",
# shared
"white":"#ffffff","teal-300":"#8fd3e0","teal-700":"#0f5f73",
"green-400":"#4ade80","green-700":"#15803d","green-800":"#166534","amber-300":"#fcd34d","amber-800":"#92400e","amber-900":"#78350f",
"red-300":"#fca5a5","red-400":"#f87171","red-700":"#b91c1c","red-800":"#991b1b","sky-400":"#38bdf8","sky-700":"#0369a1","sky-800":"#075985",
}
# ---------- Layer 2: semantic, per theme x mode (color) ----------
def M(**k):return k
LIGHT_STATUS=dict(success="green-700",warning="amber-800",danger="red-700",danger_hover="red-800",danger_contrast="white",info="sky-700",focus="teal-700")
DARK_STATUS=dict(success="green-400",warning="amber-300",danger="red-400",danger_hover="red-300",info="sky-400",focus="teal-300")
C={
("editorial","light"):M(**{**LIGHT_STATUS,"success":"green-800"},color_bg="stone-50",surface="stone-0",surface_muted="stone-100",text="stone-900",text_muted="stone-700",border="stone-400",border_subtle="stone-200",accent="ember-700",accent_hover="ember-800",accent_soft="ember-50",accent_contrast="white"),
("editorial","dark"):M(color_bg="stone-950d",surface="stone-900d",surface_muted="stone-800d",text="stone-50d",text_muted="stone-100d",border="stone-600d",border_subtle="stone-800d",accent="ember-400",accent_hover="ember-300",accent_soft="ember-950",accent_contrast="stone-950d",danger_contrast="stone-950d",**DARK_STATUS),
("bold","light"):M(color_bg="night-50",surface="night-0",surface_muted="night-100",text="night-900",text_muted="night-600",border="night-400",border_subtle="night-200",accent="flare-700",accent_hover="flare-800",accent_soft="flare-50",accent_contrast="white",**LIGHT_STATUS),
("bold","dark"):M(color_bg="night-950d",surface="night-900d",surface_muted="night-800d",text="night-50d",text_muted="night-300d",border="night-600d",border_subtle="night-800d",accent="flare-400",accent_hover="flare-300",accent_soft="flare-950",accent_contrast="night-950d",danger_contrast="night-950d",**DARK_STATUS),
("tactile","light"):M(color_bg="oat-50",surface="oat-0",surface_muted="oat-100",text="oat-900",text_muted="oat-600",border="oat-900",border_subtle="oat-200",accent="forest-700",accent_hover="forest-800",accent_soft="forest-50",accent_contrast="white",**{**LIGHT_STATUS,"success":"green-800","warning":"amber-900","info":"sky-800"}),
("tactile","dark"):M(color_bg="oat-950d",surface="oat-900d",surface_muted="oat-800d",text="oat-50d",text_muted="oat-300d",border="oat-300d",border_subtle="oat-800d",accent="forest-400",accent_hover="forest-300",accent_soft="forest-950",accent_contrast="forest-950",danger_contrast="oat-950d",**DARK_STATUS),
}
# semantic, per theme (shape, type, depth, motion character) -- may reference primitives/ramps or semantic colors
SEM={
"editorial":dict(font_display="var(--font-serif)",font_body="var(--font-sans)",weight_display="400",radius_surface="28px",radius_control="9999px",radius_field="14px",border_width="1px",
  shadow_1="0 1px 3px rgb(0 0 0 / .08)",shadow_2="0 1px 2px rgb(0 0 0 / .05), 0 18px 40px -12px rgb(0 0 0 / .16)",shadow_press="none",blur_glass="14px",
  duration_fast="120ms",duration_base="220ms",duration_slow="420ms",duration_reveal="720ms",ease_standard="cubic-bezier(.22,1,.36,1)",ease_press="cubic-bezier(.3,0,.5,1)",duration_ticker="28s",parallax_scale="1",lift="-2px"),
"bold":dict(font_display="var(--font-sans)",font_body="var(--font-sans)",weight_display="800",radius_surface="22px",radius_control="12px",radius_field="12px",border_width="1px",
  shadow_1="0 0 0 1px var(--border-subtle)",shadow_2="0 0 0 1px var(--border-subtle), 0 24px 60px -20px rgb(0 0 0 / .55)",shadow_press="0 8px 30px -6px color-mix(in srgb, var(--accent) 55%, transparent)",blur_glass="16px",
  duration_fast="100ms",duration_base="180ms",duration_slow="360ms",duration_reveal="640ms",ease_standard="cubic-bezier(.16,1,.3,1)",ease_press="cubic-bezier(.4,0,.2,1)",duration_ticker="22s",parallax_scale="1.4",lift="-3px"),
"tactile":dict(font_display="var(--font-grotesque)",font_body="var(--font-grotesque)",weight_display="800",radius_surface="20px",radius_control="14px",radius_field="12px",border_width="2px",
  shadow_1="2px 2px 0 var(--border)",shadow_2="4px 4px 0 var(--border)",shadow_press="3px 3px 0 var(--border)",blur_glass="10px",
  duration_fast="90ms",duration_base="200ms",duration_slow="380ms",duration_reveal="600ms",ease_standard="cubic-bezier(.34,1.56,.64,1)",ease_press="cubic-bezier(.5,0,.5,1)",duration_ticker="28s",parallax_scale=".8",lift="-2px"),
}
# ---------- Layer 3: component tokens (semantic only) ----------
COMP={
"button-radius":"var(--radius-control)","button-border-width":"var(--border-width)","button-shadow":"var(--shadow-press)","button-bg":"var(--accent)","button-fg":"var(--accent-contrast)","button-bg-hover":"var(--accent-hover)",
"button-lift":"var(--lift)","button-duration":"var(--duration-base)","button-press-duration":"var(--duration-fast)","button-ease":"var(--ease-standard)","button-press-ease":"var(--ease-press)",
"field-radius":"var(--radius-field)","field-border":"var(--border-width) solid var(--border)","field-bg":"var(--surface)","field-fg":"var(--text)",
"card-radius":"var(--radius-surface)","card-bg":"var(--surface)","card-shadow":"var(--shadow-2)","card-border":"var(--border-width) solid var(--border-subtle)",
"modal-radius":"var(--radius-surface)","modal-shadow":"var(--shadow-2)","modal-backdrop":"color-mix(in srgb, var(--text) 45%, transparent)",
"tabs-radius":"var(--radius-control)","tabs-track":"var(--surface-muted)","tabs-active-bg":"var(--surface)",
"toast-radius":"var(--radius-field)","toast-bg":"var(--text)","toast-fg":"var(--color-bg)",
"table-border":"1px solid var(--border-subtle)","table-head-bg":"var(--surface-muted)",
"focus-ring":"3px solid var(--focus)","focus-offset":"2px",
"ticker-duration":"var(--duration-ticker)","reveal-duration":"var(--duration-reveal)","reveal-ease":"var(--ease-standard)","parallax-scale":"var(--parallax-scale)",
}
TYPE_EXTRA={"font-grotesque":'"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif'}
v=lambda k:"--"+k.replace("_","-")
hexof=lambda t,m,k:PRIM[C[(t,m)][k]]
# primitives.css
p=["/* Layer 1 - primitives. The ONLY file allowed to contain raw color values. Keep the existing Ember type/space ramps alongside this. */",":root {"]
p+=[f"  --palette-{k}: {h};" for k,h in PRIM.items()]+[f"  --{k}: {x};" for k,x in TYPE_EXTRA.items()]+["}"]
open("primitives.css","w").write("\n".join(p)+"\n")
# semantic.css
s=["/* Layer 2 - semantic. Axes: data-theme=editorial|bold|tactile (absent = editorial), data-mode=light|dark (absent = prefers-color-scheme). */"]
def colblock(t,m):return "\n".join(f"  {v(k)}: var(--palette-{x});" for k,x in C[(t,m)].items())
for t in SEM:
    sel=f':root, :root[data-theme="editorial"]' if t=="editorial" else f':root[data-theme="{t}"]'
    s.append(f"{sel} {{\n"+"\n".join(f"  {v(k)}: {x};" for k,x in SEM[t].items())+"\n}")
    lsel=(":root:not([data-theme]), " if t=="editorial" else "")+f':root[data-theme="{t}"]'
    s.append(f"{lsel.replace(', ',':not([data-mode=dark]), ')}:not([data-mode=\"dark\"]) {{\n  color-scheme: light;\n{colblock(t,'light')}\n}}".replace(':not([data-mode=dark]), ',':not([data-mode="dark"]), '))
    s.append(f'{lsel.replace(", ",'[data-mode="dark"], ')}[data-mode="dark"] {{\n  color-scheme: dark;\n{colblock(t,"dark")}\n}}')
    s.append(f'@media (prefers-color-scheme: dark) {{\n  {lsel.replace(", ",":not([data-mode]), ")}:not([data-mode]) {{\n    color-scheme: dark;\n'+colblock(t,"dark").replace("\n  ","\n    ").replace("  --","    --",1)+"\n  }\n}")
s.append("@media (prefers-reduced-motion: reduce) {\n  :root { --duration-fast: 0ms; --duration-base: 0ms; --duration-slow: 0ms; --duration-reveal: 0ms; --parallax-scale: 0; --lift: 0px; }\n}")
open("semantic.css","w").write("\n\n".join(s)+"\n")
open("components.css","w").write("/* Layer 3 - component tokens. Reference semantic tokens only (CI: no raw hex/rgb, no --palette-*). */\n:root {\n"+"\n".join(f"  --{k}: {x};" for k,x in COMP.items())+"\n}\n")
# tokens.json
J={"primitives":PRIM,"semantic":{f"{t}.{m}":{v(k):PRIM[x] for k,x in C[(t,m)].items()} for (t,m) in C},"semantic_shape":{t:{v(k):x for k,x in SEM[t].items()} for t in SEM},"components":COMP}
json.dump(J,open("tokens.json","w"),indent=1)
print("ok")
