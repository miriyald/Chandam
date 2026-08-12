using System.ComponentModel;
using System.Linq;
using System.Text.Json;
using Chandam.API.Helpers;
using Chandam.API.Models;
using Chandam.API.Services;
using Chandam.Dictionary.Services;
using ModelContextProtocol.Server;

namespace Chandam.MCP.Tools;

[McpServerToolType]
public class ChandamTools
{
    private readonly ChandamService _service;
    private readonly RuleLoaderService _ruleLoader;
    private readonly DictionaryService _dictionaryService;
    private readonly SearchService _searchService;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public ChandamTools(ChandamService service, RuleLoaderService ruleLoader, DictionaryService dictionaryService, SearchService searchService)
    {
        _service = service;
        _ruleLoader = ruleLoader;
        _dictionaryService = dictionaryService;
        _searchService = searchService;
    }

    [McpServerTool, Description("Auto-detect the best matching Chandam (meter/prosody) for a Telugu/Sanskrit poem. Returns matches with both Markdown summary and beautified HTML for display.")]
    public string DetermineChandam(
        [Description("The poem text to analyze (Telugu/Sanskrit/Kannada)")] string poem_text,
        [Description("Check caesura (yati) matching")] bool match_yati = true,
        [Description("Check rhyme (prasa) matching")] bool match_prasa = true,
        [Description("Allow Santi Prasa - first or last consonant may match. Requires match_yati")] bool match_santi_prasa = false,
        [Description("Allow sound-based Sandhi at Yati position. Requires match_yati")] bool match_soundex_sandhi = false,
        [Description("Language code: te (Telugu), kn (Kannada), sa (Sanskrit), hi (Hindi), ml (Malayalam)")] string language = "te",
        [Description("RuleSet to use: chandam, sanskrit, topella (default: chandam)")] string? ruleset_id = null)
    {
        var lang = LanguageCodeMapper.ParseLanguage(language) ?? Rules.RuleLanguage.Telugu;
        var request = new DetermineRequest
        {
            PoemText = poem_text,
            MatchYati = match_yati,
            MatchPrasa = match_prasa,
            AllowSantiPrasa = match_santi_prasa,
            SoundexSandhi = match_soundex_sandhi,
            Language = lang,
            RenderFormat = RenderFormat.Markdown,  // Request Markdown format
            RuleSetId = ruleset_id ?? "chandam"
        };
        // Call new combined method that returns BOTH Markdown and Beautified
        var result = _service.DetermineWithBeautified(request);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Match a poem against a specific Chandam rule. Returns match with both Markdown summary and beautified HTML for display.")]
    public string TryMatchChandam(
        [Description("The poem text to analyze")] string poem_text,
        [Description("Rule identifier (e.g., 'kandam', 'utpalamaala', 'iMdravajramu')")] string rule_identifier,
        [Description("Check caesura (yati) matching")] bool match_yati = true,
        [Description("Check rhyme (prasa) matching")] bool match_prasa = true,
        [Description("Allow Santi Prasa - first or last consonant may match. Requires match_yati")] bool match_santi_prasa = false,
        [Description("Allow sound-based Sandhi at Yati position. Requires match_yati")] bool match_soundex_sandhi = false,
        [Description("Language code: te (Telugu), kn (Kannada), sa (Sanskrit), hi (Hindi), ml (Malayalam)")] string language = "te",
        [Description("RuleSet to use: chandam, sanskrit, topella (default: chandam)")] string? ruleset_id = null)
    {
        var lang = LanguageCodeMapper.ParseLanguage(language) ?? Rules.RuleLanguage.Telugu;
        var request = new TryMatchRequest
        {
            PoemText = poem_text,
            RuleIdentifier = rule_identifier,
            MatchYati = match_yati,
            MatchPrasa = match_prasa,
            AllowSantiPrasa = match_santi_prasa,
            SoundexSandhi = match_soundex_sandhi,
            Language = lang,
            RenderFormat = RenderFormat.Markdown,  // Request Markdown format
            RuleSetId = ruleset_id ?? "chandam"
        };
        // Call new combined method that returns BOTH Markdown and Beautified
        var result = _service.TryMatchWithBeautified(request);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Calculate match scores for a poem against all known Chandam rules. Returns a ranked list of all matching meters.")]
    public string CalculateScores(
        [Description("The poem text to analyze")] string poem_text,
        [Description("Check caesura (yati) matching")] bool match_yati = true,
        [Description("Check rhyme (prasa) matching")] bool match_prasa = true,
        [Description("Allow Santi Prasa - first or last consonant may match. Requires match_yati")] bool match_santi_prasa = false,
        [Description("Allow sound-based Sandhi at Yati position. Requires match_yati")] bool match_soundex_sandhi = false,
        [Description("Language code: te, kn, sa, hi, ml")] string language = "te",
        [Description("Minimum match percentage to include in results (0-100)")] double min_percentage = 0,
        [Description("RuleSet to use: chandam, sanskrit, topella (default: chandam)")] string? ruleset_id = null)
    {
        var lang = LanguageCodeMapper.ParseLanguage(language);
        var request = new ScoresRequest
        {
            PoemText = poem_text,
            MatchYati = match_yati,
            MatchPrasa = match_prasa,
            AllowSantiPrasa = match_santi_prasa,
            SoundexSandhi = match_soundex_sandhi,
            Language = lang,
            MinimumMatchPercentage = min_percentage,
            RuleSetId = ruleset_id ?? "chandam"
        };
        var result = _service.Scores(request);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Get detailed information about a specific Chandam rule including its pattern, description, and optionally examples.")]
    public string GetRuleInfo(
        [Description("Rule identifier (e.g., 'kandam', 'utpalamaala')")] string rule_identifier,
        [Description("Include example poems in the response")] bool include_examples = false,
        [Description("RuleSet to use: chandam, sanskrit, topella (default: chandam)")] string? ruleset_id = null)
    {
        var request = new GetRuleInfoRequest
        {
            RuleIdentifier = rule_identifier,
            IncludeExamples = include_examples,
            RuleSetId = ruleset_id ?? "chandam"
        };
        var result = _service.GetRuleInfo(request);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Get example poems for a specific Chandam rule, with author and reference information.")]
    public string GetExamples(
        [Description("Rule identifier (e.g., 'kandam', 'utpalamaala')")] string rule_identifier,
        [Description("Maximum number of examples to return (0 = all)")] int max_examples = 5,
        [Description("RuleSet to use: chandam, sanskrit, topella (default: chandam)")] string? ruleset_id = null,
        [Description("Include machine-generated example if no real examples exist (Vruttam only)")] bool include_generated = true)
    {
        var request = new GetSamplesRequest
        {
            RuleIdentifier = rule_identifier,
            MaxExamples = max_examples,
            RuleSetId = ruleset_id ?? "chandam",
            IncludeGenerated = include_generated
        };
        var result = _service.GetSamples(request);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("List all available Chandam rules. Filter by language to see rules for a specific language.")]
    public string ListRules(
        [Description("Language code filter: te (Telugu), kn (Kannada), sa (Sanskrit), hi (Hindi), ml (Malayalam)")] string language = "te",
        [Description("RuleSet to use: chandam, sanskrit, topella (default: chandam)")] string? ruleset_id = null)
    {
        var ruleSetId = ruleset_id ?? "chandam";
        if (!string.IsNullOrEmpty(ruleSetId) && ruleSetId != _ruleLoader.GetCurrentRuleSetId())
        {
            if (!_ruleLoader.SetActiveRuleSet(ruleSetId))
            {
                ruleSetId = "chandam";
                _ruleLoader.SetActiveRuleSet(ruleSetId);
            }
        }

        var lang = LanguageCodeMapper.ParseLanguage(language);
        var allRules = _ruleLoader.GetAllRules(lang);

        var grouped = allRules
            .GroupBy(r => r.PadyamType.ToString())
            .OrderBy(g => g.Key)
            .Select(typeGroup => new
            {
                Type = typeGroup.Key,
                SubTypes = typeGroup
                    .GroupBy(r => r.PadyamSubType.ToString())
                    .OrderBy(sg => sg.Key == "GenricVruttam" ? 1 : 0)
                    .ThenBy(sg => sg.Key)
                    .Select(subGroup => new
                    {
                        SubType = subGroup.Key,
                        Rules = subGroup
                            .GroupBy(r => r.ChandamName ?? "")
                            .OrderBy(cg => cg.Key)
                            .Select(chandamGroup => new
                            {
                                ChandamName = chandamGroup.Key,
                                Items = chandamGroup.Select(r => new
                                {
                                    r.Name,
                                    r.Identifier
                                }).OrderBy(r => r.Name).ToArray()
                            }).ToArray()
                    }).ToArray()
            });

        return JsonSerializer.Serialize(grouped, JsonOptions);
    }

    [McpServerTool, Description("Look up the meaning of a Telugu word from multiple dictionary sources (Andhrabharati, Wiktionary, Shabdkosh). Returns definitions from all available sources.")]
    public async Task<string> GetWordMeaning(
        [Description("The Telugu word to look up")] string word)
    {
        var results = await _dictionaryService.LookupAsync(word);
        return JsonSerializer.Serialize(results, JsonOptions);
    }

    [McpServerTool, Description("Search for Chandam rules by name, identifier, or characteristics")]
    public string SearchRules(
        [Description("Search term for Telugu rule name (optional)")] string? query = null,
        [Description("Language code: te (Telugu), kn (Kannada), sa (Sanskrit), hi (Hindi), ml (Malayalam)")] string language = "te",
        [Description("Filter by PadyamSubType categories (comma-separated): Akkara, Divpada, Jati, Ragada, Vruttam, etc. (optional)")] string? categories = null,
        [Description("Filter by ChandamName for Vruttam (comma-separated): గాయత్రి, త్రిష్టుప్పు, అనుష్టుప్, etc. (optional)")] string? chandam_names = null,
        [Description("Filter by frequency (comma-separated): Frequent, Rare (optional)")] string? frequencies = null,
        [Description("Minimum matra length (optional, -1 excluded)")] int? matra_length_min = null,
        [Description("Maximum matra length (optional, -1 excluded)")] int? matra_length_max = null,
        [Description("Filter by examples: true=with examples, false=without, null=all (optional)")] bool? has_examples = null,
        [Description("Maximum results to return (0 = unlimited)")] int max_results = 20,
        [Description("RuleSet to use: chandam, sanskrit, topella (default: chandam)")] string? ruleset_id = null)
    {
        try
        {
            var lang = LanguageCodeMapper.ParseLanguage(language);

            var filters = new RuleSearchFilters
            {
                Query = query,
                Categories = categories?.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(t => t.Trim()).ToList(),
                ChandamNames = chandam_names?.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).ToList(),
                Frequencies = frequencies?.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(f => f.Trim()).ToList(),
                MatraLengthMin = matra_length_min,
                MatraLengthMax = matra_length_max,
                HasExamples = has_examples,
                MaxResults = max_results
            };

            var results = _searchService.SearchRules(filters, ruleset_id, lang);

            var response = new
            {
                Success = true,
                Count = results.Count,
                Results = results.Select(r => new
                {
                    r.Identifier,
                    r.Name,
                    r.PadyamType,
                    r.PadyamSubType,
                    r.Frequency,
                    r.Lines,
                    r.ChandamName,
                    r.CharLength,
                    r.MatraLength,
                    r.ExampleCount
                })
            };

            return JsonSerializer.Serialize(response, JsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new
            {
                Success = false,
                ErrorMessage = ex.Message
            }, JsonOptions);
        }
    }
}
