//---------------------------------------------------------------------------------------------
// <copyright file="Program.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:33EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

using System;
using System.Linq;
using Chandam.Rules;

namespace Verifier
{
	class Program
	{
		static int Main(string[] args)
		{
			// Initialize compiled rules
			Manager.Register(TeluguRules.Rules);
			RuleHelper.RegisterSanskritRules(SanskritRules.Rules);

			Console.ForegroundColor = ConsoleColor.White;
			Console.Title = "Chandam Tasks";

			try
			{
				// Parse command line arguments
				if (args.Length == 0)
				{
					ShowHelp();
					return 0;
				}

				var command = args[0].ToLowerInvariant();
				var options = args.Skip(1).ToArray();

				StopWatch timer = new StopWatch();
				timer.Start();

				int exitCode = command switch
				{
					"generate" or "gen" => GenerateRules(options),
					"topella" => GenerateTopellaOnly(options),
					"convert" or "yaml2json" => ConvertYamlToJson(options),
					"help" or "--help" or "-h" or "/?" => ShowHelp(),
					_ => ShowUnknownCommand(command)
				};

				timer.Reset();
				return exitCode;
			}
			catch (Exception ex)
			{
				Console.ForegroundColor = ConsoleColor.Red;
				Console.WriteLine($"\nError: {ex.Message}");
				Console.WriteLine(ex.StackTrace);
				Console.ResetColor();
				return 1;
			}
		}

		/// <summary>
		/// Generate rules and examples from class files (JSON + YAML)
		/// </summary>
		static int GenerateRules(string[] options)
		{
			Console.WriteLine("=== Generating Rules and Examples ===\n");

			var outputDir = options.Length > 0 ? options[0] : @"Chandam.Config\Rules";

			new GenerateRulesJSON(outputDir).GenerateAllRuleSets();

			Console.WriteLine("\n=== Generation Complete ===");
			return 0;
		}

		/// <summary>
		/// Generate Topella rules from CSV (2337 Telugu Vruttam meters)
		/// </summary>
		static int GenerateTopellaOnly(string[] options)
		{
			Console.WriteLine("=== Generating Topella Rules ===\n");

			var outputDir = options.Length > 0 ? options[0] : @"Chandam.Config\Rules";

			new GenerateRulesJSON(outputDir).GenerateTopellaRules();

			Console.WriteLine("\n=== Topella Generation Complete ===");
			return 0;
		}

		/// <summary>
		/// Convert YAML files to JSON
		/// </summary>
		static int ConvertYamlToJson(string[] options)
		{
			Console.WriteLine("=== Converting YAML to JSON ===\n");

			var inputDir = options.Length > 0 ? options[0] : @"Chandam.Config\Rules";
			var outputDir = options.Length > 1 ? options[1] : inputDir;

			new ConvertYamlToJson(inputDir, outputDir).ConvertAll();

			Console.WriteLine();
			return 0;
		}

		/// <summary>
		/// Show help/usage information
		/// </summary>
		static int ShowHelp()
		{
			Console.WriteLine("Chandam Tasks - Rule and Example Generation Utilities");
			Console.WriteLine("======================================================\n");
			Console.WriteLine("Usage: Chandam.Tasks <command> [options]\n");
			Console.WriteLine("Commands:");
			Console.WriteLine("  generate, gen          Generate rules and examples from class files");
			Console.WriteLine("                         Outputs: JSON + YAML format");
			Console.WriteLine("                         Usage: gen [output-directory]");
			Console.WriteLine("                         Default: Chandam.Config\\Rules\n");
			Console.WriteLine("  topella                Generate Topella rules from CSV (2337 meters)");
			Console.WriteLine("                         Outputs: topella.json/yaml + compressed versions");
			Console.WriteLine("                         Usage: topella [output-directory]");
			Console.WriteLine("                         Default: Chandam.Config\\Rules\n");
			Console.WriteLine("  convert, yaml2json     Convert YAML files to JSON");
			Console.WriteLine("                         Usage: convert [input-dir] [output-dir]");
			Console.WriteLine("                         Default: Chandam.Config\\Rules\n");
			Console.WriteLine("  help, --help, -h, /?   Show this help message\n");
			Console.WriteLine("Examples:");
			Console.WriteLine("  Chandam.Tasks gen");
			Console.WriteLine("  Chandam.Tasks generate C:\\Output\\Rules");
			Console.WriteLine("  Chandam.Tasks convert");
			Console.WriteLine("  Chandam.Tasks yaml2json C:\\Rules C:\\Output\n");
			Console.WriteLine("Generated Files:");
			Console.WriteLine("  Rules:");
			Console.WriteLine("    - chandam-rules.json/yaml         (frequent rules)");
			Console.WriteLine("    - telugu-complete.json/yaml       (all Telugu rules)");
			Console.WriteLine("    - topella.json/yaml               (Topella's 2337 meters)\n");
			Console.WriteLine("  Examples:");
			Console.WriteLine("    - chandam-examples.json/yaml      (frequent examples)");
			Console.WriteLine("    - telugu-complete-examples.json/yaml (all examples)\n");
			return 0;
		}

		/// <summary>
		/// Show error for unknown command
		/// </summary>
		static int ShowUnknownCommand(string command)
		{
			Console.ForegroundColor = ConsoleColor.Red;
			Console.WriteLine($"Unknown command: {command}\n");
			Console.ResetColor();
			ShowHelp();
			return 1;
		}
	}
}