namespace Chandam.API.Models;

/// <summary>
/// Response for matching a poem against a specific Chandam rule
/// </summary>
public class TryMatchResponse
{
    /// <summary>
    /// Whether the poem matches the specified Chandam rule
    /// </summary>
    public bool IsMatch { get; set; }

    /// <summary>
    /// Match result details
    /// </summary>
    public ChandamMatch? Match { get; set; }

    /// <summary>
    /// Error message if matching failed
    /// </summary>
    public string? ErrorMessage { get; set; }
}
