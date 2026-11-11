"""One cue model for captions, transcript and audio description.

A Cue is (start, end, text) in seconds. Captions (.vtt), the plain transcript
(.txt) and cues.json are all rendered from the same list, so they cannot drift.
Stdlib only, so the renderer, parser and tests run without faster-whisper.
"""
from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass

TS_RE = re.compile(r"^(?:(\d{2,}):)?([0-5]\d):([0-5]\d)\.(\d{3})$")


@dataclass(frozen=True)
class Cue:
    start: float
    end: float
    text: str


def fmt_ts(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def parse_ts(value: str) -> float:
    m = TS_RE.match(value)
    if not m:
        raise ValueError(f"bad WebVTT timestamp: {value!r}")
    h, mi, s, ms = m.groups()
    return round(int(h or 0) * 3600 + int(mi) * 60 + int(s) + int(ms) / 1000, 3)


def wrap(text: str, width: int = 42) -> list[str]:
    """Wrap to at most two balanced lines of <= `width` chars where possible.

    Picks the word break that makes the two lines closest in length, so short
    orphans like a lone last word are avoided. Longer text falls back to greedy.
    """
    words = text.split()
    if len(text) <= width or len(words) < 2:
        return [" ".join(words)]
    best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        if len(a) <= width and len(b) <= width:
            score = abs(len(a) - len(b))
            if best is None or score < best[0]:
                best = (score, [a, b])
    if best:
        return best[1]
    lines: list[str] = []
    cur = ""
    for word in words:
        if cur and len(cur) + 1 + len(word) > width:
            lines.append(cur)
            cur = word
        else:
            cur = f"{cur} {word}" if cur else word
    if cur:
        lines.append(cur)
    return lines


def _escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def render_vtt(cues: list[Cue], header_note: str | None = None, width: int = 42) -> str:
    out = ["WEBVTT", ""]
    if header_note:
        out += ["NOTE", *header_note.strip().splitlines(), ""]
    for i, c in enumerate(cues, 1):
        out.append(str(i))
        out.append(f"{fmt_ts(c.start)} --> {fmt_ts(c.end)}")
        out += [_escape(line) for line in wrap(c.text, width)]
        out.append("")
    return "\n".join(out)


def render_txt(cues: list[Cue], gap: float = 2.0) -> str:
    """Plain transcript: cue texts joined; a pause longer than `gap` starts a paragraph."""
    paras: list[list[str]] = []
    prev_end = None
    for c in cues:
        if prev_end is None or c.start - prev_end > gap:
            paras.append([])
        paras[-1].append(c.text.strip())
        prev_end = c.end
    return "\n\n".join(" ".join(p) for p in paras) + "\n"


def to_json(cues: list[Cue]) -> str:
    return json.dumps([asdict(c) for c in cues], indent=2, ensure_ascii=False) + "\n"


def from_json(text: str) -> list[Cue]:
    return [Cue(float(d["start"]), float(d["end"]), str(d["text"])) for d in json.loads(text)]


def parse_vtt(text: str) -> list[Cue]:
    """Minimal parser for cue blocks (used for AD tracks and round-trip tests)."""
    cues: list[Cue] = []
    blocks = re.split(r"\n{2,}", text.replace("\r\n", "\n").strip())
    for block in blocks[1:]:
        lines = block.split("\n")
        if lines[0].startswith(("NOTE", "STYLE", "REGION")):
            continue
        idx = next((i for i, l in enumerate(lines) if "-->" in l), None)
        if idx is None:
            continue
        start, _, rest = lines[idx].partition("-->")
        end = rest.strip().split()[0]
        body = " ".join(lines[idx + 1:])
        body = body.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
        cues.append(Cue(parse_ts(start.strip()), parse_ts(end), body))
    return cues


def split_words(words: list[tuple[float, float, str]], max_chars: int = 84,
                max_dur: float = 6.0, pause: float = 0.7) -> list[Cue]:
    """Group word timings into caption-sized cues (2 lines of 42, <= 6 s).

    Breaks on sentence punctuation, on pauses longer than `pause`, or when the
    cue would exceed `max_chars` / `max_dur`.
    """
    cues: list[Cue] = []
    cur: list[tuple[float, float, str]] = []

    def flush():
        if cur:
            text = " ".join(w[2].strip() for w in cur).strip()
            cues.append(Cue(round(cur[0][0], 3), round(cur[-1][1], 3), text))
            cur.clear()

    for w in words:
        if cur:
            text_len = len(" ".join(x[2].strip() for x in cur)) + 1 + len(w[2].strip())
            if (w[0] - cur[-1][1] > pause or text_len > max_chars
                    or w[1] - cur[0][0] > max_dur):
                flush()
        cur.append(w)
        if w[2].strip().endswith((".", "?", "!")):
            flush()
    flush()
    return cues


def pad(cues: list[Cue], tail: float = 0.3, min_dur: float = 1.0, gap: float = 0.05) -> list[Cue]:
    """Give cues readable durations: extend each end by `tail` and to at least
    `min_dur`, never past the next cue's start minus `gap`. Starts never move,
    so captions never appear before the words are spoken."""
    out: list[Cue] = []
    for i, c in enumerate(cues):
        end = max(c.end + tail, c.start + min_dur)
        if i + 1 < len(cues):
            end = min(end, cues[i + 1].start - gap)
        out.append(Cue(c.start, round(max(end, c.end), 3), c.text))
    return out


def snap_starts(cues: list[Cue], spans: list[tuple[float, float]],
                first_word_end: list[float]) -> list[Cue]:
    """Move a cue start later to the voice onset found by VAD.

    Whisper often stamps a segment's first word early, absorbing the silence
    before it. If the cue starts outside detected speech and a speech onset
    falls before its first word ends, start the cue there instead. Starts only
    ever move later and never past the first word, so no words are cut.
    """
    out: list[Cue] = []
    for c, fwe in zip(cues, first_word_end):
        start = c.start
        if not any(s <= c.start < e for s, e in spans):
            onsets = [s for s, _ in spans if c.start < s < fwe]
            if onsets:
                start = round(onsets[0], 3)
        out.append(Cue(start, c.end, c.text))
    return out


def trim_lead_words(words: list[tuple[float, float, str]],
                    spans: list[tuple[float, float]] | None = None, max_dur: float = 0.6,
                    keep: float = 0.4, gap: float = 0.2) -> list[tuple[float, float, str]]:
    """Fix Whisper's stretched first word after a pause.

    After silence Whisper tends to stamp the first word as starting up to a
    second early (in the Sintel clip, every such word was ~0.76 s long). For a
    word that follows a pause of at least `gap` and lasts longer than
    `max_dur`, keep only the last `keep` seconds of it. With VAD `spans`,
    a word that already starts inside detected speech is left alone.
    """
    out = []
    prev_end = None
    for s, e, t in words:
        in_speech = spans is not None and any(a <= s < b for a, b in spans)
        if (prev_end is None or s - prev_end >= gap) and e - s > max_dur and not in_speech:
            s = e - keep
        out.append((s, e, t))
        prev_end = e
    return out
