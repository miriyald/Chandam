using Chandam.API.Models;
using Chandam.API.Services;
using Chandam.Rules;
using System;
using System.Linq;

namespace Chandam.API.Demo;

class Program
{
    static void Main(string[] args)
    {
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        Console.WriteLine("=== Chandam.API Demo ===\n");

        // Initialize services
        // Try to find Config/Rules in project root
        var projectRoot = FindProjectRoot();
        var rulesPath = projectRoot != null ? System.IO.Path.Combine(projectRoot, "config", "rules") : null;

        var ruleLoader = new RuleLoaderService(rulesPath);
        ruleLoader.LoadAllRuleSets();
        Console.WriteLine($"Loaded rule sets: {string.Join(", ", ruleLoader.ListRuleSetIds())}");
        Console.WriteLine($"Current rule set: {ruleLoader.GetCurrentRuleSetId()}\n");

        var chandamService = new ChandamService(ruleLoader);

        // Test 1: Determine - Auto-detect Chandam
        Console.WriteLine("--- Test 1: Determine (Auto-detect) ---");
        var determineRequest = new DetermineRequest
        {
            PoemText = @"సామర్థ్యలీలన్ తతజద్విగంబుల్
భూమిధ్రవిశ్రాంతుల బొంది యొప్పున్
ప్రేమంబుతో నైందవబింబవక్త్రున్
హేమాంబురుం బాడుదు రింద్రవజ్రన్",
            Language = RuleLanguage.Telugu,
            MatchYati = true,
            MatchPrasa = true,
            TopMatches = 1
        };

        var determineResponse = chandamService.Determine(determineRequest);
        if (determineResponse.Success && determineResponse.Matches.Count > 0)
        {
            var match = determineResponse.Matches[0];
            Console.WriteLine($"✓ Best match: {match.Name} ({match.Identifier})");
            Console.WriteLine($"  Match %: {match.MatchPercentage}%");
            Console.WriteLine($"  Type: {match.PadyamType}");
            Console.WriteLine($"  Frequency: {match.Frequency}");
            if (match.Details != null)
            {
                Console.WriteLine($"  Lines: {match.Details.LineCount}, Matched: {match.Details.MatchedLines}");
                Console.WriteLine($"  Yati: {match.Details.YatiMatched}, Prasa: {match.Details.PrasaMatched}");
            }
        }
        else
        {
            Console.WriteLine($"✗ Error: {determineResponse.ErrorMessage}");
        }

        Console.WriteLine();

        // Test 2: TryMatch - Match against specific Chandam
        Console.WriteLine("--- Test 2: TryMatch (Specific Chandam) ---");
        var tryMatchRequest = new TryMatchRequest
        {
            PoemText = determineRequest.PoemText,
            RuleIdentifier = "iMdravajramu",
            MatchYati = true,
            MatchPrasa = true
        };

        var tryMatchResponse = chandamService.TryMatch(tryMatchRequest);
        if (tryMatchResponse.Match != null)
        {
            Console.WriteLine($"Match: {tryMatchResponse.IsMatch}");
            Console.WriteLine($"Rule: {tryMatchResponse.Match.Name}");
            Console.WriteLine($"Match %: {tryMatchResponse.Match.MatchPercentage}%");
        }
        else
        {
            Console.WriteLine($"✗ Error: {tryMatchResponse.ErrorMessage}");
        }

        Console.WriteLine();

        // Test 3: GetRuleInfo - Get rule details
        Console.WriteLine("--- Test 3: GetRuleInfo ---");
        var ruleInfoRequest = new GetRuleInfoRequest
        {
            RuleIdentifier = "iMdravajramu",
            IncludeExamples = true
        };

        var ruleInfoResponse = chandamService.GetRuleInfo(ruleInfoRequest);
        if (ruleInfoResponse.ErrorMessage == null)
        {
            Console.WriteLine($"Name: {ruleInfoResponse.Name}");
            Console.WriteLine($"Identifier: {ruleInfoResponse.Identifier}");
            Console.WriteLine($"Type: {ruleInfoResponse.PadyamType}");
            Console.WriteLine($"Language: {ruleInfoResponse.Language}");
            Console.WriteLine($"Lines: {ruleInfoResponse.Lines}");
            Console.WriteLine($"Prasa: {ruleInfoResponse.Prasa}");
            Console.WriteLine($"Examples: {ruleInfoResponse.Examples?.Count ?? 0}");
            Console.WriteLine("\nDescription:");
            Console.WriteLine(ruleInfoResponse.Description);
        }
        else
        {
            Console.WriteLine($"✗ Error: {ruleInfoResponse.ErrorMessage}");
        }

        Console.WriteLine();

        // Test 4: Scores - Get all match scores
        Console.WriteLine("--- Test 4: Scores (Top 5) ---");
        var scoresRequest = new ScoresRequest
        {
            PoemText = determineRequest.PoemText,
            Language = RuleLanguage.Telugu,
            MatchYati = true,
            MatchPrasa = true,
            MinimumMatchPercentage = 50
        };

        var scoresResponse = chandamService.Scores(scoresRequest);
        if (scoresResponse.ErrorMessage == null)
        {
            Console.WriteLine($"Total rules evaluated: {scoresResponse.TotalRulesEvaluated}");
            Console.WriteLine($"Matches >= 50%: {scoresResponse.Scores.Count}");
            Console.WriteLine("\nTop 5 matches:");
            foreach (var score in scoresResponse.Scores.Take(5))
            {
                Console.WriteLine($"  {score.MatchPercentage}% - {score.Name} ({score.Frequency})");
            }
        }
        else
        {
            Console.WriteLine($"✗ Error: {scoresResponse.ErrorMessage}");
        }

        Console.WriteLine("\n=== Demo Complete ===");
    }

    static string? FindProjectRoot()
    {
        var current = System.IO.Directory.GetCurrentDirectory();
        while (current != null)
        {
            var configPath = System.IO.Path.Combine(current, "config", "rules");
            if (System.IO.Directory.Exists(configPath))
            {
                return current;
            }

            var parent = System.IO.Directory.GetParent(current);
            current = parent?.FullName;
        }
        return null;
    }
}
