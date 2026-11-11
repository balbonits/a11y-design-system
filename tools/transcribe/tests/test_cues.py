"""Stdlib tests for the cue model, renderers and validator (no model needed)."""
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

import json  # noqa: E402

from cues import (Cue, apply_corrections, fmt_ts, from_json, pad, parse_ts, parse_vtt,  # noqa: E402
                  render_download_txt, render_download_vtt, render_txt, render_vtt, snap_starts, split_words, to_json, trim_lead_words, wrap)
from validate_vtt import validate  # noqa: E402

SAMPLE = HERE / "samples" / "sintel"


class Timestamps(unittest.TestCase):
    def test_round_trip(self):
        for t in (0, 1.5, 59.999, 61.25, 3725.042):
            self.assertAlmostEqual(parse_ts(fmt_ts(t)), t, places=3)

    def test_format(self):
        self.assertEqual(fmt_ts(3725.042), "01:02:05.042")
        self.assertEqual(parse_ts("02:05.042"), 125.042)
        with self.assertRaises(ValueError):
            parse_ts("1:2:3")


class Wrap(unittest.TestCase):
    def test_short_is_one_line(self):
        self.assertEqual(wrap("Thank you."), ["Thank you."])

    def test_balanced_two_lines(self):
        lines = wrap("So, what brings you to the land of the gatekeepers?")
        self.assertEqual(len(lines), 2)
        self.assertTrue(all(len(l) <= 42 for l in lines))
        self.assertLess(abs(len(lines[0]) - len(lines[1])), 12)


class OneCueModel(unittest.TestCase):
    cues = [Cue(1.0, 2.5, "Hello there."), Cue(2.6, 4.0, "Fish & <chips>."),
            Cue(9.0, 10.0, "Later.")]

    def test_vtt_and_txt_share_text(self):
        vtt = render_vtt(self.cues, header_note="test")
        self.assertEqual(validate(vtt), [])
        back = parse_vtt(vtt)
        self.assertEqual([c.text for c in back], [c.text for c in self.cues])
        self.assertEqual([(c.start, c.end) for c in back], [(c.start, c.end) for c in self.cues])
        txt = render_txt(self.cues)
        self.assertEqual(txt, "Hello there. Fish & <chips>.\n\nLater.\n")
        self.assertIn("&amp; &lt;chips&gt;", vtt)

    def test_download_formats(self):
        """Mirror ember-ui/video toTxt/toVtt: one cue per line; no NOTE, ids 1..n."""
        self.assertEqual(render_download_txt(self.cues), "Hello there.\nFish & <chips>.\nLater.\n")
        vtt = render_download_vtt(self.cues)
        self.assertTrue(vtt.startswith("WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.500\nHello there.\n\n2\n"))
        self.assertTrue(vtt.endswith("Later.\n"))
        self.assertNotIn("NOTE", vtt)
        self.assertEqual(validate(vtt), [])
        self.assertEqual(parse_vtt(vtt), self.cues)

    def test_json_round_trip(self):
        self.assertEqual(from_json(to_json(self.cues)), self.cues)


class Timing(unittest.TestCase):
    def test_split_on_sentence_and_pause(self):
        words = [(0.0, 0.3, " Hi"), (0.3, 0.6, " there."), (0.7, 1.0, " Next"),
                 (2.5, 2.8, " after"), (2.8, 3.0, " pause")]
        self.assertEqual([c.text for c in split_words(words)], ["Hi there.", "Next", "after pause"])

    def test_pad_never_overlaps(self):
        out = pad([Cue(0.0, 0.2, "a"), Cue(0.5, 0.6, "b")])
        self.assertLessEqual(out[0].end, out[1].start)
        self.assertGreaterEqual(out[1].end - out[1].start, 1.0)

    def test_trim_lead_word_outside_speech_only(self):
        words = [(10.0, 10.76, " I'm"), (20.0, 20.76, " So,")]
        out = trim_lead_words(words, spans=[(19.9, 21.0)])
        self.assertAlmostEqual(out[0][0], 10.36)   # in silence: trimmed
        self.assertEqual(out[1][0], 20.0)          # already in speech: kept

    def test_snap_moves_later_within_first_word(self):
        cues = [Cue(1.0, 3.0, "a b"), Cue(5.0, 6.0, "c")]
        out = snap_starts(cues, spans=[(1.4, 3.0), (5.9, 6.5)], first_word_end=[1.6, 5.5])
        self.assertEqual(out[0].start, 1.4)   # onset before first word ends
        self.assertEqual(out[1].start, 5.0)   # onset after first word: unchanged


