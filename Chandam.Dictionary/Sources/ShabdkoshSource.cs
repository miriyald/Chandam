using HtmlAgilityPack;
using Chandam.Dictionary.Helpers;
using Chandam.Dictionary.Models;

namespace Chandam.Dictionary.Sources;

/// <summary>
/// Port of Crawler/api/sources/shabdkosh.py lines 20-130.
/// GET https://www.shabdkosh.com/search-dictionary?lc=te&amp;sl=en&amp;tl=te&amp;e={word}
/// </summary>
public class ShabdkoshSource : IDictionarySource
{
    // Lines 21-31: text markers where we truncate
    private static readonly string[] CutMarkers =
    [
        "Sentences with the word",
        "What is another word",
        "Words starting with",
        "Words ending with",
        "Browse top entries",
        "SHABDKOSH Apps",
        "Tags for the entry",
        "meaning in English?",
        "meaning in Telugu?",
    ];

    // Lines 34-40: lines to strip from output
    private static readonly HashSet<string> NoiseLines = new()
    {
        "Meaning", "Inflections", "Definition", "Synonyms", "Description",
        "More matches", "Also See", "Word Finder", "Browse",
        "Advertisement -", "Remove", "Practice", "Transliterate",
        "View More", "Examples", "Thesaurus", "Rhymes",
        "Popularity:", "Difficulty:",
    };

    private readonly HttpClient _httpClient;

    public string SourceName => "shabdkosh";

    public ShabdkoshSource(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient("shabdkosh");
    }

    public async Task<DictionaryResult> LookupAsync(string word)
    {
        try
        {
            // Lines 79-82
            var encoded = Uri.EscapeDataString(word);
            var url = $"https://www.shabdkosh.com/search-dictionary?lc=te&sl=en&tl=te&e={encoded}";

            var response = await _httpClient.GetAsync(url);

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return CreateResult(word, "not_found", error: "Word not found in Shabdkosh");
            }

            if (!response.IsSuccessStatusCode)
            {
                return CreateResult(word, "error", error: $"HTTP {(int)response.StatusCode}");
            }

            var html = await response.Content.ReadAsStringAsync();
            var content = ExtractContent(html);

            if (string.IsNullOrWhiteSpace(content))
            {
                return CreateResult(word, "not_found", error: "No results found");
            }

            return CreateResult(word, "success", content: content);
        }
        catch (TaskCanceledException)
        {
            return CreateResult(word, "error", error: "Request timeout");
        }
        catch (Exception ex)
        {
            return CreateResult(word, "error", error: $"Error: {ex.Message}");
        }
    }

    /// <summary>
    /// Port of _extract_content() from shabdkosh.py lines 43-67.
    /// </summary>
    private static string ExtractContent(string html)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        // Lines 46-49: select #ehresults, fallback to #content
        var results = doc.GetElementbyId("ehresults")
                     ?? doc.GetElementbyId("content");

        if (results == null)
            return HtmlCleaner.StripHtml(html);

        // Lines 53-54: remove script/style/ad elements
        var toRemove = results.SelectNodes(".//script | .//style | .//noscript | .//*[contains(@class,'ad')] | .//*[contains(@class,'ads')]");
        if (toRemove != null)
        {
            foreach (var node in toRemove.ToList())
                node.Remove();
        }

        // Lines 57-62: get text and truncate at noise markers
        var text = results.InnerText;
        foreach (var marker in CutMarkers)
        {
            var idx = text.IndexOf(marker, StringComparison.Ordinal);
            if (idx != -1)
            {
                text = text[..idx];
                break;
            }
        }

        // Lines 65-67: clean up lines
        var lines = text.Split('\n')
            .Select(l => l.Trim())
            .Where(l => !string.IsNullOrEmpty(l) && !NoiseLines.Contains(l))
            .ToList();

        return string.Join("\n", lines);
    }

    private DictionaryResult CreateResult(string word, string status, string? content = null, string? error = null) =>
        new() { Source = SourceName, Word = word, Status = status, Content = content, Error = error };
}
