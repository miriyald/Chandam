using Chandam.Dictionary.Helpers;
using Chandam.Dictionary.Models;

namespace Chandam.Dictionary.Sources;

/// <summary>
/// Port of Crawler/api/sources/andhrabharati_httpx.py lines 10-105.
/// POST to https://andhrabharati.com/dictionary/getWM.php
/// </summary>
public class AndhrabharatiSource : IDictionarySource
{
    private const string GetwmUrl = "https://andhrabharati.com/dictionary/getWM.php";

    // Lines 38-43: pipe-delimited dictionary IDs
    private const string DictsPipe =
        "2|6|7|8|35|50|10|13|14|29|52|1|11|4|12|51" +
        "|48|49|43|55|54|56|34|44|58|17|18|19|20|21" +
        "|22|23|24|25|33|15|41|31|32|3|39|38|40|42" +
        "|45|46|47";

    private readonly HttpClient _httpClient;

    public string SourceName => "andhrabharati";

    public AndhrabharatiSource(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient("andhrabharati");
    }

    public async Task<DictionaryResult> LookupAsync(string word)
    {
        try
        {
            // Lines 56-61: form data
            var opt = $"W|X|N|Y|{DictsPipe}";
            var formData = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("w", word),
                new KeyValuePair<string, string>("token", ""),
                new KeyValuePair<string, string>("opt", opt),
            });

            var response = await _httpClient.PostAsync(GetwmUrl, formData);

            if (!response.IsSuccessStatusCode)
            {
                return CreateResult(word, "error", error: $"HTTP {(int)response.StatusCode}");
            }

            var html = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrWhiteSpace(html))
            {
                return CreateResult(word, "not_found", error: "No results found");
            }

            return CreateResult(word, "success", content: HtmlCleaner.StripHtml(html));
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

    private DictionaryResult CreateResult(string word, string status, string? content = null, string? error = null) =>
        new() { Source = SourceName, Word = word, Status = status, Content = content, Error = error };
}
