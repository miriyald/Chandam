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

    // Reverse indexes for fast lookups (store array indexes for memory efficiency)
    private readonly Dictionary<string, Dictionary<string, List<int>>> _subTypeIndex = new();       // PadyamSubType -> array indexes
    private readonly Dictionary<string, Dictionary<string, List<int>>> _chandamNameIndex = new();   // ChandamName -> array indexes (for Vruttam)
    private readonly Dictionary<string, Dictionary<string, List<int>>> _nameIndex = new();          // Telugu name -> array indexes

    private static readonly string[] KnownRuleSets = ["chandam", "topella", "sanskrit"];

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
        // Clear existing indexes before reloading
        ClearIndexes();

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

        // Load only known rule sets (prefer YAML over JSON)
        foreach (var identifier in KnownRuleSets)
        {
            var yamlPath = Path.Combine(_rulesDirectory, $"{identifier}.yaml");
            var jsonPath = Path.Combine(_rulesDirectory, $"{identifier}.json");
            var filePath = File.Exists(yamlPath) ? yamlPath : File.Exists(jsonPath) ? jsonPath : null;

            if (filePath == null)
            {
                Console.WriteLine($"Rule set file not found for '{identifier}'");
                continue;
            }

            try
            {
                var ruleSet = LoadRuleSetFromFile(filePath);
                if (ruleSet != null && ruleSet.Length > 0)
                {
                    ruleSet = EnsureGenricVruttam(ruleSet);
                    _loadedRuleSets[identifier] = ruleSet;
                    BuildIndexes(identifier, ruleSet);
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

            RegisterRuleSet("chandam");
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
                ruleSet = EnsureGenricVruttam(ruleSet);
                _loadedRuleSets[identifier] = ruleSet;
                BuildIndexes(identifier, ruleSet);  // Build indexes after loading
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

        // Load only known example sets (prefer YAML over JSON)
        foreach (var identifier in KnownRuleSets)
        {
            var examplesId = $"{identifier}-examples";
            var yamlPath = Path.Combine(_rulesDirectory, $"{examplesId}.yaml");
            var jsonPath = Path.Combine(_rulesDirectory, $"{examplesId}.json");
            var filePath = File.Exists(yamlPath) ? yamlPath : File.Exists(jsonPath) ? jsonPath : null;

            if (filePath == null) continue;

            try
            {
                var exampleSet = LoadExampleSetFromFile(filePath);
                if (exampleSet != null && exampleSet.Examples.Count > 0)
                {
                    _loadedExampleSets[examplesId] = exampleSet;
                    var fileType = Path.GetExtension(filePath).ToUpper();
                    Console.WriteLine($"Loaded example set '{examplesId}' with {exampleSet.Examples.Count} rule examples ({fileType})");
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
    /// Register chandam rule set with Manager (default for business logic and tests)
    /// </summary>
    private void RegisterRuleSet(string ruleSetId)
    {
        Manager.Clear();  // Clear existing rules

        Rule[]? rulesToRegister = null;

        // Try to register chandam ruleset (preferred for tests and general use)
        if (_loadedRuleSets.ContainsKey(ruleSetId))
        {
            rulesToRegister = _loadedRuleSets[ruleSetId];
            Console.WriteLine($"Using {rulesToRegister.Length} rules from '{ruleSetId}'");
        }
        else if (_loadedRuleSets.ContainsKey($"{ruleSetId}.min"))
        {
            rulesToRegister = _loadedRuleSets[$"{ruleSetId}.min"];
            Console.WriteLine($"Using {rulesToRegister.Length} rules from '{ruleSetId}.min'");
        }
        else
        {
            // Fallback to current rule set
            rulesToRegister = GetCurrentRuleSet();
            Console.WriteLine($"Using {rulesToRegister.Length} rules Fallback (current rule set)");
        }

        if (rulesToRegister != null && rulesToRegister.Length > 0)
        {
            Manager.Register(rulesToRegister);
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
            var compiledRules = EnsureGenricVruttam(Manager.Rules());
            _loadedRuleSets["default"] = compiledRules;
            BuildIndexes("default", compiledRules);  // Build indexes after loading
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

    /// <summary>
    /// Get all rules for a specific rule set without changing global state.
    /// Thread-safe: does not mutate Manager or _currentRuleSetId.
    /// GenricVruttam is always last (guaranteed by EnsureGenricVruttam at load time).
    /// </summary>
    public List<Rule> GetRulesForRuleSet(string? ruleSetId, RuleLanguage? language = null)
    {
        var id = ruleSetId ?? _currentRuleSetId;

        Rule[]? rules = null;
        if (_loadedRuleSets.ContainsKey(id))
            rules = _loadedRuleSets[id];
        else if (_loadedRuleSets.ContainsKey($"{id}.min"))
            rules = _loadedRuleSets[$"{id}.min"];

        if (rules == null)
            rules = GetCurrentRuleSet();

        if (language.HasValue)
            return rules.Where(r => r.Language == language.Value).ToList();

        return rules.ToList();
    }

    /// <summary>
    /// Fetch a single rule by identifier from a specific rule set without changing global state.
    /// Thread-safe: does not mutate Manager or _currentRuleSetId.
    /// </summary>
    public Rule? FetchRuleFromRuleSet(string identifier, string? ruleSetId = null)
    {
        var id = ruleSetId ?? _currentRuleSetId;

        Rule[]? rules = null;
        if (_loadedRuleSets.ContainsKey(id))
            rules = _loadedRuleSets[id];
        else if (_loadedRuleSets.ContainsKey($"{id}.min"))
            rules = _loadedRuleSets[$"{id}.min"];

        if (rules == null)
            return Manager.FetchRule(identifier);

        return rules.FirstOrDefault(r => r.Identifier == identifier);
    }

    /// <summary>
    /// Get all rules matching exact Telugu name using index - O(1) lookup
    /// </summary>
    public List<Rule> GetRulesByName(string name, string? ruleSetId = null)
    {
        var activeRuleSetId = ruleSetId ?? _currentRuleSetId;

        if (!_nameIndex.ContainsKey(activeRuleSetId))
            return new List<Rule>();

        if (!_nameIndex[activeRuleSetId].TryGetValue(name, out var indexes))
            return new List<Rule>();

        var rules = _loadedRuleSets[activeRuleSetId];
        var results = new List<Rule>(indexes.Count);

        foreach (var idx in indexes)
        {
            results.Add(rules[idx]);
        }

        return results;
    }

    /// <summary>
    /// Get all rules matching specified PadyamSubType categories using index
    /// Examples: "Jati", "Akkara", "Ragada", "Vruttam", "DaMDakamu"
    /// </summary>
    public List<Rule> GetRulesBySubTypes(List<string> subTypes, string? ruleSetId = null)
    {
        var activeRuleSetId = ruleSetId ?? _currentRuleSetId;

        if (!_subTypeIndex.ContainsKey(activeRuleSetId))
            return new List<Rule>();

        var subTypeMap = _subTypeIndex[activeRuleSetId];
        var rules = _loadedRuleSets[activeRuleSetId];
        var results = new List<Rule>();

        foreach (var subType in subTypes)
        {
            if (subTypeMap.TryGetValue(subType, out var indexes))
            {
                foreach (var idx in indexes)
                {
                    results.Add(rules[idx]);
                }
            }
        }

        return results;
    }

    /// <summary>
    /// Get all Vruttam rules for specific Chandam names using index
    /// ChandamNames: "గాయత్రి", "త్రిష్టుప్పు", "అనుష్టుప్", etc.
    /// Matches UI grouping: groupKey = `vruttam:${rule.chandamName}`
    /// </summary>
    public List<Rule> GetRulesByChandamNames(List<string> chandamNames, string? ruleSetId = null)
    {
        var activeRuleSetId = ruleSetId ?? _currentRuleSetId;

        if (!_chandamNameIndex.ContainsKey(activeRuleSetId))
            return new List<Rule>();

        var chandamNameMap = _chandamNameIndex[activeRuleSetId];
        var rules = _loadedRuleSets[activeRuleSetId];
        var results = new List<Rule>();

        foreach (var chandamName in chandamNames)
        {
            if (chandamNameMap.TryGetValue(chandamName, out var indexes))
            {
                foreach (var idx in indexes)
                {
                    results.Add(rules[idx]);
                }
            }
        }

        return results;
    }

    /// <summary>
    /// Clear all indexes (call when rules are reloaded)
    /// </summary>
    public void ClearIndexes()
    {
        _subTypeIndex.Clear();
        _chandamNameIndex.Clear();
        _nameIndex.Clear();
    }

    /// <summary>
    /// Sync rules from Manager back to RuleLoaderService
    /// Used when rules are loaded directly into Manager (bypassing file loading)
    /// </summary>
    /// <param name="ruleSetId">Optional ruleset ID to use (defaults to "default" for custom rules)</param>
    public void SyncFromManager(string? ruleSetId = null)
    {
        try
        {
            var managerRules = Manager.Rules();
            if (managerRules != null && managerRules.Length > 0)
            {
                var targetId = ruleSetId ?? "default";
                var extendedRules = EnsureGenricVruttam(managerRules);

                // Store rules with specified ID and set as current
                _loadedRuleSets[targetId] = extendedRules;
                BuildIndexes(targetId, extendedRules);  // Build indexes after syncing
                _currentRuleSetId = targetId;

                // Re-register GenricVruttam with Manager if it was added
                if (extendedRules.Length > managerRules.Length)
                {
                    Manager.AddRule(extendedRules[extendedRules.Length - 1]);
                }

                Console.WriteLine($"Synced {extendedRules.Length} rules from Manager to RuleLoaderService as '{targetId}'");
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Failed to sync from Manager: {ex.Message}");
        }
    }

    /// <summary>
    /// Create GenricVruttam rule instance — the catch-all "any even Vruttam" fallback.
    /// Equivalent to: new Chandam.Rules.Vruttam.GenricVruttam()
    /// Constructed manually because Chandam.API does not reference Chandam.Rules project.
    /// </summary>
    private static Rule CreateGenricVruttam()
    {
        return new Rule
        {
            Lines = 4,
            Threshold = 3,
            Identifier = "GenricVruttam",
            Name = "ఏదేని సమ వృత్తం",
            Examples = new string[] { },
            RuleType = RuleType.Name,
            PadyamType = PadyamType.Vruttam,
            PadyamSubType = PadyamSubType.GenricVruttam,
            YatiMode = YatiMode.CharPosition,
            Rules = new object[][] { new object[] { } },
            Yati = new int[][] { },
            Prasa = false,
            PrasaYati = false,
        };
    }

    /// <summary>
    /// Append GenricVruttam to the end of a rule set if not already present.
    /// GenricVruttam must always be last — it's a catch-all fallback matcher.
    /// </summary>
    private static Rule[] EnsureGenricVruttam(Rule[] rules)
    {
        if (rules == null || rules.Length == 0)
            return new[] { CreateGenricVruttam() };

        if (rules.Any(r => r.Identifier == "GenricVruttam"))
            return rules;

        var extended = new Rule[rules.Length + 1];
        Array.Copy(rules, extended, rules.Length);
        extended[rules.Length] = CreateGenricVruttam();
        return extended;
    }

    /// <summary>
    /// Build reverse indexes for fast lookups using array indexes for memory efficiency
    /// Based on existing UI grouping logic (rule-grouping.ts)
    /// </summary>
    private void BuildIndexes(string ruleSetId, Rule[] rules)
    {
        // 1. SubType index (O(1) category filtering) - maps PadyamSubType to array indexes
        var subTypeMap = new Dictionary<string, List<int>>(StringComparer.OrdinalIgnoreCase);

        // 2. ChandamName index (O(1) Vruttam Chandam filtering) - maps ChandamName to array indexes
        var chandamNameMap = new Dictionary<string, List<int>>(StringComparer.OrdinalIgnoreCase);

        // 3. Name index (O(1) Telugu rule name search) - maps name to array indexes
        var nameMap = new Dictionary<string, List<int>>(StringComparer.OrdinalIgnoreCase);

        for (int i = 0; i < rules.Length; i++)
        {
            var rule = rules[i];

            // Index by PadyamSubType (Akkara, Divpada, Jati, ... VishamaVruttam)
            // Matches SUBTYPE_ORDER in rule-grouping.ts
            var subType = rule.PadyamSubType.ToString();
            if (!subTypeMap.ContainsKey(subType))
                subTypeMap[subType] = new List<int>();
            subTypeMap[subType].Add(i);

            // Index Vruttam rules by ChandamName (గాయత్రి, త్రిష్టుప్పు, అనుష్టుప్, etc.)
            // This matches the UI grouping: groupKey = `vruttam:${rule.chandamName}`
            if (rule.PadyamType == PadyamType.Vruttam &&
                rule.PadyamSubType == PadyamSubType.Vruttam &&
                !string.IsNullOrEmpty(rule.ChandamName))
            {
                if (!chandamNameMap.ContainsKey(rule.ChandamName))
                    chandamNameMap[rule.ChandamName] = new List<int>();
                chandamNameMap[rule.ChandamName].Add(i);
            }

            // Index by Telugu rule name for text search
            if (!string.IsNullOrEmpty(rule.Name))
            {
                if (!nameMap.ContainsKey(rule.Name))
                    nameMap[rule.Name] = new List<int>();
                nameMap[rule.Name].Add(i);
            }
        }

        // Store indexes
        _subTypeIndex[ruleSetId] = subTypeMap;
        _chandamNameIndex[ruleSetId] = chandamNameMap;
        _nameIndex[ruleSetId] = nameMap;
    }
}
