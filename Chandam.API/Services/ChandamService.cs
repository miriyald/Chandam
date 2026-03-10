using Chandam.API.Converters;
using Chandam.API.Models;
using Chandam.API.Models.Config;
using Chandam.Core;
using Chandam.Rules;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Chandam.API.Services;

/// <summary>
/// Main service for Chandam analysis - wraps Business logic with clean API
/// </summary>
public class ChandamService
{
    private readonly RuleLoaderService _ruleLoader;

    public ChandamService(RuleLoaderService ruleLoader)
    {
        _ruleLoader = ruleLoader;
    }

    /// <summary>
    /// Auto-detect the best matching Chandam(s) for a poem
    /// Maps to Business3.Determine()
    /// </summary>
    public DetermineResponse Determine(DetermineRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.PoemText))
            {
                return new DetermineResponse
                {
                    Success = false,
                    ErrorMessage = "పద్యం ఖాళీగా ఉంది. దయచేసి పద్యం టెక్స్ట్ ఇవ్వండి. (Poem text is required)"
                };
            }

            // Set up match options
            var options = new MatchOptions
            {
                Language = request.Language,
                MatchYati = request.MatchYati,
                MatchPrasa = request.MatchPrasa
            };

            // Call Business3.Determine to get best matches
            var probable = Padyam.MostProbable(request.PoemText, options);

            if (probable == null || probable.MatchResult == null)
            {
                return new DetermineResponse
                {
                    Success = false,
                    ErrorMessage = "సరిపోలికలు దొరకలేదు. (No matches found)"
                };
            }

            var response = new DetermineResponse
            {
                Success = true,
                Matches = new List<ChandamMatch>()
            };

            // Add the best match
            var match = new ChandamMatch
            {
                Identifier = probable.Rule.Identifier,
                Name = probable.Rule.Name,
                MatchPercentage = probable.MatchResult.Percentage,
                PadyamType = probable.Rule.PadyamType.ToString(),
                PadyamSubType = probable.Rule.PadyamSubType.ToString(),
                Frequency = probable.Rule.Frequency.ToString(),
                Description = DescriptionBuilder.BuildDescription(probable.Rule),
                Details = BuildMatchDetails(probable.MatchResult, probable.Rule)
            };

            response.Matches.Add(match);

            // TODO: Add more top matches if requested (TopMatches > 1)
            // This requires calling Scores and taking top N

            return response;
        }
        catch (Exception ex)
        {
            return new DetermineResponse
            {
                Success = false,
                ErrorMessage = $"లోపం: {ex.Message} (Error: {ex.Message})"
            };
        }
    }

    /// <summary>
    /// Match a poem against a specific Chandam rule
    /// Maps to Business3.TryMatch()
    /// </summary>
    public TryMatchResponse TryMatch(TryMatchRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.PoemText))
            {
                return new TryMatchResponse
                {
                    IsMatch = false,
                    ErrorMessage = "పద్యం ఖాళీగా ఉంది. (Poem text is required)"
                };
            }

            if (string.IsNullOrWhiteSpace(request.RuleIdentifier))
            {
                return new TryMatchResponse
                {
                    IsMatch = false,
                    ErrorMessage = "ఛందం గుర్తింపు ఖాళీగా ఉంది. (Rule identifier is required)"
                };
            }

            // Fetch the rule
            var rule = Manager.FetchRule(request.RuleIdentifier);
            if (rule == null)
            {
                return new TryMatchResponse
                {
                    IsMatch = false,
                    ErrorMessage = $"ఛందం దొరకలేదు: {request.RuleIdentifier} (Rule not found)"
                };
            }

            // Create Padyam and configure matching options
            var padyam = new Padyam
            {
                MatchYati = request.MatchYati,
                MatchPrasa = request.MatchPrasa
            };

            // Perform the match
            var matchResult = padyam.Match(request.PoemText, rule);

            var match = new ChandamMatch
            {
                Identifier = rule.Identifier,
                Name = rule.Name,
                MatchPercentage = matchResult.Percentage,
                PadyamType = rule.PadyamType.ToString(),
                PadyamSubType = rule.PadyamSubType.ToString(),
                Frequency = rule.Frequency.ToString(),
                Description = DescriptionBuilder.BuildDescription(rule),
                Details = BuildMatchDetails(matchResult, rule)
            };

            return new TryMatchResponse
            {
                IsMatch = matchResult.Percentage >= rule.Threshold,
                Match = match
            };
        }
        catch (Exception ex)
        {
            return new TryMatchResponse
            {
                IsMatch = false,
                ErrorMessage = $"లోపం: {ex.Message} (Error: {ex.Message})"
            };
        }
    }

    /// <summary>
    /// Match a poem against a custom (unregistered) Chandam rule
    /// Allows testing rules without registering them first
    /// </summary>
    public TryMatchResponse TryMatchCustom(TryMatchCustomRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.PoemText))
            {
                return new TryMatchResponse
                {
                    IsMatch = false,
                    ErrorMessage = "పద్యం ఖాళీగా ఉంది. (Poem text is required)"
                };
            }

            if (request.Rule == null || string.IsNullOrWhiteSpace(request.Rule.Name))
            {
                return new TryMatchResponse
                {
                    IsMatch = false,
                    ErrorMessage = "ఛందం నియమము ఖాళీగా ఉంది. (Rule definition is required)"
                };
            }

            // Convert RuleDto to Rule
            Rule rule;
            try
            {
                rule = RuleDtoConverter.ConvertToRule(request.Rule);
            }
            catch (Exception ex)
            {
                return new TryMatchResponse
                {
                    IsMatch = false,
                    ErrorMessage = $"ఛందం నియమము చెల్లదు: {ex.Message} (Invalid rule definition: {ex.Message})"
                };
            }

            // Create Padyam and configure matching options
            var padyam = new Padyam
            {
                MatchYati = request.MatchYati,
                MatchPrasa = request.MatchPrasa
            };

            // Perform the match
            var matchResult = padyam.Match(request.PoemText, rule);

            var match = new ChandamMatch
            {
                Identifier = rule.Identifier,
                Name = rule.Name,
                MatchPercentage = matchResult.Percentage,
                PadyamType = rule.PadyamType.ToString(),
                PadyamSubType = rule.PadyamSubType.ToString(),
                Frequency = rule.Frequency.ToString(),
                Description = DescriptionBuilder.BuildDescription(rule),
                Details = BuildMatchDetails(matchResult, rule)
            };

            return new TryMatchResponse
            {
                IsMatch = matchResult.Percentage >= rule.Threshold,
                Match = match
            };
        }
        catch (Exception ex)
        {
            return new TryMatchResponse
            {
                IsMatch = false,
                ErrorMessage = $"లోపం: {ex.Message} (Error: {ex.Message})"
            };
        }
    }

    /// <summary>
    /// Calculate match scores for all Chandam rules
    /// Maps to Business.Scores()
    /// </summary>
    public ScoresResponse Scores(ScoresRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.PoemText))
            {
                return new ScoresResponse
                {
                    ErrorMessage = "పద్యం ఖాళీగా ఉంది. (Poem text is required)"
                };
            }

            // Get all rules (optionally filtered by language)
            var allRules = _ruleLoader.GetAllRules(request.Language);

            var scores = new List<ChandamScore>();

            // Create Padyam for matching
            var padyam = new Padyam
            {
                MatchYati = request.MatchYati,
                MatchPrasa = request.MatchPrasa
            };

            // Calculate match score for each rule
            foreach (var rule in allRules)
            {
                try
                {
                    var matchResult = padyam.Match(request.PoemText, rule);

                    if (matchResult.Percentage >= request.MinimumMatchPercentage)
                    {
                        scores.Add(new ChandamScore
                        {
                            Identifier = rule.Identifier,
                            Name = rule.Name,
                            MatchPercentage = matchResult.Percentage,
                            PadyamType = rule.PadyamType.ToString(),
                            Frequency = rule.Frequency.ToString()
                        });
                    }
                }
                catch
                {
                    // Skip rules that fail to match
                    continue;
                }
            }

            // Sort by match percentage descending
            scores = scores.OrderByDescending(s => s.MatchPercentage).ToList();

            return new ScoresResponse
            {
                Scores = scores,
                TotalRulesEvaluated = allRules.Count
            };
        }
        catch (Exception ex)
        {
            return new ScoresResponse
            {
                ErrorMessage = $"లోపం: {ex.Message} (Error: {ex.Message})"
            };
        }
    }

    /// <summary>
    /// Get detailed information about a specific Chandam rule
    /// Maps to Business.ShowRules()
    /// </summary>
    public GetRuleInfoResponse GetRuleInfo(GetRuleInfoRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.RuleIdentifier))
            {
                return new GetRuleInfoResponse
                {
                    ErrorMessage = "ఛందం గుర్తింపు ఖాళీగా ఉంది. (Rule identifier is required)"
                };
            }

            var rule = Manager.FetchRule(request.RuleIdentifier);
            if (rule == null)
            {
                return new GetRuleInfoResponse
                {
                    ErrorMessage = $"ఛందం దొరకలేదు: {request.RuleIdentifier} (Rule not found)"
                };
            }

            var response = new GetRuleInfoResponse
            {
                Identifier = rule.Identifier,
                Name = rule.Name,
                Lines = rule.Lines,
                PadyamType = rule.PadyamType.ToString(),
                PadyamSubType = rule.PadyamSubType.ToString(),
                Language = rule.Language.ToString(),
                Frequency = rule.Frequency.ToString(),
                Rules = ConvertRulesToStringArray(rule.Rules),
                Yati = rule.Yati,
                Prasa = rule.Prasa,
                PrasaYati = rule.PrasaYati,
                AnthyaPrasa = rule.AnthyaPrasa,
                Description = DescriptionBuilder.BuildDescription(rule),
                References = rule.References
            };

            // Add examples if requested
            if (request.IncludeExamples && rule.Examples2 != null && rule.Examples2.Length > 0)
            {
                response.Examples = new List<ExamplePoem>();
                foreach (var example in rule.Examples2)
                {
                    response.Examples.Add(new ExamplePoem
                    {
                        Text = example.Text,
                        Author = example.Author ?? "మహానుభావుడు.",
                        Date = "తెలియదు", // Example doesn't have Date field
                        Reference = example.Reference,
                        Notes = example.Remarks
                    });
                }
            }

            return response;
        }
        catch (Exception ex)
        {
            return new GetRuleInfoResponse
            {
                ErrorMessage = $"లోపం: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Get example poems for a specific Chandam
    /// Maps to Business.ShowSamples()
    /// </summary>
    public GetSamplesResponse GetSamples(GetSamplesRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.RuleIdentifier))
            {
                return new GetSamplesResponse
                {
                    ErrorMessage = "ఛందం గుర్తింపు ఖాళీగా ఉంది. (Rule identifier is required)"
                };
            }

            var rule = Manager.FetchRule(request.RuleIdentifier);
            if (rule == null)
            {
                return new GetSamplesResponse
                {
                    ErrorMessage = $"ఛందం దొరకలేదు: {request.RuleIdentifier} (Rule not found)"
                };
            }

            var response = new GetSamplesResponse
            {
                Identifier = rule.Identifier,
                Name = rule.Name,
                Examples = new List<ExamplePoem>()
            };

            if (rule.Examples2 != null && rule.Examples2.Length > 0)
            {
                var examplesToTake = request.MaxExamples > 0
                    ? rule.Examples2.Take(request.MaxExamples)
                    : rule.Examples2;

                foreach (var example in examplesToTake)
                {
                    response.Examples.Add(new ExamplePoem
                    {
                        Text = example.Text,
                        Author = example.Author ?? "మహానుభావుడు.",
                        Date = "తెలియదు",
                        Reference = example.Reference,
                        Notes = example.Remarks
                    });
                }

                response.TotalExamples = rule.Examples2.Length;
            }
            else
            {
                response.ErrorMessage = "ఈ ఛందానికి ఉదాహరణలు లేవు. (No examples available for this Chandam)";
            }

            return response;
        }
        catch (Exception ex)
        {
            return new GetSamplesResponse
            {
                ErrorMessage = $"లోపం: {ex.Message} (Error: {ex.Message})"
            };
        }
    }

    /// <summary>
    /// Build match details from MatchResult
    /// </summary>
    private MatchDetails BuildMatchDetails(MatchResult matchResult, Rule rule)
    {
        var details = new MatchDetails();

        // Calculate line count from rule definition or errors
        details.LineCount = rule.Lines;

        // Calculate matched lines: Total lines - lines with errors
        var linesWithErrors = matchResult.Errors?
            .Select(e => e.Line)
            .Distinct()
            .Count() ?? 0;
        details.MatchedLines = Math.Max(0, details.LineCount - linesWithErrors);

        // Check for Yati mismatches
        var yatiErrors = matchResult.Errors?.Any(e => e.Mismatch == Mismatch.Yati || e.Mismatch == Mismatch.PrasaYati) ?? false;
        details.YatiMatched = !yatiErrors;

        // Check for Prasa mismatches
        var prasaErrors = matchResult.Errors?.Any(e =>
            e.Mismatch == Mismatch.Prasa ||
            e.Mismatch == Mismatch.AnthyaPrasa ||
            e.Mismatch == Mismatch.PrasaYati ||
            e.Mismatch == Mismatch.PrasaPoorva ||
            e.Mismatch == Mismatch.AnthyaPrasaPoorva ||
            e.Mismatch == Mismatch.PrasaPoorvaBindu ||
            e.Mismatch == Mismatch.AnthyaPrasaPoorvaBindu ||
            e.Mismatch == Mismatch.PrasaPoorvaVisarga ||
            e.Mismatch == Mismatch.AnthyaPrasaPoorvaVisarga) ?? false;
        details.PrasaMatched = !prasaErrors;

        // Build mismatch descriptions
        if (matchResult.Errors != null && matchResult.Errors.Count > 0)
        {
            details.Mismatches = matchResult.Errors
                .Select(e => $"పాదము {e.Line}, స్థానము {e.Position}: {e.Mismatch}")
                .ToList();
        }

        return details;
    }

    /// <summary>
    /// Convert object[][] to string[][] for serialization
    /// </summary>
    private string[][]? ConvertRulesToStringArray(object[][] rules)
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
                    result[i][j] = rules[i][j]?.ToString() ?? "";
                }
            }
        }

        return result;
    }
}
