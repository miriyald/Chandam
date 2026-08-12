using Chandam.Rules;

namespace Chandam.API.Models;

/// <summary>
/// Request to match a poem against a specific Chandam rule
/// </summary>
public class TryMatchRequest
{
    /// <summary>
    /// The poem text to analyze (Telugu/Sanskrit/Kannada text)
    /// </summary>
    public string PoemText { get; set; } = string.Empty;

    /// <summary>
    /// Rule identifier to match against (e.g., "iMdravajramu", "utpalamaala")
    /// </summary>
    public string RuleIdentifier { get; set; } = string.Empty;

    /// <summary>
    /// Whether to match Yati (caesura/rhythmic breaks)
    /// </summary>
    public bool MatchYati { get; set; } = true;

    /// <summary>
    /// Whether to match Prasa (rhyme/end-sound matching)
    /// </summary>
    public bool MatchPrasa { get; set; } = true;

    /// <summary>
    /// Whether to allow Santi Prasa (శాంతిప్రాసము) - first or last consonant may match.
    /// Only applied when MatchYati is true.
    /// </summary>
    public bool AllowSantiPrasa { get; set; } = false;

    /// <summary>
    /// Whether to allow sound-based Sandhi at Yati position (matches finish groups only).
    /// Only applied when MatchYati is true.
    /// </summary>
    public bool SoundexSandhi { get; set; } = false;

    /// <summary>
    /// Optional: Rendered output format (None, Html, Text, Markdown, Both)
    /// </summary>
    public RenderFormat RenderFormat { get; set; } = RenderFormat.None;

    /// <summary>
    /// RuleSet ID to use ("chandam", "sanskrit", "topella", etc.). If null, uses active ruleset.
    /// </summary>
    public string? RuleSetId { get; set; }

    /// <summary>
    /// Language of the poem. If null, infers from rule or uses default (te).
    /// </summary>
    public RuleLanguage? Language { get; set; }
}
