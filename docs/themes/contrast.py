from pal import P
def L(h):
    h=h.lstrip('#');c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=.03928 else ((x+.055)/1.055)**2.4 for x in c];return .2126*c[0]+.7152*c[1]+.0722*c[2]
def cr(a,b):
    a,b=L(a),L(b);return (max(a,b)+.05)/(min(a,b)+.05)
pairs=[("ink","bg",4.5),("ink","surface",4.5),("ink","surface2",4.5),("muted","bg",4.5),("muted","surface",4.5),("accent","bg",4.5),("accent","surface",4.5),("on_accent","accent",4.5),("accent","surface2",3)]
bad=0;out=["| Theme | Mode | "+" | ".join(f"{a} on {b}" for a,b,_ in pairs)+" |","|---|---|"+"---|"*len(pairs)]
for t,m in P.items():
  for mo,c in m.items():
    row=[];
    for a,b,n in pairs:
      r=cr(c[a],c[b]);row.append(f"{r:.1f}"+("" if r>=n else " FAIL"));bad+=r<n
    out.append(f"| {t} | {mo} | "+" | ".join(row)+" |")
print("\n".join(out));print("fails",bad)
open("contrast.md","w").write("\n".join(out)+"\n")
