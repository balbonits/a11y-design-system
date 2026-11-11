// CTE #33 (A) scoped option 3, item 4: the `ember-ui/video` package entry resolves from build:lib output.
// The import below goes through the package's own name and package.json "exports" (no alias), the way a
// consumer's import does, and lands on dist/video.js. dist/ comes from build:lib, which `npm ci` runs through
// the prepare script before `npm test`. Plant: with dist/video.js moved away, both tests fail.
import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';

describe('ember-ui/video package entry (build:lib output)', () => {
  it('maps ./video to the build:lib output files', () => {
    expect(pkg.exports['./video']).toEqual({ types: './dist/types/video/index.d.ts', import: './dist/video.js' });
  });

  it('imports by package name and exposes the core the player UI consumes', async () => {
    const m: Record<string, unknown> = await import('ember-ui/video');
    for (const name of ['createPlayer', 'createNativePlayer', 'detectKind', 'VideoAdapterUnavailable', 'parseVtt', 'toVtt', 'toTxt', 'readVideoPrefs', 'writeVideoPrefs', 'loadTracks', 'createDescriptions']) {
      expect(typeof m[name], name).toBe('function');
    }
  });
});
