param(
    [switch]$NoPush
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")

Push-Location $repoRoot
try {
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"

    git add Docs/metrics/latest-report.txt Docs/metrics/latest.json Docs/metrics/history.csv

    if (git diff --cached --quiet) {
        Write-Host "No metrics changes to commit"
        exit 0
    }

    git commit -m "chore(metrics): update code metrics snapshot [skip ci]"

    if ($NoPush) {
        Write-Host "Metrics committed locally (push skipped due to -NoPush)."
    }
    else {
        git push
        Write-Host "Metrics committed to branch"
    }
}
finally {
    Pop-Location
}
