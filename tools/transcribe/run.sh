#!/usr/bin/env bash
# Regenerate the Sintel sample captions from a clean checkout, then check them.
# Offline after the first run (pip wheels and the Whisper model are cached).
#   tools/transcribe/run.sh            # full run: venv, transcribe, validate, spot-check
#   VENV=/path/to/venv tools/transcribe/run.sh
set -euo pipefail
cd "$(dirname "$0")"
VENV="${VENV:-.venv}"
S=samples/sintel

command -v ffmpeg >/dev/null || { echo "ffmpeg is required (apt install ffmpeg)"; exit 1; }
[ -x "$VENV/bin/python" ] || python3 -m venv "$VENV"
"$VENV/bin/pip" install -q -r requirements.txt
PY="$VENV/bin/python"

"$PY" transcribe.py "$S/sintel-excerpt.mp4" --out-dir "$S" --model small.en \
  --title "Sintel (excerpt 01:45-02:37)" \
  --credit "Sintel (c) copyright Blender Foundation | durian.blender.org | CC BY 3.0"
"$PY" validate_vtt.py "$S/captions.vtt" "$S/ad.vtt"
"$PY" -m unittest discover -s tests
"$PY" spotcheck.py "$S/sintel-excerpt.mp4" "$S/captions.vtt" \
  --ref "$S/reference/sintel_fr.srt" --ref-offset -105
