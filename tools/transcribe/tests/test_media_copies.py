import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[3]
SRC = ROOT / "tools/transcribe/samples/sintel"
DST = ROOT / "stories/media/sintel"


class MediaCopies(unittest.TestCase):
    def test_storybook_copies_match_the_record(self):
        for name in ("captions.vtt", "ad.vtt", "transcript.txt"):
            with self.subTest(name=name):
                self.assertEqual((SRC / name).read_bytes(), (DST / name).read_bytes())

    def test_no_video_in_storybook_folder(self):
        self.assertEqual([p.name for p in DST.glob("*.mp4")], [])


if __name__ == "__main__":
    unittest.main()
