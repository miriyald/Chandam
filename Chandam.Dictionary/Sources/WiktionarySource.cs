using System.Text.Json;
using Chandam.Dictionary.Helpers;
using Chandam.Dictionary.Models;

namespace Chandam.Dictionary.Sources;

/// <summary>
/// Port of Crawler/api/sources/wiktionary.py lines 19-95.
/// Fetches from both Telugu and English Wiktionary in parallel.
/// </summary>
public class WiktionarySource : IDictionarySource
{
    // Lines 19-20
    private const string TeApi = "https://te.wiktionary.org/w/api.php";
    private const string EnApi = "https://en.wiktionary.org/w/api.php";

    private readonly HttpClient _httpClient;

    public string SourceName => "wiktionary";

    public WiktionarySource(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient("wiktionary");
    }

    public async Task<DictionaryResult> LookupAsync(string word)
    {
        try
        {
            // Line 55: fetch Telugu + English in parallel
            var teTask = FetchParseAsync(TeApi, word);
            var enTask = FetchParseAsync(EnApi, word);
            var results = await Task.WhenAll(teTask, enTask);
            var teHtml = results[0];
            var enHtml = results[1];

            if (string.IsNullOrEmpty(teHtml) && string.IsNullOrEmpty(enHtml))
            {
                return CreateResult(word, "not_found", error: "Word not found in Wiktionary");
            }

            // Lines 67-76: combine results
            var parts = new List<string>();
            if (!string.IsNullOrEmpty(teHtml))
                parts.Add($"<div class=\"te-wiktionary\">{teHtml}</div>");
            if (!string.IsNullOrEmpty(enHtml))
                parts.Add($"<div class=\"en-wiktionary\">{enHtml}</div>");

            var combined = string.Join("\n", parts);
            return CreateResult(word, "success", content: HtmlCleaner.StripHtml(combined));
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
    /// Lines 32-45: fetch parsed HTML from a Wiktionary API.
    /// URL: {api_url}?action=parse&amp;page={word}&amp;prop=text&amp;format=json
    /// Response path: data["parse"]["text"]["*"]
    /// </summary>
    private async Task<string> FetchParseAsync(string apiUrl, string word)
    {
        var encoded = Uri.EscapeDataString(word);
        var url = $"{apiUrl}?action=parse&page={encoded}&prop=text&format=json";

        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
            return string.Empty;

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        if (doc.RootElement.TryGetProperty("parse", out var parse) &&
            parse.TryGetProperty("text", out var text) &&
            text.TryGetProperty("*", out var html))
        {
            return html.GetString() ?? string.Empty;
        }

        return string.Empty;
    }

    private DictionaryResult CreateResult(string word, string status, string? content = null, string? error = null) =>
        new() { Source = SourceName, Word = word, Status = status, Content = content, Error = error };
}
