# GitHub Script Entrypoints

These scripts are used by GitHub Actions and are also safe to run locally.

## Metrics scripts

- generate-metrics.ps1
  - Generates Docs/metrics/latest-report.txt, latest.json, and history.csv.
  - Defaults are local-friendly when CI metadata is not provided.

- commit-metrics.ps1
  - Commits Docs/metrics snapshot files.
  - Use -NoPush to avoid pushing in local runs.

## Pages scripts

- prepare-github-pages.sh
  - Existing gh-pages output preparation for Blazor publish.

- publish-metrics-to-pages.sh
  - Copies Docs/metrics files into publish/wwwroot/metrics so gh-pages serves them.

## Local usage examples

From repository root:

powershell -ExecutionPolicy Bypass -File .github/scripts/generate-metrics.ps1
powershell -ExecutionPolicy Bypass -File .github/scripts/commit-metrics.ps1 -NoPush
