using System.Collections.Generic;

namespace Chandam.API.Models;

/// <summary>
/// Response containing example poems for a Chandam
/// </summary>
public class GetSamplesResponse
{
    /// <summary>
    /// Rule identifier
    /// </summary>
    public string Identifier { get; set; } = string.Empty;

    /// <summary>
    /// Rule name in Telugu
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// List of example poems
    /// </summary>
    public List<ExamplePoem> Examples { get; set; } = new();

    /// <summary>
    /// Total number of examples available
    /// </summary>
    public int TotalExamples { get; set; }

    /// <summary>
    /// Error message if rule not found or has no examples
    /// </summary>
    public string? ErrorMessage { get; set; }
}
