using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.JSInterop;
using Microsoft.Extensions.DependencyInjection;
using Chandam.API.Services;
using Chandam.API.Models;
using Chandam.API.Helpers;
using Chandam.Rules;
using Chandam.Wasm.Services;

namespace Chandam.Wasm;

public static class JsBridge
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    [JSInvokable]
    public static string GetAllRules(string language = "te")
    {
        var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();
        var langEnum = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var rules = ruleLoader.GetAllRules(langEnum);
        var summary = rules.Select(r => new {
            r.Identifier,
            r.Name,
            PadyamType = r.PadyamType.ToString(),
            PadyamSubType = r.PadyamSubType.ToString(),
            Frequency = r.Frequency.ToString(),
            r.Lines
        });
        return JsonSerializer.Serialize(summary, JsonOptions);
    }

    [JSInvokable]
    public static string GetAllRulesDetailed(string language = "te")
    {
        var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();
        var langEnum = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var rules = ruleLoader.GetAllRules(langEnum);
        var detailed = rules.Select(r => new {
            r.Identifier,
            r.Name,
            PadyamType = r.PadyamType.ToString(),
            PadyamSubType = r.PadyamSubType.ToString(),
            Frequency = r.Frequency.ToString(),
            r.Lines,
            r.ChandamName,
            r.CharLength,
            r.MatraLength,
            r.Sequence,
            r.ShortName,
            r.Alias
        });
        return JsonSerializer.Serialize(detailed, JsonOptions);
    }

    [JSInvokable]
    public static string Determine(string poemText, bool matchYati, bool matchPrasa, string language = "te")
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var langEnum = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var request = new DetermineRequest {
            PoemText = poemText,
            MatchYati = matchYati,
            MatchPrasa = matchPrasa,
            Language = langEnum,
            RenderFormat = RenderFormat.Html
        };
        var response = service.Determine(request);
        return JsonSerializer.Serialize(response, JsonOptions);
    }

    [JSInvokable]
    public static string TryMatch(string poemText, string ruleId, bool matchYati, bool matchPrasa)
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var request = new TryMatchRequest {
            PoemText = poemText,
            RuleIdentifier = ruleId,
            MatchYati = matchYati,
            MatchPrasa = matchPrasa,
            RenderFormat = RenderFormat.Html
        };
        var response = service.TryMatch(request);
        return JsonSerializer.Serialize(response, JsonOptions);
    }

    [JSInvokable]
    public static string GetScores(string poemText, bool matchYati, bool matchPrasa, int minPercentage = 50)
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var request = new ScoresRequest {
            PoemText = poemText,
            MatchYati = matchYati,
            MatchPrasa = matchPrasa,
            MinimumMatchPercentage = minPercentage
        };
        var response = service.Scores(request);
        return JsonSerializer.Serialize(response, JsonOptions);
    }

    [JSInvokable]
    public static string GetRuleInfo(string ruleId)
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var request = new GetRuleInfoRequest {
            RuleIdentifier = ruleId,
            IncludeExamples = true
        };
        var response = service.GetRuleInfo(request);
        return JsonSerializer.Serialize(response, JsonOptions);
    }

    [JSInvokable]
    public static string GetRandomPoem(string ruleId)
    {
        var rule = Manager.FetchRule(ruleId);
        if (rule?.Examples2 != null && rule.Examples2.Length > 0)
        {
            var random = new Random();
            var example = rule.Examples2[random.Next(rule.Examples2.Length)];
            return example.Text;
        }
        return string.Empty;
    }

    [JSInvokable]
    public static string GetRandomPoemFromRuleSet(string language = "te")
    {
        var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();
        var langEnum = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var rules = ruleLoader.GetAllRules(langEnum);

        // Collect all examples from all rules
        var allExamples = rules
            .Where(r => r.Examples2 != null && r.Examples2.Length > 0)
            .SelectMany(r => r.Examples2)
            .ToArray();

        if (allExamples.Length > 0)
        {
            var random = new Random();
            var example = allExamples[random.Next(allExamples.Length)];
            return example.Text;
        }
        return string.Empty;
    }

    [JSInvokable]
    public static async Task<string> ReloadRules(string rulesFile, string examplesFile)
    {
        try
        {
            var wasmLoader = ServiceAccessor.Services!.GetRequiredService<WasmRuleLoaderService>();
            await wasmLoader.LoadRuleSetAsync(rulesFile, examplesFile);
            return JsonSerializer.Serialize(new { success = true, message = "Rules reloaded successfully" }, JsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { success = false, errorMessage = ex.Message }, JsonOptions);
        }
    }
}

// Static accessor for DI services
internal static class ServiceAccessor
{
    public static IServiceProvider? Services { get; set; }
}
