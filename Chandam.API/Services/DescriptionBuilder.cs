using System.Collections.Generic;
using Chandam.Rules;
using Chandam.Util;
using System.Text;

namespace Chandam.API.Services;

/// <summary>
/// Builds Telugu text descriptions for Chandam rules.
/// Text equivalent of CheatSheet.BuildHTMLRules — rich, human-readable.
/// </summary>
public static class DescriptionBuilder
{
    /// <summary>
    /// Build a comprehensive text description for a Chandam rule in Telugu.
    /// Modeled after CheatSheet.BuildHTMLRules but outputs plain text.
    /// </summary>
    public static string BuildDescription(Rule rule)
    {
        if (rule == null)
            return string.Empty;

        var sb = new StringBuilder();

        // Title
        sb.AppendLine($"# {rule.ShortName} పద్య లక్షణములు");
        sb.AppendLine();

        // Alias
        if (!string.IsNullOrEmpty(rule.Alias))
        {
            var plural = rule.Alias.Contains(',');
            sb.AppendLine($"- ఈ పద్య ఛందస్సుకే '{rule.Alias}' అనే ఇతర నామము{(plural ? "లు" : "")} కూడా కల{(plural ? "వు" : "దు")}.");
        }

        // Padyam type
        var padyamType = Helper.GetPadyamTypeString(rule.PadyamType, rule.PadyamSubType);
        sb.AppendLine($"- {padyamType} రకానికి చెందినది.");

        // Chandam name and number (only for Vruttam, non-rowwise, non-infinite)
        if (rule.PadyamType == PadyamType.Vruttam && !rule.RowWiseRules && rule.ChandamNumber != -1)
        {
            sb.AppendLine($"- {rule.ChandamName} ఛందమునకు చెందిన {rule.ChandamNumber} వ వృత్తము.");
            sb.AppendLine($"- {rule.CharLength} అక్షరములు ఉండును.");
        }

        // Char length range (for non-uniform rules)
        if (rule.CharLength == -1 && !rule.InfiniteLength)
        {
            if (rule.Min == rule.Max)
                sb.AppendLine($"- {rule.Max} అక్షరములు ఉండును.");
            else
                sb.AppendLine($"- {rule.Min} నుండి {rule.Max} అక్షరములు ఉండును.");
        }

        // Matra length and series
        if (rule.PadyamType == PadyamType.Vruttam && !rule.RowWiseRules && rule.MatraLength != -1)
        {
            sb.AppendLine($"- {rule.MatraLength} మాత్రలు ఉండును.");
            sb.AppendLine($"- మాత్రా శ్రేణి: {rule.Sequence}");
            if (!string.IsNullOrEmpty(rule.MatraSeries))
            {
                sb.AppendLine($"  ({rule.MatraSeries})");
            }
        }

        // Lines
        sb.AppendLine($"- {rule.Lines} {(rule.Lines != 1 ? "పాదములు" : "పాదము")} ఉండును.");

        // Prasa
        sb.AppendLine(rule.Prasa
            ? "- ప్రాస నియమం కలదు."
            : "- ప్రాస నియమం లేదు.");

        if (rule.AnthyaPrasa)
            sb.AppendLine("- అంత్య ప్రాస నియమం కలదు.");

        if (rule.PrasaYati)
            sb.AppendLine("- ప్రాస యతి నియమం కలదు.");

        // Yati
        AppendYatiDescription(sb, rule);

        // Gana rules
        AppendGanaDescription(sb, rule);

        // Rule text (original laxanam if available)
        if (!string.IsNullOrEmpty(rule.RuleText))
        {
            sb.AppendLine();
            sb.AppendLine(rule.RuleText);
        }

        return sb.ToString().TrimEnd();
    }

    private static void AppendYatiDescription(StringBuilder sb, Rule rule)
    {
        if (rule.Yati == null || rule.Yati.Length == 0)
            return;

        if (rule.Yati.Length == rule.Rules.Length && rule.Yati.Length > 1)
        {
            // Row-wise yati (different per line)
            for (int i = 0; i < rule.Yati.Length; i++)
            {
                var lineRule = rule.Yati[i];
                if (lineRule.Length > 0)
                {
                    var padamName = GetPadamName(i + 1);
                    var positions = string.Join(", ", lineRule);
                    var suffix = GetYatiSuffix(rule.YatiMode, rule.ReverseYati, lineRule.Length);
                    sb.AppendLine($"- {padamName} పాదమునందు {positions}{suffix} యతి స్థాన{(lineRule.Length == 1 ? "ము" : "ములు")}.");
                }
            }
        }
        else
        {
            if (rule.Yati.Length > 0 && rule.Yati[0].Length > 0)
            {
                var lineRule = rule.Yati[0];
                var positions = string.Join(", ", lineRule);
                var suffix = GetYatiSuffix(rule.YatiMode, rule.ReverseYati, lineRule.Length);
                sb.AppendLine($"- ప్రతి పాదమునందు {positions}{suffix} యతి స్థాన{(lineRule.Length == 1 ? "ము" : "ములు")}.");
            }
        }
    }

