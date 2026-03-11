using System.Text.RegularExpressions;
using HtmlAgilityPack;

namespace Chandam.Dictionary.Helpers;

/// <summary>
/// Ports strip_html() from Crawler/api/sources/base.py lines 10-41.
/// </summary>
public static class HtmlCleaner
{
    public static string StripHtml(string html)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        // 1. Remove script, style, meta, link, noscript tags (base.py:15-16)
        RemoveNodes(doc, "//script | //style | //meta | //link | //noscript");

        // 2. Remove Wiktionary edit links: .mw-editsection (base.py:19-20)
        RemoveNodes(doc, "//*[contains(@class,'mw-editsection')]");

        // 3. Get text with newline separator for block elements (base.py:23)
        var text = GetTextWithNewlines(doc.DocumentNode);

        // 4. Remove leftover wiki edit brackets (base.py:26-28)
        text = Regex.Replace(text, @"\[\s*edit\s*\]", "");
        text = Regex.Replace(text, @"\[\s*<?\s*small\s*>?\s*మార్చు\s*<?\s*/?\s*small\s*>?\s*\]", "");
        text = Regex.Replace(text, @"\[\s*మార్చు\s*\]", "");

        // 5. Remove x close-button artifacts (base.py:31)
        text = Regex.Replace(text, @"^×\s*$", "", RegexOptions.Multiline);

        // 6. Collapse 3+ newlines into 2 (base.py:34)
        text = Regex.Replace(text, @"\n{3,}", "\n\n");

        // 7. Strip each line, trim result (base.py:37-41)
        var lines = text.Split('\n').Select(l => l.Trim());
        text = string.Join("\n", lines);

        return text.Trim();
    }

    private static void RemoveNodes(HtmlDocument doc, string xpath)
    {
        var nodes = doc.DocumentNode.SelectNodes(xpath);
        if (nodes == null) return;
        foreach (var node in nodes.ToList())
            node.Remove();
    }

    private static string GetTextWithNewlines(HtmlNode node)
    {
        if (node.NodeType == HtmlNodeType.Text)
            return node.InnerText;

        var blockTags = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "div", "p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
            "li", "ul", "ol", "tr", "table", "blockquote", "pre", "hr",
            "section", "article", "header", "footer", "nav", "dd", "dt"
        };

        var sb = new System.Text.StringBuilder();
        foreach (var child in node.ChildNodes)
        {
            if (blockTags.Contains(child.Name))
            {
                sb.Append('\n');
                sb.Append(GetTextWithNewlines(child));
                sb.Append('\n');
            }
            else
            {
                sb.Append(GetTextWithNewlines(child));
            }
        }
        return sb.ToString();
    }
}
