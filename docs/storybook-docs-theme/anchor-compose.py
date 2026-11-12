# FU-SB-DOCS-ANCHOR-KBD: annotates the anchor-shots.cjs captures. A dashed cyan box marks the 44x44 target, a badge names
# it, and a legend under the shot gives width, mode, accessible name, ring and box. Output: 8-bit truecolor PNG (RGB).
# Usage: python3 anchor-compose.py <rawDir> <outDir>
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
raw, out = sys.argv[1], sys.argv[2]; S = 2
meta = json.load(open(os.path.join(raw, 'anchor-shots.json')))
def font(sz):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf']:
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()
F, FB = font(13 * S), font(12 * S)
def dashed(d, box, col, w):
    x0, y0, x1, y1 = box; L = 5 * S
    for x in range(int(x0), int(x1), 2 * L): d.line([(x, y0), (min(x + L, x1), y0)], fill=col, width=w); d.line([(x, y1), (min(x + L, x1), y1)], fill=col, width=w)
    for y in range(int(y0), int(y1), 2 * L): d.line([(x0, y), (x0, min(y + L, y1))], fill=col, width=w); d.line([(x1, y), (x1, min(y + L, y1))], fill=col, width=w)
for name, m in meta.items():
    im = Image.open(os.path.join(raw, name + '.raw.png')).convert('RGB')
    if m['w'] > 640: im = im.crop((0, 0, 640 * S, im.height))  # 1280: keep the left half, where the heading is
    W = im.width; a = m['anchor']; CY = (0, 163, 255)
    d = ImageDraw.Draw(im)
    dashed(d, (a['x'] * S - 16, a['y'] * S - 16, (a['x'] + a['w']) * S + 16, (a['y'] + a['h']) * S + 16), CY, 2)
    lines = [f"{m['w']}px {m['mode']}: keyboard focus on the heading link (pointer moved away; icon stays shown)",
             f"name \"{m['name']}\"  ring {m['ringW']} {m['ring']} (--focus-ring-color) around the icon",
             f"cyan dashes, drawn 8px outside the 44x44 target (clear of the ring), target at x {a['x']:.0f}..{a['x'] + a['w']:.0f}, column {m['col']['x']:.0f}..{m['col']['x'] + m['col']['w']:.0f}, scrollWidth {m['sw']} (= viewport)"]
    if 'longest' in name: lines.insert(1, 'longest docs heading at 320: it wraps, and the icon stays on the last line with its last word')
    # wrap long lines to the image width
    wrapped = []
    for ln in lines:
        cur = ''
        for word in ln.split(' '):
            t = (cur + ' ' + word).strip()
            if d.textlength(t, font=F) > W - 24 * S and cur: wrapped.append(cur); cur = word
            else: cur = t
        wrapped.append(cur)
    lh = 18 * S; leg = Image.new('RGB', (W, lh * len(wrapped) + 16 * S), (24, 24, 28)); ld = ImageDraw.Draw(leg)
    for i, ln in enumerate(wrapped): ld.text((12 * S, 8 * S + i * lh), ln, font=F, fill=(240, 240, 240))
    canvas = Image.new('RGB', (W, im.height + leg.height), (0, 0, 0)); canvas.paste(im, (0, 0)); canvas.paste(leg, (0, im.height))
    canvas.save(os.path.join(out, name + '.png'), optimize=True)
    print(name, canvas.size, canvas.mode)
