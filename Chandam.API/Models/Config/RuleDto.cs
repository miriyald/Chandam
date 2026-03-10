using System.Collections.Generic;

namespace Chandam.API.Models.Config;

/// <summary>
/// JSON-serializable rule definition (matches Rule2 structure from External.cs)
/// </summary>
public class RuleDto
{
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
    public int Lines { get; set; }
    public int Threshold { get; set; }

    /// <summary>
    /// Gana patterns (e.g., [["మ", "స", "జ", "స", "తత", "గా"]])
    /// </summary>
    public string[][]? Rules { get; set; }

    /// <summary>
    /// Yati (caesura) positions (e.g., [[6, 13]])
    /// </summary>
    public int[][]? Yati { get; set; }

    public bool Prasa { get; set; }
    public bool PrasaYati { get; set; }
    public bool AnthyaPrasa { get; set; }

    /// <summary>
    /// Enhanced examples with metadata
    /// </summary>
    public List<ExampleDto>? Examples { get; set; }

    public string? RuleType { get; set; }      // "Name", "Gana", "Custom"
    public string? PadyamType { get; set; }    // "Vruttam", "Jati", etc.
    public string? PadyamSubType { get; set; }
    public string? YatiMode { get; set; }      // "CharPosition", "GanaPosition"
    public string? Language { get; set; }      // "Telugu", "Sanskrit"
    public string? Frequency { get; set; }     // "Frequent", "Rare"

    public bool ReverseYati { get; set; }
    public bool OnlyPrasaYati { get; set; }
    public bool YatiRecycle { get; set; }
    public bool DeferThresold { get; set; }
    public bool InfiniteLength { get; set; }

    public string[]? References { get; set; }
    public string? RuleText { get; set; }
}

/// <summary>
/// Collection of rules (rule set)
/// </summary>
public class RuleSetDto
{
    public string Identifier { get; set; } = string.Empty;  // "default", "telugu-complete", etc.
    public string Name { get; set; } = string.Empty;        // Human-readable name
    public string? Description { get; set; }
    public List<RuleDto> Rules { get; set; } = new();
}
