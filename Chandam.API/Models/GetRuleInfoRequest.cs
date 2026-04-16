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

    /// <summary>
    /// Description format: Html for browser rendering, Markdown for MCP/AI clients
    /// </summary>
    public RenderFormat DescriptionFormat { get; set; } = RenderFormat.Markdown;

    /// <summary>
    /// RuleSet ID to use ("chandam", "popular", "topella", etc.). If null, uses active ruleset.
    /// Default: "chandam"
    /// </summary>
    public string? RuleSetId { get; set; } = "chandam";
}
