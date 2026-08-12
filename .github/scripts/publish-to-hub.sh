#!/bin/bash
# Publishes the prepared WASM output into the chandamu.github.io hub repo as /v2/,
# and refreshes the hub's root 404.html from the v2 shell.
#
# The hub is a GitHub Pages *user* site, so only the repo-root 404.html is ever
# served. Making it a copy of the v2 shell is what lets /v2/ deep links resolve.
#
# Usage: publish-to-hub.sh SRC_DIR HUB_DIR
set -euo pipefail

SRC_DIR="${1:?Usage: publish-to-hub.sh SRC_DIR HUB_DIR}"
HUB_DIR="${2:?Usage: publish-to-hub.sh SRC_DIR HUB_DIR}"

[ -f "$SRC_DIR/index.html" ] || { echo "✗ $SRC_DIR/index.html not found"; exit 1; }
[ -d "$HUB_DIR/v1" ] || { echo "✗ no v1/ in $HUB_DIR - wrong repo, or a branch predating the v1/v2 restructure"; exit 1; }

grep -q '<base href="/v2/" />' "$SRC_DIR/index.html" || {
  echo "✗ $SRC_DIR/index.html is not based at /v2/ - run prepare-github-pages.sh first"
  exit 1
}

# Replace rather than merge, so assets dropped upstream do not linger.
rm -rf "$HUB_DIR/v2"
mkdir -p "$HUB_DIR/v2"
cp -a "$SRC_DIR/." "$HUB_DIR/v2/"
echo "✓ Wrote $HUB_DIR/v2"

cp "$HUB_DIR/v2/index.html" "$HUB_DIR/404.html"
echo "✓ Refreshed $HUB_DIR/404.html from the v2 shell"

touch "$HUB_DIR/.nojekyll"
echo "✓ Ensured .nojekyll"
