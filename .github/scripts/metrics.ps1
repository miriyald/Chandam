#Requires -Version 5.1
<#
.SYNOPSIS
    Chandam code metrics report - LOC, file counts, and static complexity analysis.

.DESCRIPTION
    Generates a static analysis report for the Chandam solution:
      - Lines of code (source, blank, comment) per project
      - File distribution by type
      - Project dependency depth
      - Deep metrics: cyclomatic complexity approximation, depth of inheritance,
        long method detection (no Visual Studio or external tools required)

.PARAMETER Deep
    Run complexity analysis (CC, DoI, long methods). No extra tools needed.

.PARAMETER Project
    Restrict analysis to a single project folder name (e.g. Chandam.API).

.PARAMETER OutputDir
    Directory for CSV output. Defaults to Docs/Scripts/output/metrics.

.EXAMPLE
    .\metrics.ps1
    .\metrics.ps1 -Deep
    .\metrics.ps1 -Deep -Project Chandam.API
#>
param(
    [switch]$Deep,
    [string]$Project = "",
    [string]$OutputDir = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# -- Paths --------------------------------------------------------------------
$ScriptDir = $PSScriptRoot
$Root      = (Resolve-Path "$ScriptDir\..\..").Path
$OutputDir = if ($OutputDir) { $OutputDir } else { Join-Path $ScriptDir "output\metrics" }
$ExcludedPathPattern = "\\(obj|bin|\.git|node_modules|dist|coverage|publish|Obsolete|Rules)\\"

if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }

# -- Projects to analyse ------------------------------------------------------
$AllProjects = @(
    [pscustomobject]@{ Name = "Chandam.Util";                Layer = "Core";  ReadOnly = $true  }
    [pscustomobject]@{ Name = "Chandam.Indic";               Layer = "Core";  ReadOnly = $true  }
    [pscustomobject]@{ Name = "Chandam.Samples";             Layer = "Core";  ReadOnly = $true  }
    [pscustomobject]@{ Name = "Chandam.Core";                Layer = "Core";  ReadOnly = $true  }
    [pscustomobject]@{ Name = "Chandam.Dictionary";          Layer = "Core";  ReadOnly = $false }
    [pscustomobject]@{ Name = "Chandam.API";                 Layer = "API";   ReadOnly = $false }
    [pscustomobject]@{ Name = "Chandam.API.WebApi";          Layer = "API";   ReadOnly = $false }
    [pscustomobject]@{ Name = "Chandam.API.Demo";            Layer = "API";   ReadOnly = $false }
    [pscustomobject]@{ Name = "Chandam.API.IntegrationTests";Layer = "API";   ReadOnly = $false }
    [pscustomobject]@{ Name = "Chandam.MCP.Tools";           Layer = "MCP";   ReadOnly = $false }
    [pscustomobject]@{ Name = "Chandam.MCP.Stdio";           Layer = "MCP";   ReadOnly = $false }
    [pscustomobject]@{ Name = "Chandam.MCP.Http";            Layer = "MCP";   ReadOnly = $false }
    [pscustomobject]@{ Name = "Chandam.MCP.Tests";           Layer = "MCP";   ReadOnly = $false }
    [pscustomobject]@{ Name = "Chandam.Wasm";                Layer = "Web";   ReadOnly = $false }
    [pscustomobject]@{ Name = "Chandam.Tasks";               Layer = "Tasks"; ReadOnly = $false }
)

if ($Project) {
    $AllProjects = $AllProjects | Where-Object { $_.Name -eq $Project }
    if (-not $AllProjects) { Write-Error "Project '$Project' not found."; exit 1 }
}

