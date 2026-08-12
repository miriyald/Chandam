using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.JSInterop;
using Microsoft.Extensions.DependencyInjection;
using Chandam.API.Services;
using Chandam.API.Models;
using Chandam.API.Models.Config;
using Chandam.API.Converters;
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

    // Use JsonObject instead of anonymous types to avoid NullabilityInfoContext_NotSupported in WASM
    private static string OkJson(string message) =>
        new JsonObject { ["success"] = true, ["message"] = message }.ToJsonString();

    private static string ErrorJson(string errorMessage) =>
        new JsonObject { ["success"] = false, ["errorMessage"] = errorMessage }.ToJsonString();

    [JSInvokable]
    public static string GetAllRules(string language = "te")
    {
        var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();
        var langEnum = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var rules = ruleLoader.GetAllRules(langEnum);
        var array = new JsonArray();
        foreach (var r in rules)
        {
            array.Add(new JsonObject
            {
                ["identifier"] = r.Identifier,
                ["name"] = r.Name,
                ["padyamType"] = r.PadyamType.ToString(),
                ["padyamSubType"] = r.PadyamSubType.ToString(),
                ["frequency"] = r.Frequency.ToString(),
                ["lines"] = r.Lines
            });
        }
        return array.ToJsonString();
    }

    [JSInvokable]
    public static string GetAllRulesDetailed(string language = "te")
    {
        var langEnum = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var allRules = Manager.Rules();
        var rules = allRules.Where(r => r.Language == langEnum).ToList();

        var resultArray = new JsonArray();
        int skippedCount = 0;

        foreach (var r in rules)
        {
            try
            {
                string compactSummary = "";
                try
                {
                    compactSummary = DescriptionBuilder.BuildCompactSummary(r);
                }
                catch
                {
                    // Non-fatal: rule still appears in list, just without compact summary
                }

                int minVal = -1, maxVal = -1;
                try
                {
                    minVal = r.Min;
                    maxVal = r.Max;
                }
                catch (InvalidCastException)
                {
                    // RowWiseRule types may throw on Min/Max access
                }

                resultArray.Add(new JsonObject
                {
                    ["identifier"] = r.Identifier,
                    ["name"] = r.Name,
                    ["padyamType"] = r.PadyamType.ToString(),
                    ["padyamSubType"] = r.PadyamSubType.ToString(),
                    ["frequency"] = r.Frequency.ToString(),
                    ["lines"] = r.Lines,
                    ["chandamName"] = r.ChandamName,
                    ["charLength"] = r.CharLength,
                    ["matraLength"] = r.MatraLength,
                    ["min"] = minVal,
                    ["max"] = maxVal,
                    ["sequence"] = r.Sequence,
                    ["shortName"] = r.ShortName,
                    ["alias"] = r.Alias,
                    ["compactSummary"] = compactSummary,
                    ["exampleCount"] = r.Examples2?.Length ?? 0
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"WASM: SKIPPING rule '{r.Identifier}' ({r.Name}) - {ex.GetType().Name}: {ex.Message}");
                skippedCount++;
            }
        }

        if (skippedCount > 0)
        {
            Console.WriteLine($"WASM: Skipped {skippedCount} problematic rules, loaded {resultArray.Count} successfully");
        }

        return resultArray.ToJsonString();
    }

    [JSInvokable]
    public static string Determine(string poemText, bool matchYati, bool matchPrasa, string language = "te",
        bool allowSantiPrasa = false, bool soundexSandhi = false)
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var langEnum = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var request = new DetermineRequest {
            PoemText = poemText,
            MatchYati = matchYati,
            MatchPrasa = matchPrasa,
            AllowSantiPrasa = allowSantiPrasa,
            SoundexSandhi = soundexSandhi,
            Language = langEnum,
            RenderFormat = RenderFormat.Html
        };
        var response = service.DetermineWithBeautified(request);
        return JsonSerializer.Serialize(response, WasmJsonContext.Default.DetermineResponse);
    }

    [JSInvokable]
    public static string TryMatch(string poemText, string ruleId, bool matchYati, bool matchPrasa,
        bool allowSantiPrasa = false, bool soundexSandhi = false)
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var request = new TryMatchRequest {
            PoemText = poemText,
            RuleIdentifier = ruleId,
            MatchYati = matchYati,
            MatchPrasa = matchPrasa,
            AllowSantiPrasa = allowSantiPrasa,
            SoundexSandhi = soundexSandhi,
            RenderFormat = RenderFormat.Html
        };
        var response = service.TryMatchWithBeautified(request);
        return JsonSerializer.Serialize(response, WasmJsonContext.Default.TryMatchResponse);
    }

    [JSInvokable]
    public static string GetScores(string poemText, bool matchYati, bool matchPrasa, int minPercentage = 50,
        bool allowSantiPrasa = false, bool soundexSandhi = false)
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var request = new ScoresRequest {
            PoemText = poemText,
            MatchYati = matchYati,
            MatchPrasa = matchPrasa,
            AllowSantiPrasa = allowSantiPrasa,
            SoundexSandhi = soundexSandhi,
            MinimumMatchPercentage = minPercentage
        };
        var response = service.Scores(request);
        return JsonSerializer.Serialize(response, WasmJsonContext.Default.ScoresResponse);
    }

    [JSInvokable]
    public static string GetRuleInfo(string ruleId)
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var request = new GetRuleInfoRequest {
            RuleIdentifier = ruleId,
            IncludeExamples = true,
            DescriptionFormat = RenderFormat.Html  // WASM needs HTML for browser rendering
        };
        var response = service.GetRuleInfo(request);
        return JsonSerializer.Serialize(response, WasmJsonContext.Default.GetRuleInfoResponse);
    }

    [JSInvokable]
    public static string GetRuleDto(string ruleId)
    {
        var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();
        var rule = ruleLoader.FetchRuleFromRuleSet(ruleId);
        if (rule == null) return "null";

        var dto = new JsonObject
        {
            ["Identifier"] = rule.Identifier,
            ["Name"] = rule.Name,
            ["Language"] = rule.Language.ToString(),
            ["PadyamType"] = rule.PadyamType.ToString(),
            ["PadyamSubType"] = rule.PadyamSubType.ToString(),
            ["RuleType"] = rule.RuleType.ToString(),
            ["Frequency"] = rule.Frequency.ToString(),
            ["Lines"] = rule.Lines,
            ["Threshold"] = rule.Threshold,
            ["Prasa"] = rule.Prasa,
            ["PrasaYati"] = rule.PrasaYati,
            ["AnthyaPrasa"] = rule.AnthyaPrasa,
            ["ReverseYati"] = rule.ReverseYati,
            ["OnlyPrasaYati"] = rule.OnlyPrasaYati,
            ["YatiRecycle"] = rule.YatiRecycle,
            ["DeferThresold"] = rule.DeferThresold,
            ["InfiniteLength"] = rule.InfiniteLength
        };

        if (rule.Rules != null)
        {
            var rulesArray = new JsonArray();
            foreach (var row in rule.Rules)
            {
                var rowArray = new JsonArray();
                if (row != null) foreach (var cell in row) rowArray.Add(cell?.ToString() ?? "");
                rulesArray.Add(rowArray);
            }
            dto["Rules"] = rulesArray;
        }

        if (rule.Yati != null)
        {
            var yatiArray = new JsonArray();
            foreach (var row in rule.Yati)
            {
                var rowArray = new JsonArray();
                if (row != null) foreach (var cell in row) rowArray.Add(cell);
                yatiArray.Add(rowArray);
            }
            dto["Yati"] = yatiArray;
        }

        dto["YatiMode"] = rule.YatiMode.ToString();

        if (rule.Examples2 != null && rule.Examples2.Length > 0)
        {
            var examplesArray = new JsonArray();
            foreach (var ex in rule.Examples2)
            {
                var exObj = new JsonObject { ["Text"] = ex.Text ?? "" };
                if (!string.IsNullOrEmpty(ex.Author)) exObj["Author"] = ex.Author;
                if (!string.IsNullOrEmpty(ex.Reference)) exObj["Reference"] = ex.Reference;
                examplesArray.Add(exObj);
            }
            dto["Examples"] = examplesArray;
        }

        return dto.ToJsonString();
    }

    [JSInvokable]
    public static string GetRandomPoem(string ruleId)
    {
        var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();
        var rule = ruleLoader.FetchRuleFromRuleSet(ruleId) ?? Manager.FetchRule(ruleId);

        if (rule?.Examples2 != null && rule.Examples2.Length > 0)
        {
            var random = new Random();
            var example = rule.Examples2[random.Next(rule.Examples2.Length)];
            return new JsonObject { ["text"] = example.Text, ["isGenerated"] = false }.ToJsonString();
        }

        if (PoemGenerator.CanGenerate(rule))
        {
            var generated = PoemGenerator.Generate(rule!);
            if (!string.IsNullOrEmpty(generated))
            {
                return new JsonObject { ["text"] = generated, ["isGenerated"] = true }.ToJsonString();
            }
        }

        return new JsonObject { ["text"] = "", ["isGenerated"] = false }.ToJsonString();
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

            var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();

            // IMPORTANT: Sync Manager back to RuleLoaderService with correct ruleset ID
            // Extract ruleset ID from filename (e.g., "chandam.min.json" → "chandam")
            var ruleSetId = ExtractRuleSetId(rulesFile);
            ruleLoader.SyncFromManager(ruleSetId);

            // Indexes will be rebuilt automatically on next access

            return OkJson("Rules reloaded successfully");
        }
        catch (Exception ex)
        {
            return ErrorJson(ex.Message);
        }
    }

    /// <summary>
    /// Extract ruleset ID from filename
    /// Examples: "chandam.min.json.gz" → "chandam", "topella.json" → "topella"
    /// </summary>
    private static string ExtractRuleSetId(string rulesFile)
    {
        var fileName = System.IO.Path.GetFileNameWithoutExtension(rulesFile);

        // Remove .gz extension if present
        if (fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
        {
            fileName = System.IO.Path.GetFileNameWithoutExtension(fileName);
        }

        // Remove .min suffix if present
        if (fileName.EndsWith(".min", StringComparison.OrdinalIgnoreCase))
        {
            fileName = fileName.Substring(0, fileName.Length - 4);
        }

        return fileName;
    }

    [JSInvokable]
    public static string ReloadRulesFromJson(string rulesJson, string examplesJson)
    {
        try
        {
            var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();

            // Use source-generated context to avoid NullabilityInfoContext_NotSupported in WASM
            var ruleSetDto = JsonSerializer.Deserialize(rulesJson, WasmJsonContext.Default.RuleSetDto);
            Rule[]? rules = null;
            if (ruleSetDto?.Rules != null && ruleSetDto.Rules.Count > 0)
                rules = Chandam.API.Converters.RuleDtoConverter.ConvertToRules(ruleSetDto.Rules);

            if (rules != null && rules.Length > 0)
            {
                // Load examples if provided
                if (!string.IsNullOrEmpty(examplesJson))
                {
                    // Simple merge - this would need proper implementation
                    // For now, just log
                    Console.WriteLine($"WASM: Would merge {examplesJson.Length} bytes of examples");
                }

                Manager.Clear();
                Manager.Register(rules);

                // Sync Manager back to RuleLoaderService
                ruleLoader.SyncFromManager();

                Console.WriteLine($"WASM: Loaded {rules.Length} rules from JSON strings");
            }

            return OkJson($"Loaded {rules?.Length ?? 0} rules");
        }
        catch (Exception ex)
        {
            return ErrorJson(ex.Message);
        }
    }

    [JSInvokable]
    public static string LoadCustomRules(string customRulesJson)
    {
        try
        {
            var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();

            // Use source-generated context to avoid NullabilityInfoContext_NotSupported in WASM
            var ruleSetDto = JsonSerializer.Deserialize(customRulesJson, WasmJsonContext.Default.RuleSetDto);
            if (ruleSetDto == null || ruleSetDto.Rules == null || ruleSetDto.Rules.Count == 0)
            {
                return ErrorJson("Invalid custom ruleset: no rules found");
            }
            var rules = Chandam.API.Converters.RuleDtoConverter.ConvertToRules(ruleSetDto.Rules);

            if (rules == null || rules.Length == 0)
            {
                return ErrorJson("Invalid custom ruleset: no rules found");
            }

            // Enforce max 20 rules limit for custom rulesets (favorites can exceed this)
            // Note: favorites collection is validated client-side at max 50
            if (rules.Length > 50)
            {
                return ErrorJson($"Custom ruleset cannot exceed 50 rules (got {rules.Length})");
            }

            // Clear existing rules and register custom rules
            Manager.Clear();
            Manager.Register(rules);

            // IMPORTANT: Sync Manager back to RuleLoaderService
            // This ensures GetAllRules() returns custom rules, not stale predefined rules
            ruleLoader.SyncFromManager();

            Console.WriteLine($"WASM: Loaded {rules.Length} custom rules");

            return new JsonObject
            {
                ["success"] = true,
                ["message"] = $"Loaded {rules.Length} custom rules",
                ["ruleCount"] = rules.Length
            }.ToJsonString();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"WASM: Failed to load custom rules: {ex.Message}");
            return ErrorJson(ex.Message);
        }
    }

    [JSInvokable]
    public static string SearchRules(
        string? query,
        string? categories,
        string? chandamNames,
        string? frequencies,
        int? matraLengthMin,
        int? matraLengthMax,
        bool? hasExamples,
        int maxResults,
        string language = "te")
    {
        try
        {
            var lang = LanguageCodeMapper.ParseLanguage(language);

            var filters = new RuleSearchFilters
            {
                Query = query,
                Categories = categories?.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(t => t.Trim()).ToList(),
                ChandamNames = chandamNames?.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).ToList(),
                Frequencies = frequencies?.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(f => f.Trim()).ToList(),
                MatraLengthMin = matraLengthMin,
                MatraLengthMax = matraLengthMax,
                HasExamples = hasExamples,
                MaxResults = maxResults
            };

            var searchService = ServiceAccessor.Services!.GetRequiredService<SearchService>();
            var results = searchService.SearchRules(filters, ruleSetId: null, lang);

            return JsonSerializer.Serialize(results, WasmJsonContext.Default.ListRuleSummaryDetailed);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"SearchRules error: {ex.Message}");
            return "[]";
        }
    }

    [JSInvokable]
    public static string GetVersion() => AppVersion.Value;

    [JSInvokable]
    public static string GetBuildDate() => AppBuildDate.Value;

    [JSInvokable]
    public static string GetAvailableFilters(string language = "te")
    {
        try
        {
            var lang = LanguageCodeMapper.ParseLanguage(language);
            var searchService = ServiceAccessor.Services!.GetRequiredService<SearchService>();
            var filters = searchService.GetAvailableFilters(ruleSetId: null, lang);

            return JsonSerializer.Serialize(filters, WasmJsonContext.Default.AvailableFilters);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"GetAvailableFilters error: {ex.Message}");
            return "{}";
        }
    }
}

// Static accessor for DI services
internal static class ServiceAccessor
{
    public static IServiceProvider? Services { get; set; }
}
