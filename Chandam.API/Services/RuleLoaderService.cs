using Chandam.API.Converters;
using Chandam.API.Models.Config;
using Chandam.Rules;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
#if !EXCLUDE_YAML
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;
#endif

namespace Chandam.API.Services;

/// <summary>
/// Manages loading rules from JSON files and switching between rule sets
/// Hidden internal feature - not exposed to customers
/// </summary>
public class RuleLoaderService
{
    private readonly Dictionary<string, Rule[]> _loadedRuleSets = new();
    private readonly Dictionary<string, ExampleSetDto> _loadedExampleSets = new();
    private string _currentRuleSetId = "default";
    private string _rulesDirectory = "Chandam.Config/Rules";

    public RuleLoaderService(string? rulesDirectory = null)
    {
        if (!string.IsNullOrEmpty(rulesDirectory))
        {
            _rulesDirectory = rulesDirectory;
        }
    }

    /// <summary>
    /// Load all rule sets from the rules directory
    /// </summary>
    public void LoadAllRuleSets(string? rulesDirectory = null)
    {
        if (!string.IsNullOrEmpty(rulesDirectory))
        {
            _rulesDirectory = rulesDirectory;
        }

        if (!Directory.Exists(_rulesDirectory))
        {
            Console.WriteLine($"Rules directory not found: {_rulesDirectory}");
            // Fallback to compiled rules
            LoadDefaultCompiledRules();
            return;
        }

        // Look for both YAML and JSON files (prefer YAML for readability)
        var yamlFiles = Directory.GetFiles(_rulesDirectory, "*.yaml");
        var jsonFiles = Directory.GetFiles(_rulesDirectory, "*.json");
        var allFiles = yamlFiles.Concat(jsonFiles).ToArray();

        if (allFiles.Length == 0)
        {
            Console.WriteLine("No rule files found. Using compiled rules.");
            LoadDefaultCompiledRules();
            return;
        }

        // Track which identifiers we've already loaded (YAML takes precedence)
        var loadedIdentifiers = new HashSet<string>();

        foreach (var filePath in allFiles)
        {
            try
            {
                var identifier = Path.GetFileNameWithoutExtension(filePath);

                // Skip if we already loaded this identifier (YAML was processed first)
                if (loadedIdentifiers.Contains(identifier))
                {
                    continue;
                }

                var ruleSet = LoadRuleSetFromFile(filePath);
                if (ruleSet != null && ruleSet.Length > 0)
                {
                    _loadedRuleSets[identifier] = ruleSet;
                    loadedIdentifiers.Add(identifier);
                    var fileType = Path.GetExtension(filePath).ToUpper();
                    Console.WriteLine($"Loaded rule set '{identifier}' with {ruleSet.Length} rules ({fileType})");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading rule set from {filePath}: {ex.Message}");
            }
        }

        // If no rule sets loaded, use compiled rules
        if (_loadedRuleSets.Count == 0)
        {
            LoadDefaultCompiledRules();
        }
        else
        {
            // Set largest rule set as default if "default" doesn't exist
            if (!_loadedRuleSets.ContainsKey("default"))
            {
                var largestRuleSet = _loadedRuleSets
                    .OrderByDescending(kvp => kvp.Value.Length)
                    .First().Key;
                _currentRuleSetId = largestRuleSet;
                Console.WriteLine($"Set default rule set to '{largestRuleSet}' ({_loadedRuleSets[largestRuleSet].Length} rules)");
            }

            // Load example sets from the same directory
            LoadAllExampleSets();

            // Merge examples into loaded rule sets
            foreach (var ruleSet in _loadedRuleSets.Values)
            {
                MergeExamplesIntoRules(ruleSet);
            }

            // Register current rule set with Manager
            RegisterCurrentRuleSet();
        }
    }

    /// <summary>
    /// Load specific rule set by identifier
    /// </summary>
    public Rule[]? LoadRuleSet(string identifier)
    {
        if (_loadedRuleSets.ContainsKey(identifier))
        {
            return _loadedRuleSets[identifier];
        }

        // Try loading from file
        var filePath = Path.Combine(_rulesDirectory, $"{identifier}.json");
        if (File.Exists(filePath))
        {
            var ruleSet = LoadRuleSetFromFile(filePath);
            if (ruleSet != null && ruleSet.Length > 0)
            {
                _loadedRuleSets[identifier] = ruleSet;
                return ruleSet;
            }
        }

        return null;
    }

    /// <summary>
    /// Load rule set from JSON file
    /// </summary>
    private Rule[]? LoadRuleSetFromFile(string filePath)
    {
        if (!File.Exists(filePath))
            return null;

        var extension = Path.GetExtension(filePath).ToLower();
        var content = File.ReadAllText(filePath);

        return extension switch
        {
#if !EXCLUDE_YAML
            ".yaml" or ".yml" => LoadFromYamlString(content),
#endif
            ".json" => LoadFromJsonString(content),
            _ => null
        };
    }

#if !EXCLUDE_YAML
    /// <summary>
    /// Load rules from YAML string (human-editable format)
    /// </summary>
    public Rule[]? LoadFromYamlString(string yaml)
    {
        if (string.IsNullOrWhiteSpace(yaml))
            return null;

        try
        {
            var deserializer = new DeserializerBuilder()
                .WithNamingConvention(CamelCaseNamingConvention.Instance)
                .Build();

            var ruleSetDto = deserializer.Deserialize<RuleSetDto>(yaml);

            if (ruleSetDto == null || ruleSetDto.Rules == null || ruleSetDto.Rules.Count == 0)
                return null;

            return RuleDtoConverter.ConvertToRules(ruleSetDto.Rules);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"YAML deserialization error: {ex.Message}");
            return null;
        }
    }
#endif

