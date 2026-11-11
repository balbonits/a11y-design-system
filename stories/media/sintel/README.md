# Sintel media for the VideoPlayer

This is the folder the `ember-ui/video` player reads. It is meant to be
served at `/media/sintel/`. Storybook's `staticDirs` isn't wired yet; that comes
with the R-4 player stories (PR #33). Everything is a static file in the repo, so
nothing is fetched from a CDN or a remote host at run time, and nothing here is
part of the core `ember-ui` bundle. Credit and license are in
[ATTRIBUTION.md](ATTRIBUTION.md).

| File | Size (bytes) | What it is | Player use |
|---|---:|---|---|
| `sintel-excerpt.mp4` | 3,002,474 (2.9 MiB) | 52 s excerpt, 1126×480 H.264 High at 24 fps, AAC-LC 96 kb/s stereo, `+faststart` | `source.src` |
| `captions.vtt` | 1,035 | English captions, 12 cues | `tracks`: `{ kind: 'captions', lang: 'en', label: 'English' }` |
| `ad.vtt` | 873 | Audio description, 6 cues placed in the dialogue gaps | `tracks`: `{ kind: 'descriptions', lang: 'en' }` |
| `transcript.txt` | 386 | Transcript, one cue per line (same as the player's `.txt` download, `toTxt`) | static download and reference |
| `transcript.vtt` | 792 | Transcript as WebVTT with no NOTE block (same as the player's `.vtt` download, `toVtt`) | static download and reference |

The clip is well under the 10 MB limit (ARCH-REVIEW R-4).

## How each file was made

Every file here is a **byte-for-byte copy** of the record in
[`tools/transcribe/samples/sintel/`](../../../tools/transcribe/samples/sintel/).
`sintel-excerpt.mp4` has the same name as the record, and git stores both as one blob,
so the repo doesn't grow. Never edit the copies by hand:
`tools/transcribe/tests/test_media_copies.py` fails if a copy differs from the
record.

- **`sintel-excerpt.mp4`**: cut from Blender's 1080p master with ffmpeg (command below).
- **`captions.vtt`**: `tools/transcribe/transcribe.py` runs faster-whisper 1.2.1
  (`small.en`, CPU float32, beam 5, temperature 0), so the output is
  repeatable. Cue starts are snapped to the voice onset found by Silero VAD, and
  lines are capped at 2 × 42 characters. Then 4 cues get hand corrections from
  `tools/transcribe/samples/sintel/corrections.json`. The corrections fix
  punctuation, a pause and two questions, checked against the speech spans and
  Blender's hand-made French subtitles. They change text only, never timings.
  All 12 starts fall within 0.68 s early and 0.38 s late of Blender's
  hand-timed subtitles (`spotcheck.py`).
  **Correction level: machine-checked (Whisper confidences, speech spans, Blender FR
  subtitles); no human listening pass yet.**
- **`ad.vtt`**: written by hand from the frames, `kind="descriptions"`. Each cue
  is short and factual and sits in a gap between lines of dialogue, so voicing
  never talks over a character. A unit test checks that no AD cue overlaps a caption.
- **`transcript.txt` and `transcript.vtt`**: rendered by `transcribe.py` from the
  same corrected cue list as `captions.vtt`. They equal
  `toTxt(parseVtt(captions.vtt))` and `toVtt(parseVtt(captions.vtt))` from
  `src/video/vtt.ts` (R-4, PR #33), the player's two transcript downloads.

## How to regenerate

```bash
# 1. The clip (only if it's ever re-cut; the record is committed)
ffmpeg -ss 00:01:45 -i https://download.blender.org/durian/movies/Sintel.2010.1080p.mkv -t 52 \
  -map 0:v:0 -map 0:a:0 -vf scale=-2:480 -c:v libx264 -preset slow -crf 28 \
  -c:a aac -b:a 96k -ac 2 -movflags +faststart tools/transcribe/samples/sintel/sintel-excerpt.mp4

# 2. Captions and transcripts (offline after the first run; applies corrections.json)
tools/transcribe/run.sh

# 3. Refresh the copies the player reads
S=tools/transcribe/samples/sintel D=stories/media/sintel
cp $S/sintel-excerpt.mp4 $D/
cp $S/captions.vtt $S/ad.vtt $S/transcript.txt $S/transcript.vtt $D/
```

`ad.vtt` is hand-written. To change it, edit the record in
`tools/transcribe/samples/sintel/ad.vtt` and copy it here.

## TODO

- A human listening pass over `captions.vtt` (optional, non-blocking).
- Speaker-change cues (for example a leading "- " or a speaker label where the
  speaker isn't on screen), once the listening pass confirms who says each line.
- Non-speech sound cues (music, fire, footsteps) in `captions.vtt`, from the same pass.

## Checks (CI, `transcribe` job)

- Every `.vtt` here and in the record passes W3C's webvtt.js parser in strict
  mode (`validate-vtt-w3c.mjs`) and `validate_vtt.py`. Within each track, cue
  times are monotonic and no cue starts before the previous one ends.
- The copies match the record byte for byte (`test_media_copies.py`).
- A clean-checkout `run.sh` reproduces the committed captions and transcripts exactly.
