using System.Collections.Generic;
using Chandam.Rules;
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

        // YAML Frontmatter for machine parsing
        sb.AppendLine("---");
        sb.AppendLine($"identifier: {rule.Identifier}");
        sb.AppendLine($"name: {rule.Name}");
        sb.AppendLine($"shortName: {rule.ShortName}");
        sb.AppendLine($"language: {rule.Language}");
        sb.AppendLine($"padyamType: {rule.PadyamType}");
        sb.AppendLine($"padyamSubType: {rule.PadyamSubType}");
        if (!string.IsNullOrEmpty(rule.Alias))
            sb.AppendLine($"alias: {rule.Alias}");
        if (rule.ChandamNumber != -1)
        {
            sb.AppendLine($"chandamName: {rule.ChandamName}");
            sb.AppendLine($"chandamNumber: {rule.ChandamNumber}");
        }
        sb.AppendLine($"charLength: {rule.CharLength}");
        if (rule.MatraLength != -1)
            sb.AppendLine($"matraLength: {rule.MatraLength}");
        sb.AppendLine($"lines: {rule.Lines}");
        sb.AppendLine($"prasa: {rule.Prasa.ToString().ToLower()}");
        if (rule.AnthyaPrasa)
            sb.AppendLine("anthyaPrasa: true");
        if (rule.PrasaYati)
            sb.AppendLine("prasaYati: true");
        if (!string.IsNullOrEmpty(rule.Sequence))
            sb.AppendLine($"pattern: \"{rule.Sequence}\"");
        sb.AppendLine("---");
        sb.AppendLine();

        // Title
        sb.AppendLine($"# {rule.ShortName} పద్య లక్షణములు");
        sb.AppendLine();

        // 📚 Classification
        sb.AppendLine("## 📚 వర్గీకరణ");
        sb.AppendLine();
        var padyamType = Helper.GetPadyamTypeString(rule.PadyamType, rule.PadyamSubType);
        sb.AppendLine($"- **రకము**: {padyamType}");
        if (rule.ChandamNumber != -1)
            sb.AppendLine($"- **ఛందం**: {rule.ChandamName} ({rule.ChandamNumber}వ వృత్తము)");
        if (!string.IsNullOrEmpty(rule.Alias))
            sb.AppendLine($"- **ఇతర పేర్లు**: {rule.Alias}");
        sb.AppendLine();

        // 📐 Structure
        sb.AppendLine("## 📐 నిర్మాణం");
        sb.AppendLine();
        sb.AppendLine("| లక్షణం | విలువ |");
        sb.AppendLine("|---------|------|");

        string charLengthValue = rule.CharLength == -1 && !rule.InfiniteLength
            ? (rule.Min == rule.Max ? rule.Max.ToString() : $"{rule.Min} - {rule.Max}")
            : rule.CharLength.ToString();
        sb.AppendLine($"| అక్షరాల సంఖ్య | {charLengthValue} |");

        if (rule.MatraLength != -1)
            sb.AppendLine($"| మాత్రల సంఖ్య | {rule.MatraLength} |");
        sb.AppendLine($"| పాదాల సంఖ్య | {rule.Lines} |");
        sb.AppendLine();

        // 🔤 Gana Rules
        sb.AppendLine("## 🔤 గణ విధానం");
        sb.AppendLine();
        if (rule.RowWiseRules && rule.Rules.Length > 1)
        {
            sb.AppendLine("### పాద విభజనం");
            sb.AppendLine();
            sb.AppendLine("| పాదం | గణములు |");
            sb.AppendLine("|------|---------|");
            for (int i = 0; i < rule.Rules.Length; i++)
            {
                var padamName = GetPadamName(i + 1);
                var ganaText = GetGanaText(rule.Rules[i], rule.RuleType, rule.InfiniteLength);
                sb.AppendLine($"| {padamName} పాదం | {ganaText} |");
            }
        }
        else
        {
            var ganaText = GetGanaText(rule.Rules[0], rule.RuleType, rule.InfiniteLength);
            sb.AppendLine($"ప్రతి పాదమునందు: **{ganaText}** గణములుండును.");
        }
        sb.AppendLine();

        // Special rules from RuleText
        if (!string.IsNullOrEmpty(rule.RuleText))
        {
            sb.AppendLine("## ప్రత్యేక నియమములు");
            sb.AppendLine();
            sb.AppendLine($"> {rule.RuleText}");
            sb.AppendLine();
        }

        // ✓ Prasa Rules
        sb.AppendLine("## ✓ ప్రాస విధానం");
        sb.AppendLine();
        sb.AppendLine($"- **ప్రాస**: {(rule.Prasa ? "కలదు" : "లేదు")}");
        if (rule.AnthyaPrasa)
            sb.AppendLine("- **అంత్యప్రాస**: కలదు");
        if (rule.PrasaYati)
            sb.AppendLine("- **ప్రాస యతి**: కలదు");
        sb.AppendLine();

        // 🎯 Yati Rules
        if (rule.Yati != null && rule.Yati.Length > 0 && rule.Yati[0].Length > 0)
        {
            sb.AppendLine("## 🎯 యతి విధానం");
            sb.AppendLine();

            if (rule.Yati.Length == rule.Rules.Length && rule.Yati.Length > 1)
            {
                sb.AppendLine("### పాద విభజనం");
                sb.AppendLine();
                sb.AppendLine("| పాదం | యతి స్థానములు |");
                sb.AppendLine("|------|----------------|");
                for (int i = 0; i < rule.Yati.Length; i++)
                {
                    if (rule.Yati[i].Length > 0)
                    {
                        var padamName = GetPadamName(i + 1);
                        var positions = string.Join(", ", rule.Yati[i]);
                        var suffix = GetYatiSuffix(rule.YatiMode, rule.ReverseYati, rule.Yati[i].Length);
                        sb.AppendLine($"| {padamName} పాదం | {positions}{suffix} |");
                    }
                }
            }
            else
            {
                var positions = string.Join(", ", rule.Yati[0]);
                var suffix = GetYatiSuffix(rule.YatiMode, rule.ReverseYati, rule.Yati[0].Length);
                sb.AppendLine($"ప్రతి పాదమునందు **{positions}**{suffix} యతి స్థానములు.");
            }
            sb.AppendLine();
        }

        // 🎵 Matra Details
        if (rule.PadyamType == PadyamType.Vruttam && !rule.RowWiseRules && rule.MatraLength != -1)
        {
            sb.AppendLine("## 🎵 మాత్రా విభజనం");
            sb.AppendLine();
            sb.AppendLine($"**స్వరూపం**: `{rule.Sequence}`");
            sb.AppendLine();

            var availableSeries = AvailableSeriesMarkdown(rule.Sequence);
            if (!string.IsNullOrEmpty(availableSeries))
            {
                sb.AppendLine("### లయ భేదాలు");
                sb.AppendLine();
                sb.AppendLine("| శ్రేణి | స్వరూపం |");
                sb.AppendLine("|--------|---------|");
                sb.Append(availableSeries);
                sb.AppendLine();
            }
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

    // Matra series helpers - ported from CheatSheet.cs

    private static string ColorFul(string series)
    {
        return series
            .Replace("|", " <span class='laghu'>I</span> ")
            .Replace("U", " <span class='guru'>U</span> ");
    }

    private static string? MatraSreni(string sequence, int target)
    {
        string s = "";
        int tot = 0;

        if (sequence.Length < target) return "";

        for (int i = 0; i < sequence.Length; i++)
        {
            if (tot > target) return null;
            if (tot == target)
            {
                tot = 0;
                s += "-";
            }
            tot += (sequence[i] == '|' ? 1 : 2);
            s += sequence[i];
        }

        return tot > target ? "" : s;
    }

    private static string MatraSreni2(string sequence, int x, int y)
    {
        string s = "";
        int tot = 0;
        int target = x;
        int done = 0;

        if (sequence.Length < target) return "";

        for (int i = 0; i < sequence.Length; i++)
        {
            if (tot > target) return "";
            if (tot == target)
            {
                tot = 0;
                s += "-";
                target = (target == x) ? y : x;
                done++;
            }
            tot += (sequence[i] == '|' ? 1 : 2);
            s += sequence[i];
        }

        return (tot > target || done < 2) ? "" : s;
    }

    private static string MatraSreniName(int n) => n switch
    {
        3 => "త్రిమాత్రా శ్రేణి",
        4 => "చతుర్మాత్రా శ్రేణి",
        5 => "పంచమాత్రా శ్రేణి",
        6 => "షణ్మాత్రా శ్రేణి",
        _ => ""
    };

    private static string MatraSreniName2(int x, int y)
        => $"మిశ్రగతి శ్రేణి ({x}-{y}) ";

    private static string AvailableSerieses(string sequence)
    {
        string temp = "";
        string seq = sequence.Replace("-", "");

        // Single-length series (3-6 matras)
        for (int i = 3; i <= 6; i++)
        {
            string? m = MatraSreni(seq, i);
            if (!string.IsNullOrEmpty(m) && m != null)
            {
                temp += $"<li>{MatraSreniName(i)}: {ColorFul(m)}</li>";
            }
        }

        // Mixed series
        foreach (var (x, y) in new[] { (3, 4), (4, 3), (3, 5), (5, 3), (4, 5), (5, 4) })
        {
            string m = MatraSreni2(seq, x, y);
            if (!string.IsNullOrEmpty(m))
            {
                temp += $"<li>{MatraSreniName2(x, y)}: {ColorFul(m)}</li>";
            }
        }

        return string.IsNullOrEmpty(temp) ? "" : $"<ul>{temp}</ul>";
    }

    private static string AvailableSeriesMarkdown(string sequence)
    {
        var sb = new StringBuilder();
        string seq = sequence.Replace("-", "");

        // Single-length series (3-6)
        for (int i = 3; i <= 6; i++)
        {
            string? m = MatraSreni(seq, i);
            if (!string.IsNullOrEmpty(m) && m != null)
            {
                sb.AppendLine($"| {MatraSreniName(i)} | `{m}` |");
            }
        }

        // Mixed series
        foreach (var (x, y) in new[] { (3, 4), (4, 3), (3, 5), (5, 3), (4, 5), (5, 4) })
        {
            string m = MatraSreni2(seq, x, y);
            if (!string.IsNullOrEmpty(m))
            {
                sb.AppendLine($"| {MatraSreniName2(x, y)} | `{m}` |");
            }
        }

        return sb.ToString();
    }

    /// <summary>
    /// Build an HTML description for a Chandam rule in Telugu.
    /// Structured with semantic sections matching BuildDescription layout.
    /// </summary>
    public static string BuildDescriptionHtml(Rule rule)
    {
        if (rule == null)
            return string.Empty;

        var sb = new StringBuilder();

        // Badge row - primary stats
        sb.AppendLine("<div class='rule-summary-badges'>");

        var padyamType = Helper.GetPadyamTypeString(rule.PadyamType, rule.PadyamSubType);
        sb.AppendLine($"<span class='badge badge-type'>{padyamType}</span>");

        string charLengthValue = rule.CharLength == -1 && !rule.InfiniteLength
            ? (rule.Min == rule.Max ? rule.Max.ToString() : $"{rule.Min}-{rule.Max}")
            : rule.CharLength.ToString();
        sb.AppendLine($"<span class='badge badge-chars'>{charLengthValue} అక్షరములు</span>");

        if (rule.MatraLength != -1)
        {
            sb.AppendLine($"<span class='badge badge-matras'>{rule.MatraLength} మాత్రలు</span>");
        }

        if (rule.ChandamNumber != -1)
        {
            sb.AppendLine($"<span class='badge badge-chandam'>{rule.ChandamName} ({rule.ChandamNumber}వ వృత్తము)</span>");
        }

        sb.AppendLine("</div>");

        // Properties grid
        sb.AppendLine("<div class='rule-properties'>");

        sb.AppendLine("<div class='property'>");
        sb.AppendLine("  <span class='label'>పాదములు:</span>");
        sb.AppendLine($"  <span class='value'>{rule.Lines}</span>");
        sb.AppendLine("</div>");

        sb.AppendLine("<div class='property'>");
        sb.AppendLine("  <span class='label'>ప్రాస:</span>");
        if (rule.Prasa)
            sb.AppendLine("  <span class='value'><span class='check-yes'>✓</span> కలదు</span>");
        else
            sb.AppendLine("  <span class='value'><span class='check-no'>✗</span> లేదు</span>");
        sb.AppendLine("</div>");

        if (rule.AnthyaPrasa)
        {
            sb.AppendLine("<div class='property'>");
            sb.AppendLine("  <span class='label'>అంత్యప్రాస:</span>");
            sb.AppendLine("  <span class='value'><span class='check-yes'>✓</span> కలదు</span>");
            sb.AppendLine("</div>");
        }

        if (rule.Yati != null && rule.Yati.Length > 0 && rule.Yati[0].Length > 0)
        {
            if (rule.Yati.Length == rule.Rules.Length && rule.Yati.Length > 1)
            {
                sb.AppendLine("<div class='property'>");
                sb.AppendLine("  <span class='label'>యతి:</span>");
                sb.AppendLine("  <span class='value'><span class='check-yes'>✓</span> పాద-వారీగా</span>");
                sb.AppendLine("</div>");
            }
            else
            {
                var positions = string.Join(", ", rule.Yati[0]);
                var suffix = GetYatiSuffix(rule.YatiMode, rule.ReverseYati, rule.Yati[0].Length);
                sb.AppendLine("<div class='property'>");
                sb.AppendLine("  <span class='label'>యతి:</span>");
                sb.AppendLine($"  <span class='value'><span class='check-yes'>✓</span> {positions}{suffix}</span>");
                sb.AppendLine("</div>");
            }
        }

        sb.AppendLine("</div>");

        // Gana sequence
        if (rule.RowWiseRules && rule.Rules.Length > 1)
        {
            bool hasRowWiseYati = rule.Yati != null
                && rule.Yati.Length == rule.Rules.Length
                && rule.Yati.Length > 1;

            sb.AppendLine("<div class='gana-sequence'>");
            sb.AppendLine("<strong>గణములు (పాద-వారీగా):</strong>");
            sb.AppendLine("<table class='gana-table'>");
            for (int i = 0; i < rule.Rules.Length; i++)
            {
                var padamName = GetPadamName(i + 1);
                var ganaText = GetGanaText(rule.Rules[i], rule.RuleType, rule.InfiniteLength);
                var yatiCell = "";
                if (hasRowWiseYati && rule.Yati![i].Length > 0)
                {
                    var positions = string.Join(", ", rule.Yati[i]);
                    var suffix = GetYatiSuffix(rule.YatiMode, rule.ReverseYati, rule.Yati[i].Length);
                    yatiCell = $"<td class='yati-cell'>యతి: {positions}{suffix}</td>";
                }
                sb.AppendLine($"  <tr><td class='padam-label'>{padamName} పాదం:</td><td>{ganaText}</td>{yatiCell}</tr>");
            }
            sb.AppendLine("</table>");
            sb.AppendLine("</div>");
        }
        else
        {
            var ganaText = GetGanaText(rule.Rules[0], rule.RuleType, rule.InfiniteLength);
            sb.AppendLine("<div class='gana-sequence'>");
            sb.AppendLine($"<strong>గణములు:</strong> {ganaText}");
            sb.AppendLine("</div>");
        }

        // Special rules from RuleText (constraints not expressible in structured properties)
        if (!string.IsNullOrEmpty(rule.RuleText))
        {
            sb.AppendLine("<div class='special-rules'>");
            sb.AppendLine("<strong>ప్రత్యేక నియమములు:</strong>");
            sb.AppendLine($"<div class='special-rules-content'>{rule.RuleText}</div>");
            sb.AppendLine("</div>");
        }

        // Matra details - include count in heading
        if (rule.PadyamType == PadyamType.Vruttam && !rule.RowWiseRules && rule.MatraLength != -1)
        {
            sb.AppendLine("<section class='matra-details'>");
            sb.AppendLine($"<h3>మాత్రా విభజనం ({rule.MatraLength} మాత్రలు)</h3>");
            sb.AppendLine($"<p><strong>స్వరూపం</strong>: {ColorFul(rule.Sequence)}</p>");

            var availableSeries = AvailableSerieses(rule.Sequence);
            if (!string.IsNullOrEmpty(availableSeries))
            {
                sb.AppendLine("<h4>లయ భేదాలు</h4>");
                sb.AppendLine(availableSeries);
            }

            sb.AppendLine("</section>");
        }

        return sb.ToString().TrimEnd();
    }
}
