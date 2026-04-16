using Chandam.API.Models.Config;
using Chandam.Rules;

namespace Chandam.API.Models;

/// <summary>
/// Request to match a poem against a custom (unregistered) rule
/// </summary>
public class TryMatchCustomRequest
{
    /// <summary>
    /// The poem text to analyze (Telugu/Sanskrit/Kannada text)
    /// </summary>
    public string PoemText { get; set; } = string.Empty;

    /// <summary>
    /// Custom rule definition to match against
    /// </summary>
    public RuleDto Rule { get; set; } = new RuleDto();

    /// <summary>
    /// Whether to match Yati (caesura/rhythmic breaks)
    /// </summary>
    public bool MatchYati { get; set; } = true;

    /// <summary>
    /// Whether to match Prasa (rhyme/end-sound matching)
    /// </summary>
    public bool MatchPrasa { get; set; } = true;

    /// <summary>
    /// Optional: Rendered output format (None, Html, Text, Markdown, Both)
    /// </summary>
    public RenderFormat RenderFormat { get; set; } = RenderFormat.None;

    /// <summary>
    /// Language of the poem (default: te)
    /// </summary>
    public RuleLanguage Language { get; set; } = RuleLanguage.Telugu;
}
