using Chandam.Rules;
using System.Text;

namespace Chandam.API.Services;

/// <summary>
/// Builds Telugu descriptions for Chandam rules
/// Preserves language authenticity - no English translations
/// </summary>
public static class DescriptionBuilder
{
    /// <summary>
    /// Build a description for a Chandam rule in Telugu
    /// </summary>
    public static string BuildDescription(Rule rule)
    {
        if (rule == null)
            return string.Empty;

        var sb = new StringBuilder();

        // Rule name and type
        sb.Append($"{rule.Name} - {GetPadyamTypeDescription(rule.PadyamType)}");

        // Add subtype if significant
        if (rule.PadyamSubType != PadyamSubType.Vruttam && rule.PadyamSubType != PadyamSubType.Other)
        {
            sb.Append($" ({rule.PadyamSubType})");
        }

        sb.AppendLine();

        // Line count
        if (rule.Lines > 0)
        {
            sb.AppendLine($"పాదాలు: {rule.Lines}");
        }

        // Gana pattern
        if (rule.Rules != null && rule.Rules.Length > 0)
        {
            sb.Append("గణ విధానం: ");
            for (int i = 0; i < rule.Rules.Length; i++)
            {
                if (i > 0) sb.Append(", ");
                sb.Append(string.Join(" ", rule.Rules[i]));
            }
            sb.AppendLine();
        }

        // Yati (caesura) information
        if (rule.Yati != null && rule.Yati.Length > 0 && !IsEmptyYati(rule.Yati))
        {
            sb.Append("యతి: ");
            for (int i = 0; i < rule.Yati.Length; i++)
            {
                if (i > 0) sb.Append(", ");
                sb.Append(string.Join(", ", rule.Yati[i]));
            }
            sb.AppendLine();
        }

        // Prasa (rhyme) requirements
        if (rule.Prasa)
        {
            sb.AppendLine("ప్రాస: అవసరం");
        }

        if (rule.PrasaYati)
        {
            sb.AppendLine("ప్రాసయతి: అవసరం");
        }

        if (rule.AnthyaPrasa)
        {
            sb.AppendLine("అంత్యప్రాస: అవసరం");
        }

        // Add rule text if available
        if (!string.IsNullOrEmpty(rule.RuleText))
        {
            sb.AppendLine();
            sb.AppendLine(rule.RuleText);
        }

        return sb.ToString().TrimEnd();
    }

    private static string GetPadyamTypeDescription(PadyamType type)
    {
        return type switch
        {
            PadyamType.Vruttam => "వృత్తము",
            PadyamType.Jati => "జాతి",
            PadyamType.UpaJati => "ఉపజాతి",
            PadyamType.Unspecified => "వివరించబడలేదు",
            _ => type.ToString()
        };
    }

    private static bool IsEmptyYati(int[][] yati)
    {
        if (yati == null || yati.Length == 0)
            return true;

        foreach (var row in yati)
        {
            if (row != null && row.Length > 0)
            {
                foreach (var val in row)
                {
                    if (val != 0)
                        return false;
                }
            }
        }

        return true;
    }
}
