using Chandam.Rules;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.Json;
using YamlDotNet.Core;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.EventEmitters;
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

            // Generate example sets
            GenerateFrequentExamples();
            GenerateTeluguCompleteExamples();

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
        /// Generate chandam-examples.json - Examples for frequent rules only
        /// </summary>
        private void GenerateFrequentExamples()
        {
            Console.WriteLine("\nGenerating chandam-examples.json (frequent rules examples)...");

            var allRules = Manager.Rules();
            var frequentRules = allRules
                .Where(r => r.Language == RuleLanguage.Telugu && r.Frequency == Frequency.Frequent)
                .Take(15)
                .ToArray();

            var exampleSet = CreateExampleSet(
                "default-examples",
                "సాధారణ ఛందస్సుల ఉదాహరణలు",
                "తెలుగులో అత్యంత వాడుకలో ఉన్న ఛందస్సుల ఉదాహరణలు (Examples for most frequently used Telugu Chandam meters)",
                frequentRules
            );

            SaveExampleSet(exampleSet, "chandam-examples.json");
            SaveExampleSetYaml(exampleSet, "chandam-examples.yaml");
            Console.WriteLine($"  ✓ Generated examples for {exampleSet.Examples.Count} rules (JSON + YAML)");
        }

        /// <summary>
        /// Generate telugu-complete-examples.json - Examples for all Telugu rules
        /// </summary>
        private void GenerateTeluguCompleteExamples()
        {
            Console.WriteLine("\nGenerating telugu-complete-examples.json (all Telugu examples)...");

            var allRules = Manager.Rules();
            var teluguRules = allRules
                .Where(r => r.Language == RuleLanguage.Telugu)
                .ToArray();

            var exampleSet = CreateExampleSet(
                "telugu-complete-examples",
                "తెలుగు ఛందస్సుల ఉదాహరణలు - సంపూర్ణం",
                "అన్ని తెలుగు ఛందస్సుల ఉదాహరణలు (Examples for all Telugu Chandam meters)",
                teluguRules
            );

            SaveExampleSet(exampleSet, "telugu-complete-examples.json");
            SaveExampleSetYaml(exampleSet, "telugu-complete-examples.yaml");
            Console.WriteLine($"  ✓ Generated examples for {exampleSet.Examples.Count} rules (JSON + YAML)");
        }

        /// <summary>
        /// Create ExampleSetDto from Rule array
        /// </summary>
        private ExampleSetDto CreateExampleSet(string identifier, string name, string description, Rule[] rules)
        {
            var exampleSet = new ExampleSetDto
            {
                Identifier = identifier,
                Name = name,
                Description = description,
                Examples = new Dictionary<string, List<ExampleDto>>()
            };

            foreach (var rule in rules)
            {
                if (rule.Examples != null && rule.Examples.Length > 0)
                {
                    var exampleDtos = ConvertExamplesToDto(rule.Examples);
                    if (exampleDtos != null && exampleDtos.Count > 0)
                    {
                        exampleSet.Examples[rule.Identifier] = exampleDtos;
                    }
                }
            }

            return exampleSet;
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
                    dto.ShortName = rule.ShortName?.Trim();
                    dto.Alias = rule.Alias?.Trim();
                    dto.ChandamName = rule.ChandamName?.Trim();
                    dto.CharLength = rule.CharLength;
                    dto.MatraLength = rule.MatraLength;
                    dto.Min = rule.Min;
                    dto.Max = rule.Max;
                    dto.ChandamNumber = rule.ChandamNumber;
                    dto.ChandamOrder = rule.ChandamOrder;
                    dto.Sequence = rule.Sequence?.Trim();
                    dto.MatraSeries = rule.MatraSeries?.Trim();
                    dto.RowWiseRules = rule.RowWiseRules;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  ! Calculated fields partial for {rule.Identifier}: {ex.Message}");
                }

                // Examples moved to separate files
                dto.Examples = null;

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
        /// Save RuleSetDto to JSON file (generates both pretty and minified + compressed versions)
        /// </summary>
        private void SaveRuleSet(RuleSetDto ruleSet, string filename)
        {
            var filePath = Path.Combine(_outputDirectory, filename);

            // 1. Save pretty-printed JSON for debugging
            var jsonPretty = JsonSerializer.Serialize(ruleSet, new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });
            File.WriteAllText(filePath, jsonPretty, Encoding.UTF8);
            Console.WriteLine($"  ✓ Saved JSON: {filePath} ({GetFileSize(filePath)})");

            // 2. Save minified JSON
            var minFilePath = filePath.Replace(".json", ".min.json");
            var jsonMinified = JsonSerializer.Serialize(ruleSet, new JsonSerializerOptions
            {
                WriteIndented = false,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });
            File.WriteAllText(minFilePath, jsonMinified, Encoding.UTF8);
            Console.WriteLine($"  ✓ Saved Minified JSON: {minFilePath} ({GetFileSize(minFilePath)})");

            // 3. Compress minified JSON to .br
            CompressToBrotli(minFilePath);
        }

        /// <summary>
        /// Save RuleSetDto to YAML file (human-editable format) + compressed version
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

            Console.WriteLine($"  ✓ Saved YAML: {filePath} ({GetFileSize(filePath)})");

            // Compress YAML to .br
            CompressToBrotli(filePath);
        }

        /// <summary>
        /// Save ExampleSetDto to JSON file (generates both pretty and minified + compressed versions)
        /// </summary>
        private void SaveExampleSet(ExampleSetDto exampleSet, string filename)
        {
            var filePath = Path.Combine(_outputDirectory, filename);

            // 1. Save pretty-printed JSON for debugging
            var jsonPretty = JsonSerializer.Serialize(exampleSet, new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });
            File.WriteAllText(filePath, jsonPretty, Encoding.UTF8);
            Console.WriteLine($"  ✓ Saved JSON: {filePath} ({GetFileSize(filePath)})");

            // 2. Save minified JSON
            var minFilePath = filePath.Replace(".json", ".min.json");
            var jsonMinified = JsonSerializer.Serialize(exampleSet, new JsonSerializerOptions
            {
                WriteIndented = false,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });
            File.WriteAllText(minFilePath, jsonMinified, Encoding.UTF8);
            Console.WriteLine($"  ✓ Saved Minified JSON: {minFilePath} ({GetFileSize(minFilePath)})");

            // 3. Compress minified JSON to .br
            CompressToBrotli(minFilePath);
        }

        /// <summary>
        /// Save ExampleSetDto to YAML file (human-editable format with literal block scalars for poems) + compressed version
        /// </summary>
        private void SaveExampleSetYaml(ExampleSetDto exampleSet, string filename)
        {
            var filePath = Path.Combine(_outputDirectory, filename);

            var serializer = new SerializerBuilder()
                .WithNamingConvention(CamelCaseNamingConvention.Instance)
                .ConfigureDefaultValuesHandling(DefaultValuesHandling.OmitNull | DefaultValuesHandling.OmitDefaults)
                .WithEventEmitter(nextEmitter => new MultilineScalarFlowStyleEmitter(nextEmitter))
                .Build();

            var yaml = serializer.Serialize(exampleSet);
            File.WriteAllText(filePath, yaml, Encoding.UTF8);

            Console.WriteLine($"  ✓ Saved YAML: {filePath} ({GetFileSize(filePath)})");

            // Compress YAML to .br
            CompressToBrotli(filePath);
        }

        /// <summary>
        /// Custom YAML emitter to use literal block style (|-) for multiline strings (better for poems)
        /// </summary>
        private class MultilineScalarFlowStyleEmitter : ChainedEventEmitter
        {
            public MultilineScalarFlowStyleEmitter(IEventEmitter nextEmitter) : base(nextEmitter) { }

            public override void Emit(ScalarEventInfo eventInfo, IEmitter emitter)
            {
                if (typeof(string).IsAssignableFrom(eventInfo.Source.Type))
                {
                    var value = eventInfo.Source.Value as string;
                    if (!string.IsNullOrEmpty(value) && value.Contains('\n'))
                    {
                        // Use literal block scalar (|-) for multiline strings (poems)
                        eventInfo.Style = YamlDotNet.Core.ScalarStyle.Literal;
                    }
                }

                base.Emit(eventInfo, emitter);
            }
        }

        /// <summary>
        /// Compress file using Brotli compression (quality 11 = maximum compression)
        /// </summary>
        private void CompressToBrotli(string filePath)
        {
            var brFilePath = filePath + ".br";

            try
            {
                using (var inputStream = File.OpenRead(filePath))
                using (var outputStream = File.Create(brFilePath))
                using (var brotliStream = new BrotliStream(outputStream, CompressionLevel.SmallestSize))
                {
                    inputStream.CopyTo(brotliStream);
                }

                // File must be fully closed before reading size
                Console.WriteLine($"  ✓ Compressed to Brotli: {Path.GetFileName(brFilePath)} ({GetFileSize(brFilePath)})");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  ! Failed to compress {Path.GetFileName(filePath)}: {ex.Message}");
            }
        }

        /// <summary>
        /// Get human-readable file size
        /// </summary>
        private string GetFileSize(string filePath)
        {
            if (!File.Exists(filePath))
                return "N/A";

            var fileInfo = new FileInfo(filePath);
            var bytes = fileInfo.Length;

            if (bytes < 1024)
                return $"{bytes}B";
            else if (bytes < 1024 * 1024)
                return $"{bytes / 1024.0:F1}KB";
            else
                return $"{bytes / (1024.0 * 1024.0):F1}MB";
        }

        /// <summary>
        /// Generate topella.json - All rules from Topella CSV (2337 Telugu Vruttam meters)
        /// </summary>
        public void GenerateTopellaRules()
        {
            Console.WriteLine("\nGenerating topella.json (Topella's 2337 Telugu meters)...");

            var csvPath = Path.Combine(_outputDirectory, "Topella.csv");
            if (!File.Exists(csvPath))
            {
                Console.WriteLine($"  ! CSV file not found: {csvPath}");
                return;
            }

            var rules = ParseTopellaCSV(csvPath);

            var ruleSet = new RuleSetDto
            {
                Identifier = "topella",
                Name = "తోపెల్ల వృత్తములు",
                Description = "శ్రీతోపెల్ల బాలసుబ్రహ్మణ్య శర్మగారి 2337 తెలుగు వృత్తములు (Topella's comprehensive collection of 2337 Telugu Vruttam meters)",
                Rules = ConvertRulesToDto(rules)
            };

            SaveRuleSet(ruleSet, "topella.json");
            SaveRuleSetYaml(ruleSet, "topella.yaml");
            Console.WriteLine($"  ✓ Generated {rules.Length} Topella rules (JSON + YAML)");
        }

        /// <summary>
        /// Parse Topella CSV and convert to Rule objects
        /// </summary>
        private Rule[] ParseTopellaCSV(string csvPath)
        {
            var rules = new List<Rule>();
            var lines = File.ReadAllLines(csvPath, Encoding.UTF8);

            Console.WriteLine($"  Reading CSV with {lines.Length} lines...");

            // Skip header row
            for (int i = 1; i < lines.Length; i++)
            {
                try
                {
                    var rule = ParseTopellaCsvRow(lines[i], i + 1);
                    if (rule != null)
                        rules.Add(rule);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  ! Error parsing row {i + 1}: {ex.Message}");
                }
            }

            Console.WriteLine($"  Parsed {rules.Count} rules successfully");
            return rules.ToArray();
        }

        /// <summary>
        /// Parse single CSV row into Rule object
        /// </summary>
        private Rule ParseTopellaCsvRow(string line, int rowNumber)
        {
            var fields = ParseCsvLine(line);

            // Ensure we have all 8 fields
            if (fields.Length < 8)
            {
                Console.WriteLine($"  ! Row {rowNumber}: Expected 8 fields, got {fields.Length}");
                return null;
            }

            // CSV columns: No, Rules, PrasaYati, Yathi, Reference, Name, Identifier, Full Name
            var rulesText = fields[1];
            var yatiText = fields[3];
            var reference = fields[4];
            var name = fields[5];
            var identifier = fields[6];
            var fullName = fields[7];

            // Format name with alias: "name (alias)" if alias exists
            var formattedName = FormatNameWithAlias(name, fullName, rowNumber);

            var rule = new Rule
            {
                Identifier = identifier,
                Name = formattedName,
                Language = RuleLanguage.Telugu,
                PadyamType = PadyamType.Vruttam,
                PadyamSubType = PadyamSubType.Vruttam,
                RuleType = RuleType.Name,
                Frequency = Frequency.Rare,
                Lines = 4,
                YatiMode = YatiMode.CharPosition,
                Prasa = true,
                PrasaYati = false,

                Rules = ParseRulesColumn(rulesText),
                Yati = ParseYatiColumn(yatiText),
                References = string.IsNullOrWhiteSpace(reference) ? null : new string[] { reference }
            };

            // Calculate threshold based on gana count
            var charLength = rule.Rules[0].Length;
            rule.Threshold = charLength >= 3 ? 3 : charLength;

            return rule;
        }

        /// <summary>
        /// Parse CSV line handling quoted fields with commas
        /// </summary>
        private string[] ParseCsvLine(string line)
        {
            var fields = new List<string>();
            var inQuotes = false;
            var field = new StringBuilder();

            for (int i = 0; i < line.Length; i++)
            {
                if (line[i] == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (line[i] == ',' && !inQuotes)
                {
                    fields.Add(field.ToString());
                    field.Clear();
                }
                else
                {
                    field.Append(line[i]);
                }
            }
            fields.Add(field.ToString());

            return fields.ToArray();
        }

        /// <summary>
        /// Split Telugu gana string into individual characters
        /// </summary>
        private object[][] ParseRulesColumn(string rulesText)
        {
            if (string.IsNullOrWhiteSpace(rulesText))
                return new object[0][];

            var ganas = new List<string>();
            var si = new StringInfo(rulesText);

            for (int i = 0; i < si.LengthInTextElements; i++)
            {
                ganas.Add(si.SubstringByTextElements(i, 1));
            }

            // Return as single row (Lines=4 handles repetition)
            return new object[][] { ganas.ToArray() };
        }

        /// <summary>
        /// Parse Yati column into int array
        /// </summary>
        private int[][] ParseYatiColumn(string yatiText)
        {
            if (yatiText == "No" || string.IsNullOrWhiteSpace(yatiText))
                return new int[0][];

            var numbers = yatiText.Split(',')
                .Select(s => int.Parse(s.Trim()))
                .ToArray();

            return new int[][] { numbers };
        }

        /// <summary>
        /// Format name with alias in parentheses: "name (alias)"
        /// Alias is extracted from Full Name (text after first comma)
        /// </summary>
        private string FormatNameWithAlias(string name, string fullName, int rowNumber)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                return name;

            // Validate name matches the main part of fullName (before comma)
            var commaIndex = fullName.IndexOf(',');
            var mainName = commaIndex > 0 ? fullName.Substring(0, commaIndex).Trim() : fullName.Trim();

            if (name != mainName)
            {
                Console.WriteLine($"  ! Row {rowNumber}: Name '{name}' doesn't match Full Name main part '{mainName}'");
            }

            // Extract alias (text after comma)
            if (commaIndex > 0 && commaIndex < fullName.Length - 1)
            {
                var alias = fullName.Substring(commaIndex + 1).Trim();
                if (!string.IsNullOrWhiteSpace(alias))
                {
                    return $"{name} ({alias})";
                }
            }

            return name;
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

    public class ExampleSetDto
    {
        public string Identifier { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; }
        public Dictionary<string, List<ExampleDto>> Examples { get; set; } = new Dictionary<string, List<ExampleDto>>();
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
