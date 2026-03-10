using Chandam.Rules;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web.Script.Serialization;

namespace Verifier
{
    /// <summary>
    /// Generates JSON rule files for Chandam.API
    /// Extends the existing GenerateRulesJS functionality
    /// </summary>
    public class GenerateRulesJSON
    {
        private readonly string _outputDirectory;

        public GenerateRulesJSON(string outputDirectory = @"..\..\config\rules")
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
            // GenerateSanskritRules(); // TODO: if Sanskrit rules exist

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
            Console.WriteLine($"  ✓ Generated {frequentRules.Length} frequent rules");
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
            Console.WriteLine($"  ✓ Generated {teluguRules.Length} Telugu rules");
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
                    Identifier = rule.Identifier,
                    Name = rule.Name,
                    Lines = rule.Lines,
                    Threshold = rule.Threshold,
                    Rules = ConvertRulesToStringArray(rule.Rules),
                    Yati = rule.Yati,
                    Prasa = rule.Prasa,
                    PrasaYati = rule.PrasaYati,
                    AnthyaPrasa = rule.AnthyaPrasa,
                    RuleType = rule.RuleType.ToString(),
                    PadyamType = rule.PadyamType.ToString(),
                    PadyamSubType = rule.PadyamSubType.ToString(),
                    YatiMode = rule.YatiMode.ToString(),
                    Language = rule.Language.ToString(),
                    Frequency = rule.Frequency.ToString(),
                    ReverseYati = rule.ReverseYati,
                    OnlyPrasaYati = rule.OnlyPrasaYati,
                    YatiRecycle = rule.YatiRecycle,
                    DeferThresold = rule.DeferThresold,
                    InfiniteLength = rule.InfiniteLength,
                    References = rule.References,
                    RuleText = rule.RuleText,
                    Examples = ConvertExamplesToDto(rule.Examples)
                };

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
                // For now, use legacy format with default author/date
                // In future, can enhance with actual metadata
                var dto = new ExampleDto
                {
                    Text = exampleText,
                    Author = "మహానుభావుడు.",  // Default: "Great scholar"
                    Date = "తెలియదు",          // Default: "Unknown"
                    Reference = null,
                    Notes = null
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

            // Use JavaScriptSerializer for basic JSON serialization
            var serializer = new JavaScriptSerializer();
            serializer.MaxJsonLength = int.MaxValue; // Handle large rule sets

            var json = serializer.Serialize(ruleSet);

            // Pretty print the JSON manually for better readability
            json = FormatJson(json);

            File.WriteAllText(filePath, json, Encoding.UTF8);

            Console.WriteLine($"  ✓ Saved: {filePath}");
        }

        /// <summary>
        /// Simple JSON formatter for readability
        /// </summary>
        private string FormatJson(string json)
        {
            var indent = 0;
            var quoted = false;
            var sb = new StringBuilder();

            for (var i = 0; i < json.Length; i++)
            {
                var ch = json[i];

                switch (ch)
                {
                    case '{':
                    case '[':
                        sb.Append(ch);
                        if (!quoted)
                        {
                            sb.AppendLine();
                            sb.Append(new string(' ', ++indent * 2));
                        }
                        break;
                    case '}':
                    case ']':
                        if (!quoted)
                        {
                            sb.AppendLine();
                            sb.Append(new string(' ', --indent * 2));
                        }
                        sb.Append(ch);
                        break;
                    case '"':
                        sb.Append(ch);
                        bool escaped = false;
                        var index = i;
                        while (index > 0 && json[--index] == '\\')
                            escaped = !escaped;
                        if (!escaped)
                            quoted = !quoted;
                        break;
                    case ',':
                        sb.Append(ch);
                        if (!quoted)
                        {
                            sb.AppendLine();
                            sb.Append(new string(' ', indent * 2));
                        }
                        break;
                    case ':':
                        sb.Append(ch);
                        if (!quoted)
                            sb.Append(" ");
                        break;
                    default:
                        sb.Append(ch);
                        break;
                }
            }

            return sb.ToString();
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
        public string Name { get; set; } = string.Empty;
        public string Identifier { get; set; } = string.Empty;
        public int Lines { get; set; }
        public int Threshold { get; set; }
        public string[][] Rules { get; set; }
        public int[][] Yati { get; set; }
        public bool Prasa { get; set; }
        public bool PrasaYati { get; set; }
        public bool AnthyaPrasa { get; set; }
        public List<ExampleDto> Examples { get; set; }
        public string RuleType { get; set; }
        public string PadyamType { get; set; }
        public string PadyamSubType { get; set; }
        public string YatiMode { get; set; }
        public string Language { get; set; }
        public string Frequency { get; set; }
        public bool ReverseYati { get; set; }
        public bool OnlyPrasaYati { get; set; }
        public bool YatiRecycle { get; set; }
        public bool DeferThresold { get; set; }
        public bool InfiniteLength { get; set; }
        public string[] References { get; set; }
        public string RuleText { get; set; }
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
