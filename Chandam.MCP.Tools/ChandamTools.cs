using System.ComponentModel;
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

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public ChandamTools(ChandamService service, RuleLoaderService ruleLoader, DictionaryService dictionaryService)
    {
        _service = service;
        _ruleLoader = ruleLoader;
        _dictionaryService = dictionaryService;
    }

    [McpServerTool, Description("Auto-detect the best matching Chandam (meter/prosody) for a Telugu/Sanskrit poem. Returns the closest matching meter with confidence percentage.")]
    public string DetermineChandam(
        [Description("The poem text to analyze (Telugu/Sanskrit/Kannada)")] string poem_text,
        [Description("Check caesura (yati) matching")] bool match_yati = true,
        [Description("Check rhyme (prasa) matching")] bool match_prasa = true,
        [Description("Language code: te (Telugu), kn (Kannada), sa (Sanskrit), hi (Hindi), ml (Malayalam)")] string language = "te")
    {
        var lang = LanguageCodeMapper.ParseLanguage(language) ?? Rules.RuleLanguage.Telugu;
        var request = new DetermineRequest
        {
            PoemText = poem_text,
            MatchYati = match_yati,
            MatchPrasa = match_prasa,
            Language = lang
        };
        var result = _service.Determine(request);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Match a poem against a specific Chandam rule. Use this when you know which meter to test against.")]
    public string TryMatchChandam(
        [Description("The poem text to analyze")] string poem_text,
        [Description("Rule identifier (e.g., 'kandam', 'utpalamaala', 'iMdravajramu')")] string rule_identifier,
        [Description("Check caesura (yati) matching")] bool match_yati = true,
        [Description("Check rhyme (prasa) matching")] bool match_prasa = true)
    {
        var request = new TryMatchRequest
        {
            PoemText = poem_text,
            RuleIdentifier = rule_identifier,
            MatchYati = match_yati,
            MatchPrasa = match_prasa
        };
        var result = _service.TryMatch(request);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Calculate match scores for a poem against all known Chandam rules. Returns a ranked list of all matching meters.")]
    public string CalculateScores(
        [Description("The poem text to analyze")] string poem_text,
        [Description("Check caesura (yati) matching")] bool match_yati = true,
        [Description("Check rhyme (prasa) matching")] bool match_prasa = true,
        [Description("Language code: te, kn, sa, hi, ml")] string language = "te",
        [Description("Minimum match percentage to include in results (0-100)")] double min_percentage = 0)
    {
        var lang = LanguageCodeMapper.ParseLanguage(language);
        var request = new ScoresRequest
        {
            PoemText = poem_text,
            MatchYati = match_yati,
            MatchPrasa = match_prasa,
            Language = lang,
            MinimumMatchPercentage = min_percentage
        };
        var result = _service.Scores(request);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Get detailed information about a specific Chandam rule including its pattern, description, and optionally examples.")]
    public string GetRuleInfo(
        [Description("Rule identifier (e.g., 'kandam', 'utpalamaala')")] string rule_identifier,
        [Description("Include example poems in the response")] bool include_examples = false)
    {
        var request = new GetRuleInfoRequest
        {
            RuleIdentifier = rule_identifier,
            IncludeExamples = include_examples
        };
        var result = _service.GetRuleInfo(request);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Get example poems for a specific Chandam rule, with author and reference information.")]
    public string GetExamples(
        [Description("Rule identifier (e.g., 'kandam', 'utpalamaala')")] string rule_identifier,
        [Description("Maximum number of examples to return (0 = all)")] int max_examples = 5)
    {
        var request = new GetSamplesRequest
        {
            RuleIdentifier = rule_identifier,
            MaxExamples = max_examples
        };
        var result = _service.GetSamples(request);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("List all available Chandam rules. Filter by language to see rules for a specific language.")]
    public string ListRules(
        [Description("Language code filter: te (Telugu), kn (Kannada), sa (Sanskrit), hi (Hindi), ml (Malayalam)")] string language = "te")
    {
        var lang = LanguageCodeMapper.ParseLanguage(language);
        var allRules = _ruleLoader.GetAllRules(lang);

        var ruleList = allRules.Select(r => new
        {
            r.Identifier,
            r.Name,
            PadyamType = r.PadyamType.ToString(),
            PadyamSubType = r.PadyamSubType.ToString(),
            Frequency = r.Frequency.ToString(),
            r.Lines
        });

        return JsonSerializer.Serialize(ruleList, JsonOptions);
    }

    [McpServerTool, Description("Look up the meaning of a Telugu word from multiple dictionary sources (Andhrabharati, Wiktionary, Shabdkosh). Returns definitions from all available sources.")]
    public async Task<string> GetWordMeaning(
        [Description("The Telugu word to look up")] string word)
    {
        var results = await _dictionaryService.LookupAsync(word);
        return JsonSerializer.Serialize(results, JsonOptions);
    }
}