    /// <summary>
    /// Load rules from JSON string
    /// </summary>
    public Rule[]? LoadFromJsonString(string json)
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

            var ruleSetDto = JsonSerializer.Deserialize<RuleSetDto>(json, options);

            if (ruleSetDto == null || ruleSetDto.Rules == null || ruleSetDto.Rules.Count == 0)
                return null;

            return RuleDtoConverter.ConvertToRules(ruleSetDto.Rules);
        }
        catch (JsonException ex)
        {
            Console.WriteLine($"JSON deserialization error: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Load all example sets from the rules directory
    /// </summary>
    private void LoadAllExampleSets()
    {
        if (!Directory.Exists(_rulesDirectory))
            return;

        // Look for *-examples.yaml and *-examples.json files
        var yamlFiles = Directory.GetFiles(_rulesDirectory, "*-examples.yaml");
        var jsonFiles = Directory.GetFiles(_rulesDirectory, "*-examples.json");
        var allFiles = yamlFiles.Concat(jsonFiles).ToArray();

        if (allFiles.Length == 0)
        {
            Console.WriteLine("No example files found.");
            return;
        }

        // Track which identifiers we've already loaded (YAML takes precedence)
        var loadedIdentifiers = new HashSet<string>();

        foreach (var filePath in allFiles)
        {
            try
            {
                var identifier = Path.GetFileNameWithoutExtension(filePath);

                // Skip if we already loaded this identifier
                if (loadedIdentifiers.Contains(identifier))
                {
                    continue;
                }

                var exampleSet = LoadExampleSetFromFile(filePath);
                if (exampleSet != null && exampleSet.Examples.Count > 0)
                {
                    _loadedExampleSets[identifier] = exampleSet;
                    loadedIdentifiers.Add(identifier);
                    var fileType = Path.GetExtension(filePath).ToUpper();
                    Console.WriteLine($"Loaded example set '{identifier}' with {exampleSet.Examples.Count} rule examples ({fileType})");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading example set from {filePath}: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Load example set from file (JSON or YAML)
    /// </summary>
    private ExampleSetDto? LoadExampleSetFromFile(string filePath)
    {
        if (!File.Exists(filePath))
            return null;

        var extension = Path.GetExtension(filePath).ToLower();
        var content = File.ReadAllText(filePath);

        return extension switch
        {
#if !EXCLUDE_YAML
            ".yaml" or ".yml" => LoadExampleSetFromYamlString(content),
#endif
            ".json" => LoadExampleSetFromJsonString(content),
            _ => null
        };
    }

    /// <summary>
    /// Load example set from JSON string
    /// </summary>
    private ExampleSetDto? LoadExampleSetFromJsonString(string json)
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
            Console.WriteLine($"JSON deserialization error for examples: {ex.Message}");
            return null;
        }
    }

#if !EXCLUDE_YAML
    /// <summary>
    /// Load example set from YAML string
    /// </summary>
    private ExampleSetDto? LoadExampleSetFromYamlString(string yaml)
    {
        if (string.IsNullOrWhiteSpace(yaml))
            return null;

        try
        {
            var deserializer = new DeserializerBuilder()
                .WithNamingConvention(CamelCaseNamingConvention.Instance)
                .Build();

            return deserializer.Deserialize<ExampleSetDto>(yaml);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"YAML deserialization error for examples: {ex.Message}");
            return null;
        }
    }
#endif

    /// <summary>
    /// Merge all loaded example sets into rules array
    /// </summary>
    private void MergeExamplesIntoRules(Rule[] rules)
    {
        if (_loadedExampleSets.Count == 0)
            return;

        // Build lookup dictionary for fast access
        var ruleLookup = rules.ToDictionary(r => r.Identifier, r => r);

        // Merge examples from all loaded example sets
        foreach (var exampleSet in _loadedExampleSets.Values)
        {
            foreach (var kvp in exampleSet.Examples)
            {
                var ruleId = kvp.Key;
                var exampleDtos = kvp.Value;

                if (ruleLookup.TryGetValue(ruleId, out var rule))
                {
                    // Convert ExampleDto[] to Example[]
                    var exampleArray = RuleDtoConverter.ConvertExamples(exampleDtos);

                    // Append or replace examples
                    if (rule.Examples2 == null || rule.Examples2.Length == 0)
                    {
                        rule.Examples2 = exampleArray;
                    }
                    else
                    {
                        // Append to existing examples
                        rule.Examples2 = rule.Examples2.Concat(exampleArray).ToArray();
                    }
                }
            }
        }
    }

    /// <summary>
    /// Get current active rule set
    /// </summary>
    public Rule[] GetCurrentRuleSet()
    {
        if (_loadedRuleSets.ContainsKey(_currentRuleSetId))
        {
            return _loadedRuleSets[_currentRuleSetId];
        }

        // Fallback to compiled rules
        LoadDefaultCompiledRules();
        return _loadedRuleSets["default"];
    }

    /// <summary>
    /// Switch active rule set (hidden feature)
    /// </summary>
    public bool SetActiveRuleSet(string identifier)
    {
        if (string.IsNullOrEmpty(identifier))
            return false;

        // Check if already loaded
        if (_loadedRuleSets.ContainsKey(identifier))
        {
            _currentRuleSetId = identifier;
            RegisterCurrentRuleSet();
            return true;
        }

        // Try loading
        var ruleSet = LoadRuleSet(identifier);
        if (ruleSet != null)
        {
            _currentRuleSetId = identifier;
            RegisterCurrentRuleSet();
            return true;
        }

        return false;
    }

    /// <summary>
    /// Get current rule set identifier
    /// </summary>
    public string GetCurrentRuleSetId()
    {
        return _currentRuleSetId;
    }

    /// <summary>
    /// List all available rule set identifiers
    /// </summary>
    public List<string> ListRuleSetIds()
    {
        return _loadedRuleSets.Keys.ToList();
    }

    /// <summary>
    /// Register current rule set with Manager (makes rules available to Business logic)
    /// </summary>
    private void RegisterCurrentRuleSet()
    {
        var currentRules = GetCurrentRuleSet();
        if (currentRules != null && currentRules.Length > 0)
        {
            Manager.Clear();  // Clear existing rules
            Manager.Register(currentRules);
            Console.WriteLine($"Registered {currentRules.Length} rules from '{_currentRuleSetId}' rule set");
        }
    }

    /// <summary>
    /// Fallback: Load compiled rules from Manager registry.
    /// NOTE: Rules must be registered first via Manager.Register() before this works.
    /// If Manager is empty, returns empty set.
    /// </summary>
    private void LoadDefaultCompiledRules()
    {
        try
        {
            var compiledRules = Manager.Rules();
            _loadedRuleSets["default"] = compiledRules;
            _currentRuleSetId = "default";
            Console.WriteLine($"Loaded {compiledRules.Length} compiled rules (default)");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading compiled rules: {ex.Message}");
            _loadedRuleSets["default"] = Array.Empty<Rule>();
        }
    }

    /// <summary>
    /// Get single rule by identifier
    /// </summary>
    public Rule? GetRuleByIdentifier(string identifier)
    {
        return Manager.FetchRule(identifier);
    }

    /// <summary>
    /// List all rules in current rule set
    /// </summary>
    public List<Rule> GetAllRules(RuleLanguage? language = null)
    {
        var allRules = GetCurrentRuleSet();

        if (language.HasValue)
        {
            return allRules.Where(r => r.Language == language.Value).ToList();
        }

        return allRules.ToList();
    }
}
