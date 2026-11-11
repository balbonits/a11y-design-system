"""Shared v3 HANDOFF.md writer (PROC-5/PROC-6: every handoff carries everything the receiver needs).
write(dir, body) appends UI Copywriter's V3-STATE-COPY tables, leaving out the dashboard rows still pending a decision."""
import os,re
COPY='/workspace/ux-projects/copy/V3-STATE-COPY.md'
NAMES={'1':'dev dashboard','2':'job tracker'}
def copy_tables(part=None):
    s=open(COPY).read()
    s=re.sub(r'### Not in DASH-SPEC v1\.0.*?(?=\n---\n)','',s,flags=re.S)   # pending rows: not handed off yet
    s=s.split('## Open questions')[0]
    body=s[s.index('## 1. Dev dashboard'):]
    if part:   # only this HANDOFF's own project section (Creatives ruling 2026-11-10)
        body=next(c for c in ('\n'+body).split('\n## ') if c.startswith(part+'. '))
        body='## '+body.split('\n---')[0]
    return body.replace('\n## ','\n### ').replace('## ','### ',1).strip() if part else body.replace('\n## ','\n### ').strip()
def intro(part):
    if not part: return "Use these exact strings. The dashboard stats, builds list and chart rows are left out on purpose: they are pending a Chief of Creatives decision because DASH-SPEC v1.0 doesn't include them (see Known issues)."
    return f"Use these exact strings. Only the {NAMES[part]} section is pasted, because this HANDOFF specs only its own project (Chief of Creatives ruling, 2026-11-10). The v1.1 candidates have no strings on purpose."
def write(d,body,part=None):
    """body: the H-1..H-8 handoff text (neo HANDOFF.md template). Appends UI Copywriter's state copy so every string is written down (PROC-6)."""
    md=body.rstrip()+f"""

## Copy: every state string (pasted from V3-STATE-COPY.md, UI Copywriter, 2026-11-10)
{intro(part)}

{copy_tables(part)}

Anything missing or unclear: tell Chief of Creatives and it gets added here, not guessed.
"""
    open(os.path.join(d,'HANDOFF.md'),'w').write(md)
