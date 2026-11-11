// Validate WebVTT files with W3C's reference parser (webvtt.js, the parser
// behind https://w3c.github.io/webvtt.js/parser.html) in strict mode.
// Install: npm install --no-save --prefix tools/transcribe/.w3c webvtt-parser@2.2.0
// Usage:   node tools/transcribe/validate-vtt-w3c.mjs FILE.vtt [...]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(fileURLToPath(new URL("./.w3c/", import.meta.url)));
const { WebVTTParser } = require("webvtt-parser");

let bad = 0;
for (const file of process.argv.slice(2)) {
  const tree = new WebVTTParser().parse(readFileSync(file, "utf8"), "metadata");
  const errors = tree.errors;
  if (errors.length || tree.cues.length === 0) {
    bad++;
    console.log(`FAIL ${file}`);
    for (const e of errors) console.log(`  line ${e.line}: ${e.message}`);
    if (tree.cues.length === 0) console.log("  no cues");
  } else {
    console.log(`OK   ${file} (${tree.cues.length} cues)`);
  }
}
process.exit(bad ? 1 : 0);
