#!/bin/bash
# Post-publish script to prepare WASM output for a GitHub Pages sub-path.
# Sets <base href> in index.html and 404.html; everything else in the shell is
# base-relative and resolves against it. Source files are not touched.
#
# Usage: prepare-github-pages.sh [PUBLISH_DIR] [BASE_PATH]
set -euo pipefail

PUBLISH_DIR="${1:-publish/wwwroot}"
BASE_PATH="${2:-/chandam/}"

if [ ! -d "$PUBLISH_DIR" ]; then
  echo "Error: Publish directory not found: $PUBLISH_DIR"
  exit 1
fi

case "$BASE_PATH" in
  /*/) ;;
  *) echo "Error: BASE_PATH must start and end with '/': $BASE_PATH"; exit 1 ;;
esac

echo "Preparing GitHub Pages deployment from: $PUBLISH_DIR (base: $BASE_PATH)"

if [ ! -f "$PUBLISH_DIR/index.html" ]; then
  echo "✗ index.html not found"
  exit 1
fi

for page in index.html 404.html; do
  [ -f "$PUBLISH_DIR/$page" ] || continue
  sed -i "s|<base href=\"/\" />|<base href=\"$BASE_PATH\" />|g" "$PUBLISH_DIR/$page"
  grep -q "<base href=\"$BASE_PATH\" />" "$PUBLISH_DIR/$page" || {
    echo "✗ base href not set in $page"
    exit 1
  }
  echo "✓ Set base href in $page"
done

# Any root-absolute link would escape the base path and 404.
if grep -rn 'href="/[^"]' "$PUBLISH_DIR"/*.html | grep -v '<base href='; then
  echo "✗ Root-absolute links found above - they must be base-relative"
  exit 1
fi

touch "$PUBLISH_DIR/.nojekyll"
echo "✓ Created .nojekyll"

echo "✓ GitHub Pages preparation complete!"
echo "Note: Version is injected by MSBuild during 'dotnet publish'"