# -- LOC helper ---------------------------------------------------------------
function Get-LOC {
    param([string]$Dir)
    $result = [pscustomobject]@{ Files=0; Total=0; Code=0; Blank=0; Comment=0 }
    $csFiles = Get-ChildItem -Path $Dir -Recurse -Filter "*.cs" -ErrorAction SilentlyContinue |
               Where-Object { $_.FullName -notmatch $ExcludedPathPattern }
    $result.Files = ($csFiles | Measure-Object).Count
    $inBlock = $false
    foreach ($file in $csFiles) {
        $lines = Get-Content $file.FullName -Encoding UTF8 -ErrorAction SilentlyContinue
        foreach ($line in $lines) {
            $result.Total++
            $trimmed = $line.Trim()
            if ($inBlock) {
                $result.Comment++
                if ($trimmed -match "\*/") { $inBlock = $false }
                continue
            }
            if ($trimmed -eq "")                                              { $result.Blank++ }
            elseif ($trimmed.StartsWith("//") -or $trimmed.StartsWith("///")){ $result.Comment++ }
            elseif ($trimmed.StartsWith("/*")) {
                $result.Comment++
                if ($trimmed -notmatch "\*/") { $inBlock = $true }
            } else { $result.Code++ }
        }
    }
    return $result
}

# -- Complexity helper --------------------------------------------------------
function Get-ComplexityMetrics {
    param([string]$Dir)

    # Decision-point keywords — each adds +1 toward cyclomatic complexity
    $ccPattern = '\b(if|else\s+if|for|foreach|while|do|case|catch)\b|\|\||\&\&'

    # Class / struct / record declaration line (any combination of modifiers)
    $classSig  = '\b(class|struct|record)\s+\w+'

    # Method signature heuristic: a line containing '(' and ')' that has an
    # access modifier, and is followed (within 2 lines) by a standalone '{'.
    # Counts methods regardless of brace placement style (K&R or Allman).
    $methodSig = '\b(public|private|protected|internal)\b.*\(.*\)'

    $csFiles = Get-ChildItem -Path $Dir -Recurse -Filter "*.cs" -ErrorAction SilentlyContinue |
               Where-Object { $_.FullName -notmatch $ExcludedPathPattern }

    $totalDec  = 0
    $codeLines = 0
    $methods   = 0
    $classes   = 0
    $maxDoI    = 0
    $longMeth  = 0

    foreach ($file in $csFiles) {
        $lines = Get-Content $file.FullName -Encoding UTF8 -ErrorAction SilentlyContinue
        if (-not $lines) { continue }

        $depth = 0; $inMeth = $false; $methStart = 0
        $prevWasMethodSig = $false; $prevMethodStart = 0

        for ($i = 0; $i -lt $lines.Count; $i++) {
            $raw = $lines[$i]
            $t   = $raw.Trim()

            # Skip blank and comment lines for code counting
            if ($t -eq "" -or $t.StartsWith("//") -or $t.StartsWith("*")) { continue }
            $codeLines++

            # Class / DoI
            if ($t -match $classSig) {
                $classes++
                if ($t -match ':\s*([^{]+)') {
                    $doi = ($Matches[1].Trim() -split ',').Count
                    if ($doi -gt $maxDoI) { $maxDoI = $doi }
                }
            }

            # Decision points
            $totalDec += [regex]::Matches($t, $ccPattern).Count

            # Method detection: look for method-sig pattern
            # Works for both K&R (brace on same line) and Allman (brace on next line)
            $opens  = @($t.ToCharArray() | Where-Object { $_ -eq '{' }).Count
            $closes = @($t.ToCharArray() | Where-Object { $_ -eq '}' }).Count

            if ($t -match $methodSig -and $t -notmatch '^\s*//' -and $t -notmatch '=>\s*$') {
                $prevWasMethodSig = $true
                $prevMethodStart  = $i
                if ($opens -gt 0) {
                    # K&R style - brace on same line as sig
                    $methods++
                    $inMeth     = $true
                    $methStart  = $i
                    $depth      = $opens - $closes
                    $prevWasMethodSig = $false
                }
            } elseif ($prevWasMethodSig -and $t -eq '{') {
                # Allman style - standalone opening brace after sig
                $methods++
                $inMeth     = $true
                $methStart  = $prevMethodStart
                $depth      = 1
                $prevWasMethodSig = $false
            } elseif ($inMeth) {
                $prevWasMethodSig = $false
                $depth += $opens - $closes
                if ($depth -le 0) {
                    if (($i - $methStart) -gt 30) { $longMeth++ }
                    $inMeth = $false
                }
            } else {
                $prevWasMethodSig = $false
            }
        }
    }

    # CC density: decision points per 100 code lines (comparable across project sizes)
    $ccDensity = if ($codeLines -gt 0) { [Math]::Round($totalDec / $codeLines * 100, 1) } else { 0 }
    return [pscustomobject]@{
        Classes    = $classes
        Methods    = $methods
        CCDensity  = $ccDensity
        TotalDec   = $totalDec
        MaxDoI     = $maxDoI
        LongMethods= $longMeth
    }
}

