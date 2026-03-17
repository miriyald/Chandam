using Chandam.Rules;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace Verifier
{
    /// <summary>
    /// Generates JSON rule files for Chandam.API
    /// Extends the existing GenerateRulesJS functionality
    /// </summary>
    public class GenerateRulesJSON
    {
        private readonly string _outputDirectory;

        public GenerateRulesJSON(string outputDirectory = @"Chandam.Config\Rules")
        {
            _outputDirectory = outputDirectory;
        }

        /// <summary>
        /// Generate all rule set JSON files
        /// </summary>
        public void GenerateAllRuleSets()
        {
            Console.WriteLine("=== Generating JSON Rule Files ===");

            // Ensure output directory exists
            Directory.CreateDirectory(_outputDirectory);

            // Generate different rule sets
            GenerateFrequentRules();
            GenerateTeluguComplete();

            Console.WriteLine("=== JSON Generation Complete ===");
        }

        /// <summary>
        /// Generate chandam-rules.json - Most frequent/common rules only
        /// </summary>
        private void GenerateFrequentRules()
        {
            Console.WriteLine("\nGenerating chandam-rules.json (frequent rules only)...");

            var allRules = Manager.Rules();
            var frequentRules = allRules
                .Where(r => r.Language == RuleLanguage.Telugu && r.Frequency == Frequency.Frequent)
                .Take(15) // Limit to 15 most common
                .ToArray();

            var ruleSet = new RuleSetDto
            {
                Identifier = "default",
                Name = "సాధారణ ఛందస్సులు",
                Description = "తెలుగులో అత్యంత వాడుకలో ఉన్న ఛందస్సులు (Most frequently used Telugu Chandam meters)",
                Rules = ConvertRulesToDto(frequentRules)
            };

            SaveRuleSet(ruleSet, "chandam-rules.json");
            SaveRuleSetYaml(ruleSet, "chandam-rules.yaml");
            Console.WriteLine($"  ✓ Generated {frequentRules.Length} frequent rules (JSON + YAML)");
        }

        /// <summary>
        /// Generate telugu-complete.json - All Telugu rules
        /// </summary>
        private void GenerateTeluguComplete()
        {
            Console.WriteLine("\nGenerating telugu-complete.json (all Telugu rules)...");

            var allRules = Manager.Rules();
            var teluguRules = allRules
                .Where(r => r.Language == RuleLanguage.Telugu)
                .ToArray();

            var ruleSet = new RuleSetDto
            {
                Identifier = "telugu-complete",
                Name = "తెలుగు ఛందస్సులు - సంపూర్ణం",
                Description = "అన్ని తెలుగు ఛందస్సులు (All Telugu Chandam meters)",
                Rules = ConvertRulesToDto(teluguRules)
            };

            SaveRuleSet(ruleSet, "telugu-complete.json");
            SaveRuleSetYaml(ruleSet, "telugu-complete.yaml");
            Console.WriteLine($"  ✓ Generated {teluguRules.Length} Telugu rules (JSON + YAML)");
        }

        /// <summary>
        /// Convert Rule[] to List<RuleDto>
        /// </summary>
        private List<RuleDto> ConvertRulesToDto(Rule[] rules)
        {
            var ruleDtos = new List<RuleDto>();

            foreach (var rule in rules)
            {
                var dto = new RuleDto
                {
                    // Identifiers
                    Identifier = rule.Identifier,
                    Name = rule.Name,

                    // Classifications
                    Language = rule.Language.ToString(),
                    PadyamType = rule.PadyamType.ToString(),
                    PadyamSubType = rule.PadyamSubType.ToString(),
                    RuleType = rule.RuleType.ToString(),
                    Frequency = rule.Frequency.ToString(),

                    // Rules
                    Lines = rule.Lines,
                    Threshold = rule.Threshold,
                    Rules = ConvertRulesToStringArray(rule.Rules),
                    Yati = rule.Yati,
                    YatiMode = rule.YatiMode.ToString(),
                    Prasa = rule.Prasa,
                    PrasaYati = rule.PrasaYati,
                    AnthyaPrasa = rule.AnthyaPrasa,
                    ReverseYati = rule.ReverseYati,
                    OnlyPrasaYati = rule.OnlyPrasaYati,
                    YatiRecycle = rule.YatiRecycle,
                    DeferThresold = rule.DeferThresold,
                    InfiniteLength = rule.InfiniteLength,
                    RuleText = rule.RuleText,
                    References = rule.References,
                };

                // Calculated fields - some rules (infinite length, DaMDakamu) can overflow
                try
                {
                    dto.ShortName = rule.ShortName;
                    dto.Alias = rule.Alias;
                    dto.ChandamName = rule.ChandamName;
                    dto.CharLength = rule.CharLength;
                    dto.MatraLength = rule.MatraLength;
                    dto.Min = rule.Min;
                    dto.Max = rule.Max;
                    dto.ChandamNumber = rule.ChandamNumber;
                    dto.ChandamOrder = rule.ChandamOrder;
                    dto.Sequence = rule.Sequence;
                    dto.MatraSeries = rule.MatraSeries;
                    dto.RowWiseRules = rule.RowWiseRules;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  ! Calculated fields partial for {rule.Identifier}: {ex.Message}");
                }

                // Examples last
                dto.Examples = ConvertExamplesToDto(rule.Examples);

                ruleDtos.Add(dto);
            }

            return ruleDtos;
        }

        /// <summary>
        /// Convert object[][] rules to string[][]
        /// </summary>
        private string[][] ConvertRulesToStringArray(object[][] rules)
        {
            if (rules == null || rules.Length == 0)
                return null;

            var result = new string[rules.Length][];
            for (int i = 0; i < rules.Length; i++)
            {
                if (rules[i] != null)
                {
                    result[i] = new string[rules[i].Length];
                    for (int j = 0; j < rules[i].Length; j++)
                    {
                        result[i][j] = rules[i][j] != null ? rules[i][j].ToString() : "";
                    }
                }
            }

            return result;
        }

        /// <summary>
        /// Convert string[] examples to List<ExampleDto> with metadata
        /// </summary>
        private List<ExampleDto> ConvertExamplesToDto(string[] examples)
        {
            if (examples == null || examples.Length == 0)
                return null;

            var exampleDtos = new List<ExampleDto>();

            foreach (var exampleText in examples)
            {
                var text = exampleText;
                string reference = null;

                var tildeIndex = exampleText.IndexOf('~');
                if (tildeIndex >= 0)
                {
                    reference = exampleText.Substring(tildeIndex + 1).Trim();
                    text = exampleText.Substring(0, tildeIndex).Trim();
                }
                else
                {
                    text = exampleText.Trim();
                }

                var dto = new ExampleDto
                {
                    Text = text,
                    Author = "మహానుభావుడు.",
                    Date = "తెలియదు",
                    Reference = reference,
                };

                exampleDtos.Add(dto);
            }

            return exampleDtos;
        }

        /// <summary>
        /// Save RuleSetDto to JSON file
        /// </summary>
        private void SaveRuleSet(RuleSetDto ruleSet, string filename)
        {
            var filePath = Path.Combine(_outputDirectory, filename);

            var json = JsonSerializer.Serialize(ruleSet, new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });

            File.WriteAllText(filePath, json, Encoding.UTF8);

            Console.WriteLine($"  ✓ Saved JSON: {filePath}");
        }

        /// <summary>
        /// Save RuleSetDto to YAML file (human-editable format)
        /// </summary>
        private void SaveRuleSetYaml(RuleSetDto ruleSet, string filename)
        {
            var filePath = Path.Combine(_outputDirectory, filename);

            var serializer = new SerializerBuilder()
                .WithNamingConvention(CamelCaseNamingConvention.Instance)
                .ConfigureDefaultValuesHandling(DefaultValuesHandling.OmitNull | DefaultValuesHandling.OmitDefaults)
                .Build();

            var yaml = serializer.Serialize(ruleSet);
            File.WriteAllText(filePath, yaml, Encoding.UTF8);

            Console.WriteLine($"  ✓ Saved YAML: {filePath}");
        }
    }

    #region DTOs for JSON Serialization

    public class RuleSetDto
    {
        public string Identifier { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; }
        public List<RuleDto> Rules { get; set; } = new List<RuleDto>();
    }

    public class RuleDto
    {
        // Identifiers
        public string Identifier { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;

        // Classifications
        public string Language { get; set; }
        public string PadyamType { get; set; }
        public string PadyamSubType { get; set; }
        public string RuleType { get; set; }
        public string Frequency { get; set; }

        // Rules
        public int Lines { get; set; }
        public int Threshold { get; set; }
        public string[][] Rules { get; set; }
        public int[][] Yati { get; set; }
        public string YatiMode { get; set; }
        public bool Prasa { get; set; }
        public bool PrasaYati { get; set; }
        public bool AnthyaPrasa { get; set; }
        public bool ReverseYati { get; set; }
        public bool OnlyPrasaYati { get; set; }
        public bool YatiRecycle { get; set; }
        public bool DeferThresold { get; set; }
        public bool InfiniteLength { get; set; }
        public string RuleText { get; set; }
        public string[] References { get; set; }

        // Calculated fields
        public string ShortName { get; set; }
        public string Alias { get; set; }
        public string ChandamName { get; set; }
        public int CharLength { get; set; }
        public int MatraLength { get; set; }
        public int Min { get; set; }
        public int Max { get; set; }
        public decimal ChandamNumber { get; set; }
        public decimal ChandamOrder { get; set; }
        public string Sequence { get; set; }
        public string MatraSeries { get; set; }
        public bool RowWiseRules { get; set; }

        // Examples
        public List<ExampleDto> Examples { get; set; }
    }

    public class ExampleDto
    {
        public string Text { get; set; } = string.Empty;
        public string Author { get; set; }
        public string Date { get; set; }
        public string Reference { get; set; }
        public string Notes { get; set; }
    }

    #endregion
}
