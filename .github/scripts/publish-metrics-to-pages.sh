#!/usr/bin/env bash
set -euo pipefail

METRICS_SRC="Docs/metrics"
PAGES_METRICS_DIR="publish/wwwroot/metrics"

mkdir -p "$PAGES_METRICS_DIR"

if [ -d "$METRICS_SRC" ] && [ -f "$METRICS_SRC/latest.json" ]; then
  cp -f "$METRICS_SRC/latest.json" "$PAGES_METRICS_DIR/latest.json"
  cp -f "$METRICS_SRC/history.csv" "$PAGES_METRICS_DIR/history.csv" || true
  cp -f "$METRICS_SRC/latest-report.txt" "$PAGES_METRICS_DIR/latest-report.txt" || true
  echo "Published metrics to $PAGES_METRICS_DIR"
else
  echo "Metrics source not found or incomplete at $METRICS_SRC; publishing placeholder."
  cat > "$PAGES_METRICS_DIR/README.txt" <<'EOF'
Metrics are not available for this deployment yet.
Run the Code Metrics workflow to generate Docs/metrics artifacts.
EOF
fi
