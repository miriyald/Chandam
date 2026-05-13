using Chandam.API.Models.Config;
using Chandam.Rules;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Chandam.API.Converters;

/// <summary>
/// Converts RuleDto (JSON format) to Rule (internal format)
/// Based on MapRules.Go() from Client/App/MapRules.cs
/// </summary>
public static class RuleDtoConverter
{
    /// <summary>
    /// Convert array of RuleDto to array of Rule with error handling
    /// Skips rules that fail to convert instead of throwing
    /// </summary>
    public static Rule[] ConvertToRules(List<RuleDto> ruleDtos)
    {
        if (ruleDtos == null || ruleDtos.Count == 0)
            return Array.Empty<Rule>();

        var validRules = new List<Rule>();
        int skippedCount = 0;

        foreach (var dto in ruleDtos)
        {
            try
            {
                var rule = ConvertToRule(dto);
                validRules.Add(rule);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SKIPPING rule '{dto.Identifier}': {ex.Message}");
                skippedCount++;
            }
        }

        if (skippedCount > 0)
        {
            Console.WriteLine($"WARNING: Skipped {skippedCount} invalid rules out of {ruleDtos.Count} total");
        }

        return validRules.ToArray();
    }

    /// <summary>
    /// Convert single RuleDto to Rule with error handling
    /// </summary>
    public static Rule ConvertToRule(RuleDto dto)
    {
        try
        {
            var rule = new Rule
            {
                AnthyaPrasa = dto.AnthyaPrasa,
                DeferThresold = dto.DeferThresold,
                Frequency = ParseFrequency(dto.Frequency),
                Identifier = dto.Identifier ?? string.Empty,
                InfiniteLength = dto.InfiniteLength,
                Language = ParseLanguage(dto.Language),
                Lines = dto.Lines,
                Name = dto.Name ?? string.Empty,
                OnlyPrasaYati = dto.OnlyPrasaYati,
                PadyamSubType = ParsePadyamSubType(dto.PadyamSubType),
                PadyamType = ParsePadyamType(dto.PadyamType),
                Prasa = dto.Prasa,
                PrasaYati = dto.PrasaYati,
                References = dto.References,
                ReverseYati = dto.ReverseYati,
                Rules = ConvertRulesArray(dto.Rules, ParseRuleType(dto.RuleType)),
                RuleText = dto.RuleText ?? string.Empty,
                RuleType = ParseRuleType(dto.RuleType),
                Threshold = dto.Threshold,
                Yati = dto.Yati ?? Array.Empty<int[]>(),
                YatiMode = ParseYatiMode(dto.YatiMode),
                YatiRecycle = dto.YatiRecycle,
            };

            // Convert enhanced examples
            if (dto.Examples != null && dto.Examples.Count > 0)
            {
                rule.Examples2 = ConvertExamples(dto.Examples);
            }

            return rule;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR converting rule '{dto.Identifier}' ({dto.Name}): {ex.Message}");
            throw new InvalidOperationException($"Failed to convert rule '{dto.Identifier}': {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Convert ExampleDto to Example with default values for legacy examples
    /// </summary>
    public static Example[] ConvertExamples(List<ExampleDto> exampleDtos)
    {
        if (exampleDtos == null || exampleDtos.Count == 0)
            return Array.Empty<Example>();

        return exampleDtos.Select(ConvertExample).ToArray();
    }

    /// <summary>
    /// Convert single ExampleDto to Example
    /// Applies default values: Author="మహానుభావుడు.", Date="తెలియదు" if not provided
    /// </summary>
    public static Example ConvertExample(ExampleDto dto)
    {
        return new Example
        {
            Text = dto.Text ?? string.Empty,
            Author = string.IsNullOrEmpty(dto.Author) ? "మహానుభావుడు." : dto.Author,
            Reference = dto.Reference,
            // Note: Example class doesn't have Date field, so we append it to Remarks
            Remarks = BuildRemarks(dto.Date, dto.Notes)
        };
    }

    private static string? BuildRemarks(string? date, string? notes)
    {
        var parts = new List<string>();

        if (!string.IsNullOrEmpty(date))
        {
            parts.Add($"కాలం: {date}");
        }

        if (!string.IsNullOrEmpty(notes))
        {
            parts.Add(notes!);
        }

        return parts.Count > 0 ? string.Join(" | ", parts) : null;
    }

    // Enum parsers
    private static RuleLanguage ParseLanguage(string? language)
    {
        if (string.IsNullOrEmpty(language))
            return RuleLanguage.Telugu;

        return language!.ToLower() switch
        {
            "telugu" => RuleLanguage.Telugu,
            "sanskrit" => RuleLanguage.Sanskrit,
            "kannada" => RuleLanguage.Kannada,
            "hindi" => RuleLanguage.Hindi,
            "malayalam" => RuleLanguage.Malayalam,
            _ => RuleLanguage.Telugu
        };
    }

    private static Frequency ParseFrequency(string? frequency)
    {
        if (string.IsNullOrEmpty(frequency))
            return Frequency.Frequent;

        return frequency!.ToLower() switch
        {
            "frequent" => Frequency.Frequent,
            "rare" => Frequency.Rare,
            _ => Frequency.Frequent
        };
    }

    private static RuleType ParseRuleType(string? ruleType)
    {
        if (string.IsNullOrEmpty(ruleType))
            return RuleType.Name;

        return ruleType!.ToLower() switch
        {
            "name" => RuleType.Name,
            "type" => RuleType.Type,
            "type2" => RuleType.Type2,
            "weight" => RuleType.Weight,
            "subtype" => RuleType.SubType,
            "custom" => RuleType.Custom,
            _ => RuleType.Name
        };
    }

    private static PadyamType ParsePadyamType(string? padyamType)
    {
        if (string.IsNullOrEmpty(padyamType))
            return PadyamType.Vruttam;

        return padyamType!.ToLower() switch
        {
            "vruttam" => PadyamType.Vruttam,
            "jati" => PadyamType.Jati,
            "upajati" => PadyamType.UpaJati,
            "unspecified" => PadyamType.Unspecified,
            _ => PadyamType.Vruttam
        };
    }

    private static PadyamSubType ParsePadyamSubType(string? padyamSubType)
    {
        if (string.IsNullOrEmpty(padyamSubType))
            return PadyamSubType.Vruttam;

        return padyamSubType!.ToLower() switch
        {
            "vruttam" => PadyamSubType.Vruttam,
            "jati" => PadyamSubType.Jati,
            "upajati" => PadyamSubType.UpaJati,
            "akkara" => PadyamSubType.Akkara,
            "divpada" => PadyamSubType.Divpada,
            "sisamu" => PadyamSubType.Sisamu,
            "ragada" => PadyamSubType.Ragada,
            "ragada2" => PadyamSubType.Ragada2,
            "shatpada" => PadyamSubType.Shatpada,
            "genricvruttam" => PadyamSubType.GenricVruttam,
            "vishamavruttam" => PadyamSubType.VishamaVruttam,
            "ardhavruttam" => PadyamSubType.ArdhaVruttam,
            "damdakamu" => PadyamSubType.DaMDakamu,
            "other" => PadyamSubType.Other,
            _ => PadyamSubType.Vruttam
        };
    }

    private static YatiMode ParseYatiMode(string? yatiMode)
    {
        if (string.IsNullOrEmpty(yatiMode))
            return YatiMode.CharPosition;

        return yatiMode!.ToLower() switch
        {
            "charposition" => YatiMode.CharPosition,
            "gposition" => YatiMode.GPosition,
            _ => YatiMode.CharPosition
        };
    }

    /// <summary>
    /// Convert string[][] Rules to object[][] Rules
    /// Converts Category enum names (e.g., "Surya", "Indra") to Category enums
    /// Keeps Gana names (e.g., "త", "జ", "గా") as strings
    /// </summary>
    private static object[][]? ConvertRulesArray(string[][]? rules, RuleType ruleType)
    {
        if (rules == null || rules.Length == 0)
            return null;

        var result = new object[rules.Length][];
        for (int i = 0; i < rules.Length; i++)
        {
            if (rules[i] == null || rules[i].Length == 0)
            {
                result[i] = Array.Empty<object>();
                continue;
            }

            result[i] = new object[rules[i].Length];
            for (int j = 0; j < rules[i].Length; j++)
            {
                var value = rules[i][j];

                switch (ruleType)
                {
                    case RuleType.Weight:
                        // Weight rules use numeric values (e.g., 3, 4, 5)
                        if (int.TryParse(value, out var weight))
                            result[i][j] = weight;
                        else
                            result[i][j] = value;
                        break;

                    case RuleType.Custom:
                        // Custom rules keep original string as-is
                        result[i][j] = value;
                        break;

                    default:
                        // Name/Type/Type2/SubType: parse as Category/SubCategory/Category2 enums
                        if (Enum.TryParse<Category>(value, ignoreCase: true, out var category))
                            result[i][j] = category;
                        else if (Enum.TryParse<SubCategory>(value, ignoreCase: true, out var subCategory))
                            result[i][j] = subCategory;
                        else if (Enum.TryParse<Category2>(value, ignoreCase: true, out var category2))
                            result[i][j] = category2;
                        else
                            result[i][j] = value;
                        break;
                }
            }
        }

        return result;
    }
}