# -- Dependency depth helper --------------------------------------------------
$depthMap = @{}
function Get-Depth {
    param([string]$ProjName, [hashtable]$Map, [int]$Level = 0)
    if ($Level -gt 20) { return 0 }
    $csproj = Join-Path $Root "$ProjName\$ProjName.csproj"
    if (-not (Test-Path $csproj)) { return 0 }
    $refs = [regex]::Matches((Get-Content $csproj -Raw), 'ProjectReference Include="\.\.\\([^\\]+)\\')
    if ($refs.Count -eq 0) { return 0 }
    $max = 0
    foreach ($ref in $refs) {
        $child = $ref.Groups[1].Value
        if (-not $Map.ContainsKey($child)) { $Map[$child] = Get-Depth -ProjName $child -Map $Map -Level ($Level+1) }
        if ($Map[$child] -gt $max) { $max = $Map[$child] }
    }
    return $max + 1
}

# =============================================================================
# REPORT
# =============================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "           CHANDAM - CODE METRICS REPORT" -ForegroundColor Cyan
Write-Host "           $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# -- LOC Table ----------------------------------------------------------------
Write-Host ""
Write-Host "-- Lines of Code (CS, excluding obj/bin/Obsolete/Rules) --" -ForegroundColor Yellow
Write-Host ""
$hdrLoc = "{0,-34} {1,5} {2,7} {3,7} {4,7} {5,6}" -f "Project", "Files", "Total", "Code", "Blank", "Cmts"
Write-Host $hdrLoc -ForegroundColor Gray
Write-Host ("-" * 70) -ForegroundColor DarkGray

$totals = [pscustomobject]@{ Files=0; Total=0; Code=0; Blank=0; Comment=0 }
$curLayer = ""

foreach ($proj in $AllProjects) {
    $projDir = Join-Path $Root $proj.Name
    if (-not (Test-Path $projDir)) { continue }
    if ($proj.Layer -ne $curLayer) {
        Write-Host ""
        Write-Host "  [$($proj.Layer)]" -ForegroundColor DarkCyan
        $curLayer = $proj.Layer
    }
    $loc = Get-LOC -Dir $projDir
    $totals.Files   += $loc.Files
    $totals.Total   += $loc.Total
    $totals.Code    += $loc.Code
    $totals.Blank   += $loc.Blank
    $totals.Comment += $loc.Comment
    $ro  = if ($proj.ReadOnly) { "*" } else { "" }
    $row = "{0,-34} {1,5} {2,7} {3,7} {4,7} {5,6}" -f "$($proj.Name)$ro", $loc.Files, $loc.Total, $loc.Code, $loc.Blank, $loc.Comment
    Write-Host $row
}
Write-Host ""
Write-Host ("-" * 70) -ForegroundColor DarkGray
$totRow = "{0,-34} {1,5} {2,7} {3,7} {4,7} {5,6}" -f "TOTAL", $totals.Files, $totals.Total, $totals.Code, $totals.Blank, $totals.Comment
Write-Host $totRow -ForegroundColor White

# -- File Distribution --------------------------------------------------------
Write-Host ""
Write-Host "-- File distribution (all types, including WASM/Node/etc; excluding obj/bin/Obsolete/Rules) --" -ForegroundColor Yellow
Write-Host ""
$allExts = Get-ChildItem -Path $Root -Recurse -File -ErrorAction SilentlyContinue |
           Where-Object { $_.FullName -notmatch $ExcludedPathPattern } |
           Group-Object Extension | Sort-Object Count -Descending | Select-Object -First 15
foreach ($g in $allExts) {
    $bar = "#" * [Math]::Min([Math]::Ceiling($g.Count / 5), 40)
    Write-Host ("  {0,-8} {1,5}  {2}" -f $(if ($g.Name) {$g.Name} else {"(none)"}), $g.Count, $bar)
}

