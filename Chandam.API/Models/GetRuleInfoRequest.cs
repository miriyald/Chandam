namespace Chandam.API.Models;

/// <summary>
/// Request to get detailed information about a specific Chandam rule
/// </summary>
public class GetRuleInfoRequest
{
    /// <summary>
    /// Rule identifier (e.g., "iMdravajramu", "utpalamaala")
    /// </summary>
    public string RuleIdentifier { get; set; } = string.Empty;

    /// <summary>
    /// Whether to include example poems
    /// </summary>
    public bool IncludeExamples { get; set; } = true;
}
