using Chandam.API.Models;
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
    /// Santi Prasa and Soundex Sandhi only take effect when Yati matching is on.
    /// This is the single place that invariant is enforced.
    /// </summary>
    private static Padyam CreatePadyam(bool matchYati, bool matchPrasa, bool allowSantiPrasa, bool soundexSandhi) => new()
    {
        MatchYati = matchYati,
        MatchPrasa = matchPrasa,
        AllowSantiPrasa = matchYati && allowSantiPrasa,
        SandiMatch = matchYati && soundexSandhi
    };


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

            var rules = _ruleLoader.GetRulesForRuleSet(request.RuleSetId, request.Language);

            var options = MatchOptions.QucikMatchSettings;
            options.Language = request.Language;
            options.MatchYati = request.MatchYati;
            options.MatchPrasa = request.MatchPrasa;
            options.AllowSantiPrasa = request.MatchYati && request.AllowSantiPrasa;
            options.ExperimenatalSandhi = request.MatchYati && request.SoundexSandhi;

            var probable = Padyam.MostProbable2(request.PoemText, options, rules);

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

            var rule = _ruleLoader.FetchRuleFromRuleSet(request.RuleIdentifier, request.RuleSetId);
            if (rule == null)
            {
                return new TryMatchResponse
                {
                    IsMatch = false,
                    ErrorMessage = $"ఛందం దొరకలేదు: {request.RuleIdentifier} (Rule not found)"
                };
            }

            var padyam = CreatePadyam(request.MatchYati, request.MatchPrasa, request.AllowSantiPrasa, request.SoundexSandhi);

            var ruleClone = rule.Clone();
            var matchResult = padyam.Match(request.PoemText, ruleClone);
            var match = BuildChandamMatch(matchResult, ruleClone, padyam, request.RenderFormat);

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
    /// Determine best matching chandam and return BOTH requested format (Html/Markdown) AND beautified.
    /// Used by WASM frontend (Html + Beautified) and MCP tools (Markdown + Beautified).
    /// </summary>
    public DetermineResponse DetermineWithBeautified(DetermineRequest request)
    {
        var response = Determine(request);

        foreach (var match in response.Matches)
        {
            var rule = _ruleLoader.FetchRuleFromRuleSet(match.Rule.Identifier, request.RuleSetId);
            if (rule != null)
            {
                var padyam = CreatePadyam(request.MatchYati, request.MatchPrasa, request.AllowSantiPrasa, request.SoundexSandhi);
                var ruleClone = rule.Clone();
                var matchResult = padyam.Match(request.PoemText, ruleClone);
                match.Beautified = padyam.Beautify(matchResult);
            }
        }

        return response;
    }

    /// <summary>
    /// Try match against specific rule and return BOTH requested format (Html/Markdown) AND beautified.
    /// Used by WASM frontend (Html + Beautified) and MCP tools (Markdown + Beautified).
    /// </summary>
    public TryMatchResponse TryMatchWithBeautified(TryMatchRequest request)
    {
        var response = TryMatch(request);

        if (response.Match != null)
        {
            var rule = _ruleLoader.FetchRuleFromRuleSet(request.RuleIdentifier, request.RuleSetId);
            if (rule != null)
            {
                var padyam = CreatePadyam(request.MatchYati, request.MatchPrasa, request.AllowSantiPrasa, request.SoundexSandhi);
                var ruleClone = rule.Clone();
                var matchResult = padyam.Match(request.PoemText, ruleClone);
                response.Match.Beautified = padyam.Beautify(matchResult);
            }
        }

        return response;
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

            var padyam = CreatePadyam(request.MatchYati, request.MatchPrasa, request.AllowSantiPrasa, request.SoundexSandhi);

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

            var allRules = _ruleLoader.GetRulesForRuleSet(request.RuleSetId, request.Language);
            var scores = new List<ChandamScore>();

            var padyam = CreatePadyam(request.MatchYati, request.MatchPrasa, request.AllowSantiPrasa, request.SoundexSandhi);

            foreach (var rule in allRules)
            {
                try
                {
                    var ruleClone = rule.Clone();
                    var matchResult = padyam.Match(request.PoemText, ruleClone);

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

            var rule = _ruleLoader.FetchRuleFromRuleSet(request.RuleIdentifier, request.RuleSetId);
            if (rule == null)
            {
                return new GetRuleInfoResponse
                {
                    ErrorMessage = $"ఛందం దొరకలేదు: {request.RuleIdentifier} (Rule not found)"
                };
            }

            var response = BuildRuleInfo(rule, request.DescriptionFormat);

            if (request.IncludeExamples && rule.Examples2 != null && rule.Examples2.Length > 0)
            {
                response.Examples = new List<ExamplePoem>();
                foreach (var example in rule.Examples2)
                {
                    string? beautified = null;
                    try
                    {
                        var padyam = CreatePadyam(true, true, false, false);
                        // Clone to prevent Core engine from mutating the shared Rule in Manager
                        var ruleClone = rule.Clone();
                        var matchResult = padyam.Match(example.Text, ruleClone);
                        beautified = padyam.Beautify(matchResult);
                    }
                    catch { }

                    response.Examples.Add(new ExamplePoem
                    {
                        Text = example.Text,
                        Beautified = beautified,
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

            var rule = _ruleLoader.FetchRuleFromRuleSet(request.RuleIdentifier, request.RuleSetId);
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
            else if (request.IncludeGenerated && PoemGenerator.CanGenerate(rule))
            {
                var generated = PoemGenerator.Generate(rule);
                if (!string.IsNullOrEmpty(generated))
                {
                    response.Examples.Add(new ExamplePoem
                    {
                        Text = generated,
                        Author = "యంత్ర-నిర్మితం (Machine-Generated)",
                        Notes = "Generated using musical syllables to demonstrate meter structure"
                    });
                    response.IsGenerated = true;
                    response.TotalExamples = 1;
                }
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

    private GetRuleInfoResponse BuildRuleInfo(Rule rule, RenderFormat descriptionFormat = RenderFormat.Markdown)
    {
        return new GetRuleInfoResponse
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

            // Calculated fields
            Alias = rule.Alias,
            ChandamName = rule.ChandamName,
            CharLength = rule.CharLength,
            MatraLength = rule.MatraLength,
            Min = rule.Min,
            Max = rule.Max,
            ChandamNumber = rule.ChandamNumber,
            ChandamOrder = rule.ChandamOrder,
            Sequence = rule.Sequence,
            MatraSeries = rule.MatraSeries,
            RowWiseRules = rule.RowWiseRules,
            Description = descriptionFormat == RenderFormat.Html
                ? DescriptionBuilder.BuildDescriptionHtml(rule)
                : DescriptionBuilder.BuildDescription(rule),
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

        if (renderFormat == RenderFormat.Html)
            match.Html = padyam.Build(matchResult);
        if (renderFormat == RenderFormat.Markdown)
            match.Markdown = BuildMarkdown(matchResult, rule);

        return match;
    }

    private string BuildMarkdown(MatchResult matchResult, Rule rule)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"## {rule.Name}");
        sb.AppendLine();
        sb.AppendLine($"- **ఛందం**: {rule.Name} ({rule.Identifier})");
        sb.AppendLine($"- **రకం**: {rule.PadyamType}");
        sb.AppendLine($"- **గణన**: {matchResult.Score}/{matchResult.Total} ({matchResult.Percentage}%)");
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