# -- Dependency Depth ---------------------------------------------------------
Write-Host ""
Write-Host "-- Project dependency depth (ProjectReference chain) --" -ForegroundColor Yellow
Write-Host ""
foreach ($proj in $AllProjects) {
    if (-not $depthMap.ContainsKey($proj.Name)) {
        $depthMap[$proj.Name] = Get-Depth -ProjName $proj.Name -Map $depthMap
    }
}
$depthMap.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Host ("  {0,-40} depth {1}" -f $_.Key, $_.Value)
}

# -- Deep Metrics (text-based, no VS required) --------------------------------
if ($Deep) {
    Write-Host ""
    Write-Host "-- Deep metrics: cyclomatic complexity, inheritance, long methods --" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  CC/100 = decision-point density per 100 code lines" -ForegroundColor DarkGray
    Write-Host "  DoI    = max depth-of-inheritance in class declarations" -ForegroundColor DarkGray
    Write-Host "  Long   = methods >30 lines  (candidates for refactoring)" -ForegroundColor DarkGray
    Write-Host "  Green < 5 | Yellow 5-10 | Red > 10 (CC density)" -ForegroundColor DarkGray
    Write-Host ""

    $hdrCC = "{0,-34} {1,7} {2,7} {3,6} {4,5} {5,6}" -f "Project", "Classes", "Methods", "CC/100", "DoI", "Long"
    Write-Host $hdrCC -ForegroundColor Gray
    Write-Host ("-" * 70) -ForegroundColor DarkGray

    $csvLines = @("Date,Project,Layer,Classes,Methods,CCDensity,TotalDecisions,MaxDoI,LongMethods")
    $dateStr  = Get-Date -Format 'yyyy-MM-dd'
    $curLayer2 = ""

    foreach ($proj in $AllProjects) {
        $projDir = Join-Path $Root $proj.Name
        if (-not (Test-Path $projDir)) { continue }
        if ($proj.Layer -ne $curLayer2) {
            Write-Host ""
            Write-Host "  [$($proj.Layer)]" -ForegroundColor DarkCyan
            $curLayer2 = $proj.Layer
        }
        $m   = Get-ComplexityMetrics -Dir $projDir
        $ro  = if ($proj.ReadOnly) { "*" } else { "" }
        $col = if ($m.CCDensity -le 5) { "Green" } elseif ($m.CCDensity -le 10) { "Yellow" } else { "Red" }
        $row = "{0,-34} {1,7} {2,7} {3,6} {4,5} {5,6}" -f "$($proj.Name)$ro", $m.Classes, $m.Methods, $m.CCDensity, $m.MaxDoI, $m.LongMethods
        Write-Host $row -ForegroundColor $col
        $csvLines += "$dateStr,$($proj.Name),$($proj.Layer),$($m.Classes),$($m.Methods),$($m.CCDensity),$($m.TotalDec),$($m.MaxDoI),$($m.LongMethods)"
    }

    $csvPath = Join-Path $OutputDir "metrics-$(Get-Date -Format 'yyyyMMdd').csv"
    $csvLines | Set-Content $csvPath -Encoding UTF8
    Write-Host ""
    Write-Host "  CSV: $csvPath  (re-run over time to track trends)" -ForegroundColor DarkGray
}

# -- Summary ------------------------------------------------------------------
Write-Host ""
Write-Host "-- Summary --" -ForegroundColor Yellow
$cPct = if ($totals.Total -gt 0) { [Math]::Round($totals.Comment / $totals.Total * 100, 1) } else { 0 }
$bPct = if ($totals.Total -gt 0) { [Math]::Round($totals.Blank   / $totals.Total * 100, 1) } else { 0 }
Write-Host ("  Total C# files : {0}"        -f $totals.Files)
Write-Host ("  Total lines    : {0}"        -f $totals.Total)
Write-Host ("  Code lines     : {0}"        -f $totals.Code)
Write-Host ("  Comment lines  : {0} ({1}%)" -f $totals.Comment, $cPct)
Write-Host ("  Blank lines    : {0} ({1}%)" -f $totals.Blank,   $bPct)

if (-not $Deep) {
    Write-Host ""
    Write-Host "  Tip: Run with -Deep for cyclomatic complexity, inheritance depth, and long-method detection." -ForegroundColor DarkGray
}
Write-Host ""
