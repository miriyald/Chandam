using System.Collections.Generic;

namespace Chandam.API.Models;

/// <summary>
/// Response containing detailed information about a Chandam rule
/// </summary>
public class GetRuleInfoResponse
{
    // Identifiers
    public string Identifier { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    // Classifications
    public string Language { get; set; } = string.Empty;
    public string PadyamType { get; set; } = string.Empty;
    public string PadyamSubType { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;

    // Rules
    public int Lines { get; set; }
    public int Threshold { get; set; }
    public string[][]? Rules { get; set; }
    public int[][]? Yati { get; set; }
    public string YatiMode { get; set; } = string.Empty;
    public bool Prasa { get; set; }
    public bool PrasaYati { get; set; }
    public bool AnthyaPrasa { get; set; }
    public bool ReverseYati { get; set; }
    public bool OnlyPrasaYati { get; set; }
    public bool YatiRecycle { get; set; }
    public bool DeferThresold { get; set; }
    public bool InfiniteLength { get; set; }
    public string? RuleText { get; set; }
    public string[]? References { get; set; }

    // Calculated fields
    public string? ShortName { get; set; }
    public string? Alias { get; set; }
    public string? ChandamName { get; set; }
    public int CharLength { get; set; }
    public int MatraLength { get; set; }
    public int Min { get; set; }
    public int Max { get; set; }
    public decimal ChandamNumber { get; set; }
    public decimal ChandamOrder { get; set; }
    public string? Sequence { get; set; }
    public string? MatraSeries { get; set; }
    public bool RowWiseRules { get; set; }
    public string? Description { get; set; }

    // Examples
    public List<ExamplePoem>? Examples { get; set; }

    // Error
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Represents an example poem with metadata
/// </summary>
public class ExamplePoem
{
    public string Text { get; set; } = string.Empty;
    public string? Beautified { get; set; }
    public string Author { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string? Reference { get; set; }
    public string? Notes { get; set; }
}
