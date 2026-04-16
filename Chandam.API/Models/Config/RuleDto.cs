using System.Collections.Generic;
using System.Text.Json.Serialization;
#if !EXCLUDE_YAML
using YamlDotNet.Serialization;
#endif

namespace Chandam.API.Models.Config;

/// <summary>
/// JSON-serializable rule definition
/// </summary>
public class RuleDto
{
    // Identifiers
    public string Identifier { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    // Classifications
    public string? Language { get; set; }
    public string? PadyamType { get; set; }
    public string? PadyamSubType { get; set; }
    public string? RuleType { get; set; }
    public string? Frequency { get; set; }

    // Rules
    public int Lines { get; set; }
    public int Threshold { get; set; }
    public string[][]? Rules { get; set; }
    public int[][]? Yati { get; set; }
    public string? YatiMode { get; set; }
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

    // Calculated fields (excluded from serialization - computed at runtime)
    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public string? ShortName { get; set; }

    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public string? Alias { get; set; }

    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public string? ChandamName { get; set; }

    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public int CharLength { get; set; }

    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public int MatraLength { get; set; }

    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public int Min { get; set; }

    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public int Max { get; set; }

    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public decimal ChandamNumber { get; set; }

    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public decimal ChandamOrder { get; set; }

    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public string? Sequence { get; set; }

    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public string? MatraSeries { get; set; }

    [JsonIgnore]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public bool RowWiseRules { get; set; }

    // Examples
    public List<ExampleDto>? Examples { get; set; }
}

/// <summary>
/// Collection of rules (rule set)
/// </summary>
public class RuleSetDto
{
    public string Identifier { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<RuleDto> Rules { get; set; } = new();
}
