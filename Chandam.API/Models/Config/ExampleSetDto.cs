using System.Collections.Generic;

namespace Chandam.API.Models.Config;

/// <summary>
/// Collection of examples for multiple rules, keyed by rule identifier
/// </summary>
public class ExampleSetDto
{
    /// <summary>
    /// Unique identifier for this example set (e.g., "default-examples")
    /// </summary>
    public string Identifier { get; set; } = string.Empty;

    /// <summary>
    /// Display name for this example set
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of this example set
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Examples keyed by rule identifier
    /// Key = rule identifier (e.g., "iMdravajramu")
    /// Value = array of examples for that rule
    /// </summary>
    public Dictionary<string, List<ExampleDto>> Examples { get; set; } = new();
}
