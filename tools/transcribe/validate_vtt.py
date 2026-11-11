#!/usr/bin/env python3
"""Strict-enough WebVTT validator (W3C WebVTT file syntax), stdlib only.

Checks: UTF-8, optional BOM, "WEBVTT" signature line, blank line after the
header, cue timing lines "HH:MM:SS.mmm --> HH:MM:SS.mmm" (hours optional),
end > start, cue start times non-decreasing, no "-->" in cue text or ids,
no empty cue payloads. Exit 0 when every file is valid, 1 otherwise.

Usage: python3 validate_vtt.py FILE.vtt [FILE.vtt ...]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

TS = r"(?:\d{2,}:)?[0-5]\d:[0-5]\d\.\d{3}"
TIMING_RE = re.compile(rf"^({TS})[ \t]+-->[ \t]+({TS})(?:[ \t]+.*)?$")


def _secs(ts: str) -> float:
    parts = ts.split(":")
    if len(parts) == 2:
        parts.insert(0, "0")
    h, m, s = parts
    return int(h) * 3600 + int(m) * 60 + float(s)


def validate(text: str) -> list[str]:
    errs: list[str] = []
    if text.startswith("\ufeff"):
        text = text[1:]
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = text.split("\n")
    if not re.match(r"^WEBVTT(?:[ \t].*)?$", lines[0]):
        return ["line 1: missing WEBVTT signature"]
    i = 1
    while i < len(lines) and lines[i] != "":  # header continuation lines
        if "-->" in lines[i]:
            errs.append(f"line {i+1}: header must end with a blank line before cues")
        i += 1
    prev_start = -1.0
    ncues = 0
    while i < len(lines):
        while i < len(lines) and lines[i] == "":
            i += 1
        if i >= len(lines):
            break
        block_start = i
        block = []
        while i < len(lines) and lines[i] != "":
            block.append(lines[i])
            i += 1
        first = block[0]
        if first.startswith("NOTE") and (len(first) == 4 or first[4] in " \t"):
            if any("-->" in l for l in block):
                errs.append(f"line {block_start+1}: NOTE block contains '-->'")
            continue
        if first in ("STYLE", "REGION") and ncues == 0:
            continue
        j = 0
        if "-->" not in block[0]:
            j = 1  # cue identifier
        if j >= len(block) or not TIMING_RE.match(block[j]):
            errs.append(f"line {block_start+j+1}: bad cue timing line: {block[min(j, len(block)-1)]!r}")
            continue
        m = TIMING_RE.match(block[j])
        start, end = _secs(m.group(1)), _secs(m.group(2))
        if end <= start:
            errs.append(f"line {block_start+j+1}: end {m.group(2)} not after start {m.group(1)}")
        if start < prev_start:
            errs.append(f"line {block_start+j+1}: cue starts before the previous cue")
        prev_start = start
        payload = block[j + 1:]
        if not payload or not any(p.strip() for p in payload):
            errs.append(f"line {block_start+j+1}: empty cue payload")
        for k, p in enumerate(payload):
            if "-->" in p:
                errs.append(f"line {block_start+j+k+2}: '-->' in cue text")
        ncues += 1
    if ncues == 0:
        errs.append("no cues")
    return errs


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__.strip().splitlines()[-1])
        return 2
    bad = 0
    for name in argv:
        try:
            text = Path(name).read_bytes().decode("utf-8")
        except UnicodeDecodeError:
            print(f"FAIL {name}: not UTF-8")
            bad += 1
            continue
        errs = validate(text)
        if errs:
            bad += 1
            print(f"FAIL {name}")
            for e in errs:
                print(f"  {e}")
        else:
            print(f"OK   {name}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
