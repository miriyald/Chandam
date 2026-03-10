using Chandam.API.Models.Config;

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
}
