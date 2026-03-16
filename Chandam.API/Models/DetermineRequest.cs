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
    /// Number of top matches to return (default: 5)
    /// </summary>
    public int TopMatches { get; set; } = 5;

    /// <summary>
    /// Optional: Rendered output format (None, Html, Text, Markdown, Both)
    /// </summary>
    public RenderFormat RenderFormat { get; set; } = RenderFormat.None;
}
