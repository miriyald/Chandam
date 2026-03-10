namespace Chandam.API.Models;

/// <summary>
/// Request to get example poems for a specific Chandam
/// </summary>
public class GetSamplesRequest
{
    /// <summary>
    /// Rule identifier (e.g., "iMdravajramu", "utpalamaala")
    /// </summary>
    public string RuleIdentifier { get; set; } = string.Empty;

    /// <summary>
    /// Maximum number of examples to return (0 = all)
    /// </summary>
    public int MaxExamples { get; set; } = 0;
}
