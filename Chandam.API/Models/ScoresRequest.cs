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
    /// Minimum match percentage to include in results (0-100)
    /// </summary>
    public double MinimumMatchPercentage { get; set; } = 0;

    /// <summary>
    /// RuleSet ID to use ("chandam", "popular", "topella", etc.). If null, uses active ruleset.
    /// Default: "chandam"
    /// </summary>
    public string? RuleSetId { get; set; } = "chandam";
}
