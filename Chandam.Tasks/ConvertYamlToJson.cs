using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Chandam.API.Models.Config;
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
        /// Convert a single YAML file to JSON (generates both pretty and minified + compressed versions)
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

            Console.WriteLine($"Converting {Path.GetFileName(yamlFilePath)} → JSON...");

            // Read YAML
            var yamlContent = File.ReadAllText(yamlFilePath, Encoding.UTF8);

            var model = DeserializeYaml(fileName, yamlContent);

            // 1. Pretty-printed JSON
            var jsonOptionsPretty = new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };
            var jsonContentPretty = JsonSerializer.Serialize(model, model.GetType(), jsonOptionsPretty);
            File.WriteAllText(jsonFilePath, jsonContentPretty, Encoding.UTF8);
            Console.WriteLine($"  ✓ {jsonFileName} ({GetFileSize(jsonFilePath)})");

            // 2. Minified JSON
            var minJsonFilePath = Path.Combine(_outputDirectory, $"{fileName}.min.json");
            var jsonOptionsMinified = new JsonSerializerOptions
            {
                WriteIndented = false,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };
            var jsonContentMinified = JsonSerializer.Serialize(model, model.GetType(), jsonOptionsMinified);
            File.WriteAllText(minJsonFilePath, jsonContentMinified, Encoding.UTF8);
            Console.WriteLine($"  ✓ {Path.GetFileName(minJsonFilePath)} ({GetFileSize(minJsonFilePath)})");

            // 3. Gzip compressed (universal browser support)
            CompressToGzip(minJsonFilePath);
        }

        /// <summary>
        /// Deserialize into the DTO matching the file's shape.
        /// Typed deserialization is required: YamlDotNet's untyped path returns every
        /// scalar as string, which serializes to JSON as "8"/"true" and breaks the
        /// int/bool properties on RuleDto.
        /// </summary>
        private static object DeserializeYaml(string fileName, string yamlContent)
        {
            var deserializer = new DeserializerBuilder()
                .WithNamingConvention(CamelCaseNamingConvention.Instance)
                .Build();

            var isExampleSet = fileName.EndsWith("-examples", StringComparison.OrdinalIgnoreCase);

            object model = isExampleSet
                ? deserializer.Deserialize<ExampleSetDto>(yamlContent)
                : deserializer.Deserialize<RuleSetDto>(yamlContent);

            if (model == null)
            {
                throw new InvalidOperationException($"YAML deserialized to null for {fileName}");
            }

            return model;
        }

        /// <summary>
        /// Compress file using Gzip compression (universal browser support via DecompressionStream API)
        /// </summary>
        private void CompressToGzip(string filePath)
        {
            var gzFilePath = filePath + ".gz";

            try
            {
                using (var inputStream = File.OpenRead(filePath))
                using (var outputStream = File.Create(gzFilePath))
                using (var gzipStream = new GZipStream(outputStream, CompressionLevel.SmallestSize))
                {
                    inputStream.CopyTo(gzipStream);
                }

                // File must be fully closed before reading size
                Console.WriteLine($"  ✓ Compressed to Gzip: {Path.GetFileName(gzFilePath)} ({GetFileSize(gzFilePath)})");
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
    }
}
