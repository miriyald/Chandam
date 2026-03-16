using Chandam.API.Models;
using Chandam.API.Models.Config;
using Chandam.API.Converters;
using Chandam.Core;
using Chandam.Rules;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

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

            var options = new MatchOptions
            {
                Language = request.Language,
                MatchYati = request.MatchYati,
                MatchPrasa = request.MatchPrasa
            };

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
                Matches = new List<ChandamMatch>
                {
                    BuildChandamMatch(probable.MatchResult, probable.Rule, probable.Padyam, request.RenderFormat)
                }
            };

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

            var rule = Manager.FetchRule(request.RuleIdentifier);
            if (rule == null)
            {
                return new TryMatchResponse
                {
                    IsMatch = false,
                    ErrorMessage = $"ఛందం దొరకలేదు: {request.RuleIdentifier} (Rule not found)"
                };
            }

            var padyam = new Padyam
            {
                MatchYati = request.MatchYati,
                MatchPrasa = request.MatchPrasa
            };

            var matchResult = padyam.Match(request.PoemText, rule);
            var match = BuildChandamMatch(matchResult, rule, padyam, request.RenderFormat);

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

            var padyam = new Padyam
            {
                MatchYati = request.MatchYati,
                MatchPrasa = request.MatchPrasa
            };

            var matchResult = padyam.Match(request.PoemText, rule);
            var match = BuildChandamMatch(matchResult, rule, padyam, request.RenderFormat);

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

            var allRules = _ruleLoader.GetAllRules(request.Language);
            var scores = new List<ChandamScore>();

            var padyam = new Padyam
            {
                MatchYati = request.MatchYati,
                MatchPrasa = request.MatchPrasa
            };

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
                    continue;
                }
            }

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

            var response = BuildRuleInfo(rule);

            if (request.IncludeExamples && rule.Examples2 != null && rule.Examples2.Length > 0)
            {
                response.Examples = new List<ExamplePoem>();
                foreach (var example in rule.Examples2)
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

    private GetRuleInfoResponse BuildRuleInfo(Rule rule)
    {
        return new GetRuleInfoResponse
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
    }

    private ChandamMatch BuildChandamMatch(MatchResult matchResult, Rule rule, Padyam padyam, RenderFormat renderFormat)
    {
        var match = new ChandamMatch
        {
            Rule = BuildRuleInfo(rule),
            Score = matchResult.Score,
            Total = matchResult.Total,
            MatchPercentage = matchResult.Percentage,
            IsMatched = matchResult.IsMatched,
        };

        if (matchResult.Errors != null && matchResult.Errors.Count > 0)
        {
            match.Errors = matchResult.Errors.Select(e => new MatchError
            {
                Line = e.Line,
                Position = e.Position,
                MismatchType = e.Mismatch.ToString(),
                MismatchDescription = Helper.MismatchString(e.Mismatch),
                Expected = e.Expected,
                Actual = e.Actual,
                Remarks = e.Remarks
            }).ToList();
        }

        if (renderFormat == RenderFormat.Html )
            match.RenderedHtml = padyam.Build(matchResult);
        if (renderFormat == RenderFormat.Text )
            match.RenderedText = padyam.Build2(matchResult);
        if (renderFormat == RenderFormat.Markdown)
            match.RenderedMarkdown = BuildMarkdown(matchResult, rule);

        return match;
    }

    private string BuildMarkdown(MatchResult matchResult, Rule rule)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"## {rule.Name}");
        sb.AppendLine();
        sb.AppendLine($"- **ఛందం**: {rule.Name} ({rule.Identifier})");
        sb.AppendLine($"- **రకం**: {rule.PadyamType}");
        sb.AppendLine($"- **స్కోరు**: {matchResult.Score}/{matchResult.Total} ({matchResult.Percentage}%)");
        sb.AppendLine($"- **సరిపోలిక**: {(matchResult.IsMatched ? "అవును" : "కాదు")}");
        sb.AppendLine();

        if (matchResult.Errors != null && matchResult.Errors.Count > 0)
        {
            sb.AppendLine("### తప్పులు");
            sb.AppendLine();
            sb.AppendLine("| పాదము | స్థానము | తప్పు | కావలసినది | ఉన్నది |");
            sb.AppendLine("|--------|---------|-------|-----------|--------|");
            foreach (var e in matchResult.Errors)
            {
                var line = e.Mismatch == Mismatch.Lines ? "" : e.Line == -1 ? "" : e.Line.ToString();
                var pos = e.Mismatch == Mismatch.Lines ? "" : e.Position == -1 ? "" : e.Position.ToString();
                sb.AppendLine($"| {line} | {pos} | {Helper.MismatchString(e.Mismatch)} | {e.Expected} | {e.Actual} |");
            }
        }

        return sb.ToString();
    }

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
