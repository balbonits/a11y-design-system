import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[3]
SRC = ROOT / "tools/transcribe/samples/sintel"
DST = ROOT / "stories/media/sintel"


class MediaCopies(unittest.TestCase):
    def test_storybook_copies_match_the_record(self):
        for name in ("captions.vtt", "ad.vtt", "transcript.txt", "transcript.vtt"):
            with self.subTest(name=name):
                self.assertEqual((SRC / name).read_bytes(), (DST / name).read_bytes())

    def test_clip_is_the_record_and_under_10_mb(self):
        """The player's clip is a byte copy of the record, the only video, and <= 10 MB (ARCH-REVIEW R-4)."""
        self.assertEqual([p.name for p in DST.glob("*.mp4")], ["sintel-excerpt.mp4"])
        self.assertEqual((DST / "sintel-excerpt.mp4").read_bytes(), (SRC / "sintel-excerpt.mp4").read_bytes())
        self.assertLessEqual((DST / "sintel-excerpt.mp4").stat().st_size, 10 * 1000 * 1000)

    def test_credit_ships_with_the_media(self):
        text = (DST / "ATTRIBUTION.md").read_text(encoding="utf-8")
        for needle in ("Blender Foundation", "durian.blender.org", "creativecommons.org/licenses/by/3.0"):
            self.assertIn(needle, text)
        self.assertTrue((DST / "README.md").is_file())


if __name__ == "__main__":
    unittest.main()
