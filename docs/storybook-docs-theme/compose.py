# Adds each shot's legend (from <prefix>-legends.json) under the image and saves lossless 8-bit RGB PNG.
# Usage: python3 compose.py   (run in docs/storybook-docs-theme after shoot.cjs)
import json, glob, os
from PIL import Image, ImageDraw, ImageFont
here = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'handoff')
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 12)
except OSError: font = ImageFont.load_default()
for lf in glob.glob(os.path.join(here, '*-legends.json')):
    for name, legend in json.load(open(lf)).items():
        f = os.path.join(here, name); im = Image.open(f).convert('RGB')
        if not legend: im.save(f, optimize=True); continue
        W = im.width; d0 = ImageDraw.Draw(im); lines = []
        for n, txt, bg in legend:  # wrap each note to the image width
            txt = txt.split(' ', 1)[1] if txt.split(' ', 1)[0] == str(n) else txt
            words, cur, out = txt.split(), '', []
            for w in words:
                t = (cur + ' ' + w).strip()
                if d0.textlength(t, font=font) > W - 40: out.append(cur); cur = w
                else: cur = t
            out.append(cur); lines.append((n, out, bg))
        h = 8 + sum(len(o) * 16 + 4 for _, o, _ in lines)
        canvas = Image.new('RGB', (W, im.height + h), (255, 255, 255)); canvas.paste(im, (0, 0)); d = ImageDraw.Draw(canvas); y = im.height + 6
        for n, out, bg in lines:
            d.rectangle([6, y, 24, y + 15], fill=bg); d.text((10 if n < 10 else 7, y + 1), str(n), fill=(255, 255, 255), font=font)
            for i, t in enumerate(out): d.text((30, y + 1 + i * 16), t, fill=(17, 17, 17), font=font)
            y += len(out) * 16 + 4
        canvas.save(f, optimize=True)
print('composed')