    private static void AppendGanaDescription(StringBuilder sb, Rule rule)
    {
        if (rule.Rules == null || rule.Rules.Length == 0)
            return;

        if (rule.RowWiseRules)
        {
            sb.AppendLine("- గణ లక్షణాలు:");
            for (int i = 0; i < rule.Rules.Length; i++)
            {
                var padamName = GetPadamName(i + 1);
                var ganaText = GetGanaText(rule.Rules[i], rule.RuleType, rule.InfiniteLength);
                sb.AppendLine($"  {padamName} పాదమునందు {ganaText} గణములుండును.");
            }
        }
        else
        {
            var ganaText = GetGanaText(rule.Rules[0], rule.RuleType, rule.InfiniteLength);
            sb.AppendLine($"- ప్రతి పాదమునందు {ganaText} గణములుండును.");
        }
    }

    private static string GetGanaText(object[] lineRule, RuleType ruleType, bool infiniteLength)
    {
        if (lineRule == null || lineRule.Length == 0)
            return "";

        var parts = new List<string>();
        if (ruleType == RuleType.Name)
        {
            for (int i = 0; i < lineRule.Length; i++)
            {
                if (infiniteLength && i == lineRule.Length - 2)
                {
                    parts.Add(GDefinition.GAlias(lineRule[i].ToString()));
                    parts.Add(".....");
                    parts.Add(GDefinition.GAlias(lineRule[lineRule.Length - 1].ToString()));
                    break;
                }
                parts.Add(GDefinition.GAlias(lineRule[i].ToString()));
            }
            return string.Join(", ", parts);
        }

        // For Type/SubType/Weight rules, group repeats
        string prev = "";
        int repeat = 0;
        var result = new StringBuilder();

        for (int i = 0; i < lineRule.Length; i++)
        {
            string curr = RuleText(ruleType, lineRule[i]);
            if (prev != "" && prev != curr)
            {
                if (result.Length > 0) result.Append(", ");
                result.Append($"{GetNumberText(repeat)} {prev}");
                repeat = 1;
                prev = curr;
                continue;
            }
            repeat++;
            prev = curr;
        }

        if (repeat > 0)
        {
            if (result.Length > 0) result.Append(", ");
            result.Append($"{GetNumberText(repeat)} {prev}");
        }

        return result.ToString();
    }

    private static string RuleText(RuleType ruleType, object o)
    {
        switch (ruleType)
        {
            case RuleType.Name:
                return GDefinition.GAlias(o.ToString());
            case RuleType.Type:
                return GDefinition.CategoryString((Category)o);
            case RuleType.SubType:
                return GDefinition.SubCategoryString((SubCategory)o);
            case RuleType.Weight:
                return $"{(int)o} మాత్రలు";
            default:
                return "తెలియదు";
        }
    }

    private static string GetYatiSuffix(YatiMode mode, bool reverseYati, int count)
    {
        if (mode == YatiMode.GPosition)
        {
            return reverseYati
                ? (count > 1 ? " గణముల చివరి అక్షరములు" : " వ గణము యొక్క చివరి అక్షరము")
                : (count > 1 ? " గణముల మొదటి అక్షరములు" : " వ గణము యొక్క మొదటి అక్షరము");
        }
        if (mode == YatiMode.CharPosition)
        {
            return count > 1 ? " వ అక్షరములు" : " వ అక్షరము";
        }
        return "";
    }

    private static string GetPadamName(int p) => p switch
    {
        1 => "ఒకటవ",
        2 => "రెండవ",
        3 => "మూడవ",
        4 => "నాలుగవ",
        5 => "ఐదవ",
        6 => "ఆరవ",
        7 => "ఏడవ",
        8 => "ఎనిమిదవ",
        _ => $"{p} వ"
    };

    private static string GetNumberText(int num) => num switch
    {
        1 => "ఒక",
        2 => "రెండు",
        3 => "మూడు",
        4 => "నాలుగు",
        5 => "ఐదు",
        6 => "ఆరు",
        7 => "ఏడు",
        8 => "ఎనిమిది",
        _ => num.ToString()
    };
}
