using Chandam.Rules;

namespace Chandam.API.Models;

/// <summary>
/// Request to auto-detect the best matching Chandam for a poem
/// </summary>
public class DetermineRequest
{
    /// <summary>
    /// The poem text to analyze (Telugu/Sanskrit/Kannada text)
    /// </summary>
    public string PoemText { get; set; } = string.Empty;

    /// <summary>
    /// Language of the poem (default: Telugu)
    /// </summary>
    public RuleLanguage Language { get; set; } = RuleLanguage.Telugu;

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
    /// Number of top matches to return (default: 5)
    /// </summary>
    public int TopMatches { get; set; } = 5;

    /// <summary>
    /// Optional: Rendered output format (None, Html, Markdown)
    /// </summary>
    public RenderFormat RenderFormat { get; set; } = RenderFormat.Html;

    /// <summary>
    /// RuleSet ID to use ("chandam", "sanskrit", "topella", etc.). If null, uses active ruleset.
    /// </summary>
    public string? RuleSetId { get; set; }
}
