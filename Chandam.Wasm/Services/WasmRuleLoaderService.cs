using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Chandam.API.Converters;
using Chandam.API.Models.Config;
using Chandam.API.Services;
using Chandam.Rules;

namespace Chandam.Wasm.Services;

/// <summary>
/// Loads rules via HttpClient for WASM (no file system access in browser)
/// </summary>
public class WasmRuleLoaderService
{
    private readonly HttpClient _httpClient;
    private readonly RuleLoaderService _ruleLoader;
    private bool _initialized;

    public WasmRuleLoaderService(HttpClient httpClient, RuleLoaderService ruleLoader)
    {
        _httpClient = httpClient;
        _ruleLoader = ruleLoader;
    }

    public async Task InitializeAsync()
    {
        if (_initialized) return;

        try
        {
            // Load rules
            var rulesJson = await _httpClient.GetStringAsync("data/telugu-complete.json");
            var rules = _ruleLoader.LoadFromJsonString(rulesJson);

            if (rules != null && rules.Length > 0)
            {
                // Load examples
                var exampleFiles = new[] { "data/telugu-complete-examples.json" };
                foreach (var exampleFile in exampleFiles)
                {
                    try
                    {
                        var examplesJson = await _httpClient.GetStringAsync(exampleFile);
                        var exampleSet = LoadExampleSetFromJson(examplesJson);

                        if (exampleSet != null)
                        {
                            MergeExamplesIntoRules(rules, exampleSet);
                            Console.WriteLine($"WASM: Merged examples for {exampleSet.Examples.Count} rules from {exampleFile}");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"WASM: Failed to load examples from {exampleFile}: {ex.Message}");
                    }
                }

                Manager.Clear();
                Manager.Register(rules);
                Console.WriteLine($"WASM: Loaded {rules.Length} rules with examples");
            }
            else
            {
                Console.WriteLine("WASM: JSON rules empty, using compiled rules");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"WASM: Failed to load JSON rules ({ex.Message}), using compiled rules");
        }

        _initialized = true;
    }

    private ExampleSetDto? LoadExampleSetFromJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true,
                ReadCommentHandling = JsonCommentHandling.Skip
            };

            return JsonSerializer.Deserialize<ExampleSetDto>(json, options);
        }
        catch (JsonException ex)
        {
            Console.WriteLine($"WASM: JSON deserialization error for examples: {ex.Message}");
            return null;
        }
    }

    private void MergeExamplesIntoRules(Rule[] rules, ExampleSetDto exampleSet)
    {
        var ruleLookup = rules.ToDictionary(r => r.Identifier, r => r);

        foreach (var kvp in exampleSet.Examples)
        {
            var ruleId = kvp.Key;
            var exampleDtos = kvp.Value;

            if (ruleLookup.TryGetValue(ruleId, out var rule))
            {
                var examples = RuleDtoConverter.ConvertExamples(exampleDtos);
                rule.Examples2 = rule.Examples2?.Concat(examples).ToArray() ?? examples;
            }
        }
    }
}
