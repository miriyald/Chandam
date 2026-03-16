using System.Collections.Generic;

namespace Chandam.API.Models;

/// <summary>
/// Response containing the best matching Chandam(s) for a poem
/// </summary>
public class DetermineResponse
{
    public List<ChandamMatch> Matches { get; set; } = new();
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Represents a single Chandam match result: Rule info + MatchResult data
/// </summary>
public class ChandamMatch
{
    // --- Full rule info (reuses GetRuleInfoResponse) ---
    public GetRuleInfoResponse Rule { get; set; } = new();

    // --- From MatchResult ---
    public int Score { get; set; }
    public int Total { get; set; }
    public int MatchPercentage { get; set; }
    public bool IsMatched { get; set; }

    // --- Structured errors ---
    public List<MatchError>? Errors { get; set; }

    // --- Rendered output (optional, per request) ---
    public string? RenderedHtml { get; set; }
    public string? RenderedText { get; set; }
    public string? RenderedMarkdown { get; set; }
}

/// <summary>
/// A single structured mismatch error from the matching engine
/// </summary>
public class MatchError
{
    public int Line { get; set; }
    public int Position { get; set; }
    public string MismatchType { get; set; } = string.Empty;
    public string MismatchDescription { get; set; } = string.Empty;
    public string Expected { get; set; } = string.Empty;
    public string Actual { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}
