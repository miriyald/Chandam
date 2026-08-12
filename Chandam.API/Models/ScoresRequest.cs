using Chandam.Rules;

namespace Chandam.API.Models;

/// <summary>
/// Request to calculate match scores for all Chandam rules
/// </summary>
public class ScoresRequest
{
    /// <summary>
    /// The poem text to analyze (Telugu/Sanskrit/Kannada text)
    /// </summary>
    public string PoemText { get; set; } = string.Empty;

    /// <summary>
    /// Language filter (null = all languages)
    /// </summary>
    public RuleLanguage? Language { get; set; }

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
    /// Minimum match percentage to include in results (0-100)
    /// </summary>
    public double MinimumMatchPercentage { get; set; } = 0;

    /// <summary>
    /// RuleSet ID to use ("chandam", "sanskrit", "topella", etc.). If null, uses active ruleset.
    /// </summary>
    public string? RuleSetId { get; set; }
}
