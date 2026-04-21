using System;
using System.Collections.Generic;
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
        var langEnum = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var allRules = Manager.Rules();
        var rules = allRules.Where(r => r.Language == langEnum).ToList();

        var resultList = new List<object>();
        int skippedCount = 0;

        foreach (var r in rules)
        {
            try
            {
                var detail = new {
                    r.Identifier,
                    r.Name,
                    PadyamType = r.PadyamType.ToString(),
                    PadyamSubType = r.PadyamSubType.ToString(),
                    Frequency = r.Frequency.ToString(),
                    r.Lines,
                    r.ChandamName,
                    r.CharLength,
                    r.MatraLength,
                    Min = r.Min,  // This line might throw
                    Max = r.Max,  // This line might throw
                    r.Sequence,
                    r.ShortName,
                    r.Alias
                };
                resultList.Add(detail);
            }
            catch (InvalidCastException ex)
            {
                Console.WriteLine($"WASM: SKIPPING rule '{r.Identifier}' ({r.Name}) - InvalidCastException: {ex.Message}");
                if (r.Rules != null && r.Rules.Length > 0 && r.Rules[0] != null && r.Rules[0].Length > 0)
                {
                    var firstElem = r.Rules[0][0];
                    Console.WriteLine($"  RuleType={r.RuleType}, First element type: {firstElem?.GetType().Name ?? "null"}");
                    Console.WriteLine($"  First element value: {firstElem}");
                }
                skippedCount++;
                // Don't re-throw - skip this rule and continue
            }
            catch (Exception ex)
            {
                Console.WriteLine($"WASM: SKIPPING rule '{r.Identifier}' ({r.Name}) - {ex.GetType().Name}: {ex.Message}");
                skippedCount++;
                // Don't re-throw - skip this rule and continue
            }
        }

        if (skippedCount > 0)
        {
            Console.WriteLine($"WASM: Skipped {skippedCount} problematic rules, loaded {resultList.Count} successfully");
        }

        return JsonSerializer.Serialize(resultList, JsonOptions);
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
        var response = service.DetermineWithBeautified(request);
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
        var response = service.TryMatchWithBeautified(request);
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
            IncludeExamples = true,
            DescriptionFormat = RenderFormat.Html  // WASM needs HTML for browser rendering
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

            var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();

            // IMPORTANT: Sync Manager back to RuleLoaderService with correct ruleset ID
            // Extract ruleset ID from filename (e.g., "chandam.min.json" → "chandam")
            var ruleSetId = ExtractRuleSetId(rulesFile);
            ruleLoader.SyncFromManager(ruleSetId);

            // Indexes will be rebuilt automatically on next access

            return JsonSerializer.Serialize(new { success = true, message = "Rules reloaded successfully" }, JsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { success = false, errorMessage = ex.Message }, JsonOptions);
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
            var rules = ruleLoader.LoadFromJsonString(rulesJson);

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

            return JsonSerializer.Serialize(new { success = true, message = $"Loaded {rules?.Length ?? 0} rules"}, JsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { success = false, errorMessage = ex.Message }, JsonOptions);
        }
    }

    [JSInvokable]
    public static string LoadCustomRules(string customRulesJson)
    {
        try
        {
            var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();
            var rules = ruleLoader.LoadFromJsonString(customRulesJson);

            if (rules == null || rules.Length == 0)
            {
                return JsonSerializer.Serialize(new {
                    success = false,
                    errorMessage = "Invalid custom ruleset: no rules found"
                }, JsonOptions);
            }

            // Enforce max 20 rules limit for custom rulesets (favorites can exceed this)
            // Note: favorites collection is validated client-side at max 50
            if (rules.Length > 50)
            {
                return JsonSerializer.Serialize(new {
                    success = false,
                    errorMessage = $"Custom ruleset cannot exceed 50 rules (got {rules.Length})"
                }, JsonOptions);
            }

            // Clear existing rules and register custom rules
            Manager.Clear();
            Manager.Register(rules);

            // IMPORTANT: Sync Manager back to RuleLoaderService
            // This ensures GetAllRules() returns custom rules, not stale predefined rules
            ruleLoader.SyncFromManager();

            Console.WriteLine($"WASM: Loaded {rules.Length} custom rules");

            return JsonSerializer.Serialize(new {
                success = true,
                message = $"Loaded {rules.Length} custom rules",
                ruleCount = rules.Length
            }, JsonOptions);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"WASM: Failed to load custom rules: {ex.Message}");
            return JsonSerializer.Serialize(new {
                success = false,
                errorMessage = ex.Message
            }, JsonOptions);
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

            return JsonSerializer.Serialize(results, JsonOptions);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"SearchRules error: {ex.Message}");
            return JsonSerializer.Serialize(new List<object>(), JsonOptions);
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

            return JsonSerializer.Serialize(filters, JsonOptions);
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
