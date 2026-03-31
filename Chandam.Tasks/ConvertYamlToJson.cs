using System;
using System.IO;
using System.Text;
using System.Text.Json;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace Verifier
{
    /// <summary>
    /// Utility to convert YAML rule/example files to JSON
    /// Useful for generating JSON files from human-edited YAML
    /// </summary>
    public class ConvertYamlToJson
    {
        private readonly string _inputDirectory;
        private readonly string _outputDirectory;

        public ConvertYamlToJson(string inputDirectory = @"Chandam.Config\Rules", string outputDirectory = null)
        {
            _inputDirectory = inputDirectory;
            _outputDirectory = outputDirectory ?? inputDirectory; // Default: same directory
        }

        /// <summary>
        /// Convert all YAML files in the input directory to JSON
        /// </summary>
        public void ConvertAll()
        {
            Console.WriteLine("=== Converting YAML to JSON ===\n");

            if (!Directory.Exists(_inputDirectory))
            {
                Console.WriteLine($"Error: Input directory not found: {_inputDirectory}");
                return;
            }

            // Ensure output directory exists
            if (_inputDirectory != _outputDirectory)
            {
                Directory.CreateDirectory(_outputDirectory);
            }

            var yamlFiles = Directory.GetFiles(_inputDirectory, "*.yaml");

            if (yamlFiles.Length == 0)
            {
                Console.WriteLine("No YAML files found.");
                return;
            }

            int successCount = 0;
            int errorCount = 0;

            foreach (var yamlFilePath in yamlFiles)
            {
                try
                {
                    ConvertFile(yamlFilePath);
                    successCount++;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  ✗ Error converting {Path.GetFileName(yamlFilePath)}: {ex.Message}");
                    errorCount++;
                }
            }

            Console.WriteLine($"\n=== Conversion Complete ===");
            Console.WriteLine($"  ✓ Success: {successCount}");
            if (errorCount > 0)
            {
                Console.WriteLine($"  ✗ Errors: {errorCount}");
            }
        }

        /// <summary>
        /// Convert a single YAML file to JSON
        /// </summary>
        public void ConvertFile(string yamlFilePath)
        {
            if (!File.Exists(yamlFilePath))
            {
                throw new FileNotFoundException($"YAML file not found: {yamlFilePath}");
            }

            var fileName = Path.GetFileNameWithoutExtension(yamlFilePath);
            var jsonFileName = $"{fileName}.json";
            var jsonFilePath = Path.Combine(_outputDirectory, jsonFileName);

            Console.WriteLine($"Converting {Path.GetFileName(yamlFilePath)} → {jsonFileName}...");

            // Read YAML
            var yamlContent = File.ReadAllText(yamlFilePath, Encoding.UTF8);

            // Deserialize YAML to object
            var deserializer = new DeserializerBuilder()
                .WithNamingConvention(CamelCaseNamingConvention.Instance)
                .Build();

            var yamlObject = deserializer.Deserialize(yamlContent);

            // Serialize to JSON
            var jsonOptions = new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };

            // YamlDotNet deserializes to Dictionary<object, object>, need to normalize
            var normalizedObject = NormalizeYamlObject(yamlObject);

            var jsonContent = JsonSerializer.Serialize(normalizedObject, jsonOptions);

            // Write JSON
            File.WriteAllText(jsonFilePath, jsonContent, Encoding.UTF8);

            var yamlSize = new FileInfo(yamlFilePath).Length;
            var jsonSize = new FileInfo(jsonFilePath).Length;
            var sizeDiff = jsonSize - yamlSize;
            var diffSign = sizeDiff >= 0 ? "+" : "";

            Console.WriteLine($"  ✓ {jsonFileName} ({jsonSize:N0} bytes, {diffSign}{sizeDiff:N0} bytes vs YAML)");
        }

        /// <summary>
        /// Normalize YamlDotNet's Dictionary<object, object> to Dictionary<string, object> for JSON serialization
        /// </summary>
        private object NormalizeYamlObject(object obj)
        {
            if (obj == null)
                return null;

            // Handle dictionaries
            if (obj is System.Collections.IDictionary dict)
            {
                var normalized = new System.Collections.Generic.Dictionary<string, object>();
                foreach (System.Collections.DictionaryEntry entry in dict)
                {
                    var key = entry.Key?.ToString() ?? "";
                    normalized[key] = NormalizeYamlObject(entry.Value);
                }
                return normalized;
            }

            // Handle lists
            if (obj is System.Collections.IList list)
            {
                var normalized = new System.Collections.Generic.List<object>();
                foreach (var item in list)
                {
                    normalized.Add(NormalizeYamlObject(item));
                }
                return normalized;
            }

            // Primitives and strings
            return obj;
        }
    }
}
