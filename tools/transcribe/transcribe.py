#!/usr/bin/env python3
"""Offline transcripter: media file -> cues.json + captions.vtt + transcript.txt.

Runs faster-whisper on CPU (float32). No network after the model is cached, and
no paid API. All three outputs come from one cue list (see cues.py).

Usage:
  python3 transcribe.py INPUT --out-dir DIR [--model small.en] [--lang en]
                        [--title "..."] [--credit "..."]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from cues import pad, render_txt, render_vtt, snap_starts, split_words, to_json, trim_lead_words


def transcribe(path: str, model_name: str, lang: str, threads: int):
    from faster_whisper import WhisperModel  # heavy import kept local
    import faster_whisper

    # float32, not int8: int8 CPU kernels gave a different transcript on each run
    # (and sometimes "for for for" loops); float32 is bit-for-bit repeatable.
    model = WhisperModel(model_name, device="cpu", compute_type="float32", cpu_threads=threads)
    segments, info = model.transcribe(
        path,
        language=lang,
        beam_size=5,
        temperature=0.0,          # no sampling fallback: same input, same output
        word_timestamps=True,
        vad_filter=False,         # Silero VAD clipped quiet lines ("A dangerous quest...")
        condition_on_previous_text=False,
    )
    words = [(w.start, w.end, w.word) for s in segments for w in (s.words or [])]
    meta = {
        "engine": f"faster-whisper {faster_whisper.__version__}",
        "model": model_name,
        "language": info.language,
        "duration": round(info.duration, 3),
    }
    return words, meta


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input")
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--model", default="small.en")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--no-snap", action="store_true",
                    help="keep Whisper's raw first-word start times (no lead-word trim, no VAD snap)")
    ap.add_argument("--title", default="")
    ap.add_argument("--credit", default="")
    a = ap.parse_args(argv)

    words, meta = transcribe(a.input, a.model, a.lang, a.threads)
    if not words:
        print("no speech found", file=sys.stderr)
        return 1
    spans = None
    if not a.no_snap:
        from spotcheck import speech_spans
        spans = speech_spans(a.input)
        words = trim_lead_words(words, spans)
    cues = split_words(words)
    if spans is not None:
        first_word_end = []
        for c in cues:  # end time of each cue's first word
            first_word_end.append(next(w[1] for w in words if round(w[0], 3) >= c.start))
        cues = snap_starts(cues, spans, first_word_end)
    cues = pad(cues)
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    note = "\n".join(x for x in [
        a.title,
        f"Machine-generated captions: {meta['engine']}, model {meta['model']}, CPU float32.",
        a.credit,
    ] if x)
    (out / "cues.json").write_text(to_json(cues), encoding="utf-8")
    (out / "captions.vtt").write_text(render_vtt(cues, header_note=note), encoding="utf-8")
    (out / "transcript.txt").write_text(render_txt(cues), encoding="utf-8")
    print(f"{len(cues)} cues, {meta['engine']}, {meta['model']}, audio {meta['duration']} s -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
