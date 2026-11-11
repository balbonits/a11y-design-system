"""Shared v3 HANDOFF.md writer (PROC-5/PROC-6: every handoff carries everything the receiver needs).
write(dir, fields) pastes UI Copywriter's V3-STATE-COPY tables, leaving out the dashboard rows still pending a decision."""
import os,re
COPY='/workspace/ux-projects/copy/V3-STATE-COPY.md'
def copy_tables():
    s=open(COPY).read()
    s=re.sub(r'### Not in DASH-SPEC v1\.0.*?(?=\n---\n)','',s,flags=re.S)   # pending rows: not handed off yet
    s=s.split('## Open questions')[0]
    body=s[s.index('## 1. Dev dashboard'):].replace('\n## ','\n### ')
    return body.strip()
def write(d,f):
    L=lambda xs:'\n'.join(f'- {x}' for x in xs)
    md=f"""# HANDOFF: v3 direction {f['title']}

From UX/UI Designer, {f['date']}. Card from Chief of Creatives (John's order, relayed by ECOS at 5:09 PM PT).

## Goal and John's ask
{f['goal']}

John's words, quoted in BRIEF.md: "make the design way different across all 3 UX projects (Ember UI + Storybook, job tracker, dev dashboard)."

## DONE criteria for this card (Chief of Creatives)
{L(f['done'])}

## Links
{L(f['links'])}

## Files in this folder
{L(f['files'])}

## Art direction as built
{L(f['art'])}

## Accessibility decisions
{L(f['a11y'])}

## Self-check results
{L(f['checks'])}

## Prior decisions this follows
{L(f['decisions'])}

## Known issues and open questions
{L(f['issues'])}

## Dependencies
{L(f['deps'])}

## Who to ask
{L(f['ask'])}

## ETA and next steps
{L(f['eta'])}

## State microcopy (pasted from {COPY}, UI Copywriter, 2026-11-10)
The prototype uses these strings where its screens show the same component. The dashboard stats, builds list and chart rows are left out on purpose: they are pending a Chief of Creatives decision because DASH-SPEC v1.0 doesn't include them.

{copy_tables()}
"""
    open(os.path.join(d,'HANDOFF.md'),'w').write(md)
