#!/usr/bin/env bash
# Reproduce the handoff shots in a scratch copy (never edits this repo's .storybook/).
# Usage: bash docs/storybook-brand/mock/build.sh <path-to-an-installed-node_modules> [base-ref]
#   base-ref defaults to origin/fix/sb-manager-aa (#45, which this HANDOFF extends); use origin/main once #45 has merged.
set -euo pipefail
repo=$(git rev-parse --show-toplevel); base=${2:-origin/fix/sb-manager-aa}; s=$(mktemp -d)
git -C "$repo" archive "$base" | tar -x -C "$s"
cp -al "$1" "$s/node_modules"
cp "$repo/docs/storybook-brand/mock/manager.ts" "$repo/docs/storybook-brand/mock/manager-head.html" "$s/.storybook/"
(cd "$s" && npx storybook build -o out --quiet)
echo "built ($base + mock/): $s/out   serve: python3 -m http.server 8961 --bind 127.0.0.1 -d $s/out"
