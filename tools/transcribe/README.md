# tools/transcribe

Offline transcripter for the VideoPlayer demo (Card 1-VP). It turns a media
file into **WebVTT captions**, a transcript as **.txt and .vtt** (the
player's two download formats), and a `cues.json` cue list. Hand corrections
to the machine text live in a reviewed `corrections.json` and are applied on
every run, so the committed files stay reproducible. It runs [faster-whisper](https://github.com/SYSTRAN/faster-whisper) on the CPU, with no
network after the first run and no paid API. It is meant to run on a Grok Bot
box (Linux, x86-64) and was built and run there. It is never run on evo-x2 or
the M8.

## One cue model

The script builds one list of cues (`start`, `end`, `text`) and renders all
every output from that same list (`cues.py`). `captions.vtt`,
`transcript.txt`, `transcript.vtt` and `cues.json` can't drift apart. A unit test re-parses the
committed files and checks that they match. The VideoPlayer's transcript panel
should read the same `.vtt` it shows as captions.

## Quick start (clean checkout)

```bash
sudo apt install ffmpeg python3-venv   # once
tools/transcribe/run.sh
```

`run.sh` creates `tools/transcribe/.venv`, installs the pinned
`requirements.txt`, transcribes the Sintel sample, validates both `.vtt`
files, runs the unit tests, and spot-checks the caption timing. The first run
downloads the `small.en` model (about 480 MB) into `~/.cache/huggingface`.
Later runs are fully offline.

## Exact commands

```bash
python3 -m venv tools/transcribe/.venv
tools/transcribe/.venv/bin/pip install -r tools/transcribe/requirements.txt
cd tools/transcribe
.venv/bin/python transcribe.py samples/sintel/sintel-excerpt.mp4 \
  --out-dir samples/sintel --model small.en \
  --title "Sintel (excerpt 01:45-02:37)" \
  --credit "Sintel (c) copyright Blender Foundation | durian.blender.org | CC BY 3.0" \
  --corrections samples/sintel/corrections.json
.venv/bin/python validate_vtt.py samples/sintel/captions.vtt samples/sintel/ad.vtt samples/sintel/transcript.vtt
.venv/bin/python spotcheck.py samples/sintel/sintel-excerpt.mp4 samples/sintel/captions.vtt \
  --ref samples/sintel/reference/sintel_fr.srt --ref-offset -105
```

For any other clip, run `transcribe.py MEDIA --out-dir DIR` (see `--help`).

## Engine, model and settings

| | |
|---|---|
| Engine | faster-whisper 1.2.1 on CTranslate2 4.9.0 (pins in `requirements.txt`) |
| Model | `small.en` (Systran/faster-whisper-small.en on Hugging Face) |
| Device | CPU, `compute_type=float32`, 4 threads |
| Decoding | `beam_size=5`, `temperature=0.0`, `word_timestamps=True`, `condition_on_previous_text=False`, no VAD filter |
| Box used | Debian, Python 3.13.5, 8 vCPU; about 3 s for the 52 s clip once the model is cached |

These settings were chosen by testing on this clip:

- **float32, not int8.** On int8 the CPU kernels gave a different transcript
  on every run, and sometimes a "for for for" loop. float32 is bit-for-bit
  repeatable: five runs gave identical files.
- **No VAD filter for decoding.** With Silero VAD on, the quiet line "A
  dangerous quest for a lone hunter" came out as "Interest quest for...".
  `medium.en` gave the same text as `small.en`, so the smaller model ships.
- **Timing fix-ups** (turn off with `--no-snap`). Whisper stamps the first
  word after a pause up to a second early. Every such word in this clip was
  0.76 s long. So the script runs Silero VAD over the audio. A cue that starts
  in silence moves later to the voice onset if the onset falls inside its
  first word. Otherwise its stretched first word keeps only its last 0.4 s.
  Starts only ever move later, never past the first word. Ends get 0.3 s of
  tail, a 1 s minimum, and never overlap the next cue.
- **Line layout.** Captions use at most 2 lines of 42 characters and 6 s, and
  break on sentence ends and pauses over 0.7 s. Two-line cues are balanced so a
  word is never left alone on a line.

## Outputs (samples/sintel)

| File | What it is |
|---|---|
| `sintel-excerpt.mp4` | 52 s excerpt (film 01:45-02:37), 480p H.264 + AAC 96 kb/s, about 3 MB |
| `cues.json` | the cue list (after corrections), the source for the next three |
| `captions.vtt` | WebVTT captions, 12 cues: machine-generated, then 4 cues corrected by hand |
| `transcript.txt` | plain transcript, one cue per line (the player's `.txt` download, `toTxt`) |
| `transcript.vtt` | the same cues as WebVTT with no NOTE block (the player's `.vtt` download, `toVtt`) |
| `corrections.json` | the hand corrections: cue number, machine text, corrected text, and why |
| `ad.vtt` | WebVTT **audio description**, hand-written for this clip (see below) |
| `reference/sintel_fr.srt` | Blender's official hand-timed French subtitles, used to check the timing |

### Audio description

`ad.vtt` is a text-described AD track (`kind="descriptions"`): six short
descriptions placed in the gaps between lines of dialogue, so a screen reader
or the player's speech synthesis can voice them without talking over the
characters. It is written by hand from the frames, not generated, and is
validated like the captions.

### Hand corrections

Whisper's words were right, but four cues lost meaning in punctuation, so
they were corrected by hand in `corrections.json`. Each entry gives the cue
number, the exact machine text, the corrected text and the evidence:

- cue 3: a comma before "so completely unprepared"
- cue 6: "So..." because Silero VAD hears speech at 22.46-23.07 s, then about
  1.2 s of silence before "what". Blender's French track gives "Alors..." its own subtitle.
- cues 8 and 9: question marks, because Blender's French subtitle 9 has both
  as questions ("Quelqu'un de très cher ? Une âme sœur ?"), and "A dragon." answers them.

Each correction's evidence is Blender's hand-made French subtitles and the
measured speech spans. Corrections change text only, never timings. If a
future model or settings change alters a corrected cue's machine text,
`transcribe.py` stops with an error instead of misapplying the fix.
Re-check the entry against the audio, then update it.

### Validation

- `validate_vtt.py`: a stdlib checker for WebVTT file syntax. It checks the
  signature, header, timing lines, end after start, cue order, no overlaps
  within a track (a cue may not start before the previous one ends),
  "-->" in text, and empty cues.
- `validate-vtt-w3c.mjs`: runs W3C's reference parser
  ([webvtt.js](https://github.com/w3c/webvtt.js), the parser behind the W3C
  online validator) in strict mode. CI runs both on every `.vtt` here and in
  `stories/media/sintel/`.

### Timing spot-check

Sintel's dialogue is English, and Blender publishes no English subtitles.
Their translations are hand-timed to the English audio, though, so
`spotcheck.py` compares each cue start with the official French `.srt`. The
film-to-excerpt offset is -105 s. It also shows where Silero VAD hears speech.
On the committed captions, all 12 cues start between 0.68 s early and 0.38 s
late against the hand timing, inside the allowed window of 0.75 s early to
0.5 s late. A caption showing slightly early is fine; showing late is not.
Ten of the 12 are within 0.4 s.

## Media credit

The sample clip is an excerpt of **Sintel**, (c) copyright Blender
Foundation | [durian.blender.org](https://durian.blender.org/), licensed
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). It was cut from
`Sintel.2010.1080p.mkv` on
[download.blender.org](https://download.blender.org/durian/movies/) and
re-encoded at 480p. The reference subtitles are Blender's official
`sintel_fr.srt` from the same site. Changes: trimmed, scaled and re-encoded.
The captions, transcript and audio description are ours.

The official attribution for an excerpt, from durian.blender.org/sharing, is
"© copyright Blender Foundation | durian.blender.org".

To rebuild the clip:

```bash
ffmpeg -ss 00:01:45 -i https://download.blender.org/durian/movies/Sintel.2010.1080p.mkv -t 52 \
  -map 0:v:0 -map 0:a:0 -vf scale=-2:480 -c:v libx264 -preset slow -crf 28 \
  -c:a aac -b:a 96k -ac 2 -movflags +faststart samples/sintel/sintel-excerpt.mp4
```

Fallback (not needed, since Sintel shipped): a 20-40 s clip with our own TTS
narration, run through the same `transcribe.py`.

## For the player card (Chief Architect rulings, 2026-11-10)

- `captions.vtt` and `ad.vtt` are the single source. The player and the
  transcript panel both read them. `cues.json` is a derived convenience
  output and the player must not read it.
- The transcript panel interleaves the `ad.vtt` cues as bracketed, labelled
  description lines, so it is a descriptive transcript.
- `ad.vtt` is a `kind="descriptions"` track. Browsers don't voice it, so the
  player shows the active description cue in a visible `aria-live="polite"`
  region, behind a Descriptions on/off toggle that is off by default and
  remembered. Voicing it with `speechSynthesis` is an optional extra.
  Extended (pausing) descriptions aren't needed: the descriptions fit the
  dialogue gaps.
- `reference/sintel_fr.srt` may be offered as a reference track only:
  `srclang="fr"`, label "Français (Blender)", never the default, credited
  CC BY 3.0. The English `captions.vtt` stays the default captions track.

## Copies for Storybook

`captions.vtt`, `ad.vtt`, `transcript.txt` and `transcript.vtt` are also copied to `stories/media/sintel/` (served at `/media/sintel/`). After any regen, copy them again; a unit test fails if the copies drift. See `stories/media/sintel/README.md`.
