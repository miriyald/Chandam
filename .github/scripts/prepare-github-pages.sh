#!/bin/bash
# Post-publish script to prepare WASM output for GitHub Pages deployment
# Updates base href from "/" to "/chandam/" without affecting source files
# This script runs automatically during GitHub Actions deployment

PUBLISH_DIR="${1:-publish/wwwroot}"

if [ ! -d "$PUBLISH_DIR" ]; then
  echo "Error: Publish directory not found: $PUBLISH_DIR"
  exit 1
fi

echo "Preparing GitHub Pages deployment from: $PUBLISH_DIR"

# Update base href in index.html
if [ -f "$PUBLISH_DIR/index.html" ]; then
  sed -i 's|<base href="/" />|<base href="/chandam/" />|g' "$PUBLISH_DIR/index.html"
  echo "✓ Updated base href in index.html"
else
  echo "✗ index.html not found"
  exit 1
fi

# Update base href in 404.html
if [ -f "$PUBLISH_DIR/404.html" ]; then
  sed -i 's|<base href="/" />|<base href="/chandam/" />|g' "$PUBLISH_DIR/404.html"
  echo "✓ Updated base href in 404.html"
fi

# Fix navigation links to be relative (remove leading slash)
if [ -f "$PUBLISH_DIR/index.html" ]; then
  sed -i 's|href="/"|href=""|g' "$PUBLISH_DIR/index.html"
  sed -i 's|href="/about"|href="about"|g' "$PUBLISH_DIR/index.html"
  sed -i 's|href="/credits"|href="credits"|g' "$PUBLISH_DIR/index.html"
  sed -i 's|href="/contact"|href="contact"|g' "$PUBLISH_DIR/index.html"
  echo "✓ Fixed navigation links to be relative"
fi

# Ensure .nojekyll exists
touch "$PUBLISH_DIR/.nojekyll"
echo "✓ Created .nojekyll"

echo "✓ GitHub Pages preparation complete!"
echo "Note: Version is injected by MSBuild during 'dotnet publish'"
