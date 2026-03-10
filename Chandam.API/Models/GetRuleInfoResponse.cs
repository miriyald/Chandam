using System.Collections.Generic;

namespace Chandam.API.Models;

/// <summary>
/// Response containing detailed information about a Chandam rule
/// </summary>
public class GetRuleInfoResponse
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
    /// Number of lines in this Chandam
    /// </summary>
    public int Lines { get; set; }

    /// <summary>
    /// Type of Chandam (Vruttam, Jati, UpaJati)
    /// </summary>
    public string PadyamType { get; set; } = string.Empty;

    /// <summary>
    /// Subtype classification
    /// </summary>
    public string PadyamSubType { get; set; } = string.Empty;

    /// <summary>
    /// Language (Telugu, Sanskrit, Kannada, etc.)
    /// </summary>
    public string Language { get; set; } = string.Empty;

    /// <summary>
    /// Frequency (Frequent, Rare)
    /// </summary>
    public string Frequency { get; set; } = string.Empty;

    /// <summary>
    /// Gana pattern rules (e.g., [["త", "త", "జ", "గా"]])
    /// </summary>
    public string[][]? Rules { get; set; }

    /// <summary>
    /// Yati (caesura) positions
    /// </summary>
    public int[][]? Yati { get; set; }

    /// <summary>
    /// Whether Prasa (rhyme) is required
    /// </summary>
    public bool Prasa { get; set; }

    /// <summary>
    /// Whether PrasaYati is required
    /// </summary>
    public bool PrasaYati { get; set; }

    /// <summary>
    /// Whether AnthyaPrasa (end rhyme) is required
    /// </summary>
    public bool AnthyaPrasa { get; set; }

    /// <summary>
    /// Description/explanation in Telugu
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Reference texts or sources
    /// </summary>
    public string[]? References { get; set; }

    /// <summary>
    /// Example poems demonstrating this Chandam
    /// </summary>
    public List<ExamplePoem>? Examples { get; set; }

    /// <summary>
    /// Error message if rule not found
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Represents an example poem with metadata
/// </summary>
public class ExamplePoem
{
    /// <summary>
    /// The poem text
    /// </summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Author name
    /// </summary>
    public string Author { get; set; } = string.Empty;

    /// <summary>
    /// Date/period
    /// </summary>
    public string Date { get; set; } = string.Empty;

    /// <summary>
    /// Reference source (book, collection, etc.)
    /// </summary>
    public string? Reference { get; set; }

    /// <summary>
    /// Additional notes
    /// </summary>
    public string? Notes { get; set; }
}
