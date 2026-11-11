#!/usr/bin/env python3
"""Spot-check caption timing against the audio, and optionally a reference.

1. Reference (--ref): compares each cue start with hand-timed subtitles, such
   as Blender's official Sintel .srt shifted by --ref-offset seconds. A cue
   passes when it starts no more than --early s before and --late s after the
   nearest reference start, or falls inside a reference line that a
   translation merged from two English lines. This is the pass/fail check.
2. Audio: Silero VAD (bundled with faster-whisper) finds where speech is in
   the clip. Each cue's nearest speech onset and its speech overlap are shown;
   without --ref, the onset must be within --tol s and overlap >= 50%.

Usage: python3 spotcheck.py MEDIA CAPTIONS.vtt [--ref REF.srt --ref-offset -105]
Exit 1 if any cue fails.
"""
from __future__ import annotations

import argparse
import re
import sys

from cues import parse_vtt

SR = 16000


def speech_spans(path: str) -> list[tuple[float, float]]:
    from faster_whisper.audio import decode_audio
    from faster_whisper.vad import VadOptions, get_speech_timestamps

    audio = decode_audio(path, sampling_rate=SR)
    opts = VadOptions(threshold=0.3, min_silence_duration_ms=150, speech_pad_ms=0)
    return [(t["start"] / SR, t["end"] / SR) for t in get_speech_timestamps(audio, opts)]


def srt_spans(path: str, offset: float) -> list[tuple[float, float]]:
    text = open(path, encoding="utf-8-sig", errors="replace").read()
    t = r"(\d+):(\d+):(\d+),(\d+)"
    out = []
    for g in re.findall(rf"{t}\s+-->\s+{t}", text):
        v = [int(x) for x in g]
        out.append((v[0] * 3600 + v[1] * 60 + v[2] + v[3] / 1000 + offset,
                    v[4] * 3600 + v[5] * 60 + v[6] + v[7] / 1000 + offset))
    return out


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("media")
    ap.add_argument("vtt")
    ap.add_argument("--ref")
    ap.add_argument("--ref-offset", type=float, default=0.0)
    ap.add_argument("--tol", type=float, default=0.30)
    ap.add_argument("--early", type=float, default=0.75)
    ap.add_argument("--late", type=float, default=0.50)
    a = ap.parse_args(argv)

    cues = parse_vtt(open(a.vtt, encoding="utf-8").read())
    spans = speech_spans(a.media)
    refs = [r for r in (srt_spans(a.ref, a.ref_offset) if a.ref else []) if r[1] > 0]

    fails = 0
    print(f"{len(spans)} speech spans (Silero VAD), tolerance {a.tol:.2f} s")
    print(f"{'#':>2} {'start':>6} {'onset':>6} {'delta':>6} {'speech%':>7} {'ref':>6} {'ref d':>6}  result")
    for i, c in enumerate(cues, 1):
        inside = any(s <= c.start <= e for s, e in spans)
        onset = min((s for s, _ in spans), key=lambda s: abs(s - c.start), default=None)
        delta = 0.0 if inside and onset is not None and abs(onset - c.start) > a.tol else (
            onset - c.start if onset is not None else None)
        overlap = sum(max(0.0, min(e, c.end) - max(s, c.start)) for s, e in spans)
        frac = overlap / (c.end - c.start)
        if refs:
            r = min((x[0] for x in refs), key=lambda x: abs(x - c.start))
            merged = any(x0 + a.late < c.start < x1 for x0, x1 in refs)
            ok = -a.early <= c.start - r <= a.late or merged
            rs, rd = f"{r:6.2f}", ("merged" if merged and not -a.early <= c.start - r <= a.late
                                    else f"{c.start - r:+.2f}")
        else:
            ok = delta is not None and abs(delta) <= a.tol and frac >= 0.5
            rs, rd = "     -", "     -"
        fails += not ok
        on = f"{onset:6.2f}" if onset is not None else "     -"
        d = f"{delta:+.2f}" if delta is not None else "  none"
        print(f"{i:>2} {c.start:6.2f} {on} {d:>6} {frac:7.0%} {rs} {rd:>6}  "
              f"{'PASS' if ok else 'FAIL'}  {c.text[:44]}")
    basis = "the reference timing" if refs else "detected speech"
    print(f"{len(cues) - fails}/{len(cues)} cues line up with {basis}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
