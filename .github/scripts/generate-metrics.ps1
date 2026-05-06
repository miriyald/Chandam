param(
    [string]$EventName = "workflow_dispatch",
    [string]$Sha = "",
    [string]$RefName = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")

Push-Location $repoRoot
try {
    if ([string]::IsNullOrWhiteSpace($Sha)) {
        try {
            $Sha = (git rev-parse HEAD).Trim()
        }
        catch {
            $Sha = "local"
        }
    }

    if ([string]::IsNullOrWhiteSpace($RefName)) {
        try {
            $RefName = (git rev-parse --abbrev-ref HEAD).Trim()
        }
        catch {
            $RefName = "local"
        }
    }

    $metricsDir = "Docs/metrics"
    $reportPath = Join-Path $metricsDir "latest-report.txt"
    $jsonPath = Join-Path $metricsDir "latest.json"
    $historyPath = Join-Path $metricsDir "history.csv"

    if (-not (Test-Path $metricsDir)) {
        New-Item -ItemType Directory -Path $metricsDir | Out-Null
    }

    $mode = if ($EventName -eq "push") { "basic" } else { "deep" }

    if ($mode -eq "deep") {
        .\Docs\Scripts\metrics.ps1 -Deep | Out-File -FilePath $reportPath -Encoding utf8
    }
    else {
        .\Docs\Scripts\metrics.ps1 | Out-File -FilePath $reportPath -Encoding utf8
    }

    $report = Get-Content $reportPath -Raw

    function Get-Metric {
        param([string]$Pattern)
        $m = [regex]::Match($report, $Pattern)
        if ($m.Success) { return [int64]$m.Groups[1].Value }
        return $null
    }

    $totalFiles = Get-Metric 'Total C# files\s*:\s*([0-9]+)'
    $totalLines = Get-Metric 'Total lines\s*:\s*([0-9]+)'
    $codeLines = Get-Metric 'Code lines\s*:\s*([0-9]+)'
    $commentLines = Get-Metric 'Comment lines\s*:\s*([0-9]+)'
    $blankLines = Get-Metric 'Blank lines\s*:\s*([0-9]+)'

    if ($null -in @($totalFiles, $totalLines, $codeLines, $commentLines, $blankLines)) {
        throw "Failed to parse one or more totals from Docs/metrics/latest-report.txt"
    }

$snapshot = [ordered]@{
        generatedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
        commit = $Sha
        branch = $RefName
        mode = $mode
        totals = [ordered]@{
            totalCSharpFiles = $totalFiles
            totalLines = $totalLines
            codeLines = $codeLines
            commentLines = $commentLines
            blankLines = $blankLines
        }
    }

    $snapshot | ConvertTo-Json -Depth 5 | Out-File -FilePath $jsonPath -Encoding utf8

    if (-not (Test-Path $historyPath)) {
        "generatedAtUtc,commit,branch,mode,totalCSharpFiles,totalLines,codeLines,commentLines,blankLines" | Out-File -FilePath $historyPath -Encoding utf8
    }

    "$($snapshot.generatedAtUtc),$($snapshot.commit),$($snapshot.branch),$($snapshot.mode),$totalFiles,$totalLines,$codeLines,$commentLines,$blankLines" | Add-Content -Path $historyPath

    Write-Host "Metrics generated in mode: $mode"
    Write-Host "Report: $reportPath"
    Write-Host "Snapshot: $jsonPath"
    Write-Host "History: $historyPath"
}
finally {
    Pop-Location
}
