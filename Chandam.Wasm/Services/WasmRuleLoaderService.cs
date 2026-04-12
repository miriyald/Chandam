using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Chandam.API.Converters;
using Chandam.API.Models.Config;
using Chandam.API.Services;
using Chandam.Rules;
using Microsoft.JSInterop;

namespace Chandam.Wasm.Services;

/// <summary>
/// Loads rules via HttpClient for WASM (no file system access in browser)
/// </summary>
public class WasmRuleLoaderService
{
    private readonly HttpClient _httpClient;
    private readonly RuleLoaderService _ruleLoader;
    private readonly IJSRuntime _jsRuntime;

    public WasmRuleLoaderService(HttpClient httpClient, RuleLoaderService ruleLoader, IJSRuntime jsRuntime)
    {
        _httpClient = httpClient;
        _ruleLoader = ruleLoader;
        _jsRuntime = jsRuntime;
    }

    // No InitializeAsync() - rules loaded on demand when user navigates to compute/learn pages

    public async Task LoadRuleSetAsync(string rulesFile, string examplesFile)
    {
        try
        {
            // Load rules (with .br compression support)
            var rulesJson = await LoadFileWithBrotliSupportAsync(rulesFile);
            var rules = _ruleLoader.LoadFromJsonString(rulesJson);

            if (rules != null && rules.Length > 0)
            {
                // Load examples if provided
                if (!string.IsNullOrEmpty(examplesFile))
                {
                    try
                    {
                        var examplesJson = await LoadFileWithBrotliSupportAsync(examplesFile);
                        var exampleSet = LoadExampleSetFromJson(examplesJson);

                        if (exampleSet != null)
                        {
                            MergeExamplesIntoRules(rules, exampleSet);
                            Console.WriteLine($"WASM: Merged examples for {exampleSet.Examples.Count} rules from {examplesFile}");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"WASM: Failed to load examples from {examplesFile}: {ex.Message}");
                    }
                }

                Manager.Clear();
                Manager.Register(rules);
                Console.WriteLine($"WASM: Loaded {rules.Length} rules from {rulesFile}");
            }
            else
            {
                Console.WriteLine($"WASM: No rules loaded from {rulesFile}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"WASM: Failed to load rules from {rulesFile}: {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Loads a file with browser-native Gzip decompression via JavaScript interop
    /// Falls back to .min.json if .gz file fails
    /// </summary>
    private async Task<string> LoadFileWithBrotliSupportAsync(string filePath)
    {
        try
        {
            // If path ends with .gz, use browser's native DecompressionStream API
            if (filePath.EndsWith(".gz", StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine($"WASM: Loading compressed file {filePath}");

                // Call JavaScript to decompress using browser's native API
                var json = await _jsRuntime.InvokeAsync<string>("decompressGzip", filePath);

                if (!string.IsNullOrEmpty(json))
                {
                    Console.WriteLine($"WASM: Successfully decompressed {filePath} → {json.Length} chars");
                    return json;
                }

                throw new InvalidOperationException("Decompression returned empty string");
            }
            else
            {
                // Uncompressed .min.json file
                Console.WriteLine($"WASM: Loading uncompressed file {filePath}");
                return await _httpClient.GetStringAsync(filePath);
            }
        }
        catch (Exception ex)
        {
            // If .gz file fails, try fallback to .min.json
            if (filePath.EndsWith(".gz", StringComparison.OrdinalIgnoreCase))
            {
                var fallbackPath = filePath.Replace(".gz", "");
                Console.WriteLine($"WASM: Failed to load {filePath}, trying fallback {fallbackPath}: {ex.Message}");
                return await _httpClient.GetStringAsync(fallbackPath);
            }

            throw;
        }
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