class Corrections(unittest.TestCase):
    cues = [Cue(1.0, 2.0, "A kindred spirit."), Cue(3.0, 4.0, "A dragon.")]

    def test_replaces_text_only(self):
        out = apply_corrections(self.cues, [{"cue": 1, "from": "A kindred spirit.",
                                             "to": "A kindred spirit?", "why": "question"}])
        self.assertEqual(out, [Cue(1.0, 2.0, "A kindred spirit?"), self.cues[1]])

    def test_rejects_stale_missing_duplicate_or_unexplained(self):
        bad = [
            [{"cue": 1, "from": "something else", "to": "x", "why": "w"}],
            [{"cue": 3, "from": "x", "to": "y", "why": "w"}],
            [{"cue": 2, "from": "A dragon.", "to": "x", "why": "w"},
             {"cue": 2, "from": "A dragon.", "to": "y", "why": "w"}],
            [{"cue": 2, "from": "A dragon.", "to": "x", "why": " "}],
        ]
        for fixes in bad:
            with self.subTest(fixes=fixes), self.assertRaises(ValueError):
                apply_corrections(self.cues, fixes)


class Validator(unittest.TestCase):
    def test_rejects(self):
        self.assertTrue(validate("WEBVT\n\n00:00.000 --> 00:01.000\nx\n"))
        self.assertTrue(validate("WEBVTT\n\n00:01.000 --> 00:00.500\nx\n"))
        self.assertTrue(validate("WEBVTT\n\n00:00.000 -> 00:01.000\nx\n"))
        self.assertTrue(validate("WEBVTT\n\n00:02.000 --> 00:03.000\nx\n\n00:01.000 --> 00:04.000\ny\n"))

    def test_rejects_overlap_within_a_track(self):
        errs = validate("WEBVTT\n\n00:01.000 --> 00:03.000\nx\n\n00:02.500 --> 00:04.000\ny\n")
        self.assertTrue(any("overlaps" in e for e in errs), errs)
        # a cue nested inside a long earlier cue also overlaps
        errs = validate("WEBVTT\n\n00:01.000 --> 00:09.000\nx\n\n00:02.000 --> 00:03.000\ny\n"
                        "\n00:04.000 --> 00:05.000\nz\n")
        self.assertEqual(sum("overlaps" in e for e in errs), 2, errs)
        self.assertEqual(validate("WEBVTT\n\n00:01.000 --> 00:02.000\nx\n\n00:02.000 --> 00:03.000\ny\n"), [])

    def test_committed_tracks_are_valid(self):
        for name in ("captions.vtt", "ad.vtt", "transcript.vtt"):
            self.assertEqual(validate((SAMPLE / name).read_text(encoding="utf-8")), [], name)

    def test_committed_outputs_agree(self):
        """captions.vtt, transcript.txt, transcript.vtt and cues.json come from one cue list."""
        cues = from_json((SAMPLE / "cues.json").read_text(encoding="utf-8"))
        vtt = (SAMPLE / "captions.vtt").read_text(encoding="utf-8")
        self.assertEqual(parse_vtt(vtt), cues)
        self.assertEqual((SAMPLE / "transcript.txt").read_text(encoding="utf-8"), render_download_txt(cues))
        self.assertEqual((SAMPLE / "transcript.vtt").read_text(encoding="utf-8"), render_download_vtt(cues))

    def test_committed_corrections_are_applied(self):
        fixes = json.loads((SAMPLE / "corrections.json").read_text(encoding="utf-8"))
        cues = from_json((SAMPLE / "cues.json").read_text(encoding="utf-8"))
        for fix in fixes:
            self.assertEqual(cues[fix["cue"] - 1].text, fix["to"])
            self.assertTrue(fix["why"].strip())


class AudioDescription(unittest.TestCase):
    def test_ad_sits_in_dialogue_gaps(self):
        caps = parse_vtt((SAMPLE / "captions.vtt").read_text(encoding="utf-8"))
        ad = parse_vtt((SAMPLE / "ad.vtt").read_text(encoding="utf-8"))
        self.assertTrue(ad)
        for d in ad:
            for c in caps:
                self.assertFalse(d.start < c.end and c.start < d.end,
                                 f"AD {d.text!r} overlaps caption {c.text!r}")


if __name__ == "__main__":
    unittest.main()
