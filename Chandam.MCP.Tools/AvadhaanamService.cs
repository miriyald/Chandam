using Chandam.API.Helpers;
using Chandam.Core;
using Chandam.Indic;
using Chandam.MCP.Tools.Models;
using Chandam.Rules;
using Chandam.Util;

namespace Chandam.MCP.Tools;

public class AvadhaanamService
{
    public SyllableSplitResult SplitSyllables(string text, RuleLanguage lang)
    {
        var gv = new GanaVibhajana(text, lang);
        var gwise = gv.GWiseString;
        var symbolsStream = gv.SymbolsStream ?? "";

        var syllables = new List<string>();
        var guruLaghu = new List<string>();
        var weights = new List<string>();

        var symbolLines = symbolsStream.Replace(" ", "").Split('\n');
        int symbolLineIdx = 0;
        int symbolCharIdx = 0;

        foreach (var item in gwise)
        {
            if (item == "\n")
            {
                symbolLineIdx++;
                symbolCharIdx = 0;
                continue;
            }
            if (string.IsNullOrWhiteSpace(item)) continue;

            syllables.Add(item);

            string sym = "";
            if (symbolLineIdx < symbolLines.Length && symbolCharIdx < symbolLines[symbolLineIdx].Length)
            {
                sym = symbolLines[symbolLineIdx][symbolCharIdx].ToString();
                symbolCharIdx++;
            }
            guruLaghu.Add(sym);
            weights.Add(sym == "U" ? "guru" : sym == "|" ? "laghu" : "unknown");
        }

        return new SyllableSplitResult
        {
            Syllables = syllables,
            Count = syllables.Count,
            GuruLaghu = guruLaghu,
            Weights = weights
        };
    }

    public ConstraintCheckResult CheckConstraints(string poemText, List<TextConstraint> constraints, RuleLanguage lang)
    {
        if (string.IsNullOrWhiteSpace(poemText))
        {
            return new ConstraintCheckResult
            {
                Valid = false,
                Score = 0,
                Total = constraints.Count,
                Passed = 0,
                Failed = constraints.Count,
                Results = constraints.Select(c => new ConstraintResult
                {
                    Type = c.Type,
                    Passed = false,
                    Error = "Empty poem text"
                }).ToList()
            };
        }

        if (constraints.Count == 0)
        {
            return new ConstraintCheckResult { Valid = true, Score = 100, Total = 0, Passed = 0, Failed = 0, Results = [] };
        }

        var lines = poemText.Split('\n').Select(l => l.TrimEnd('\r')).ToArray();
        var results = new List<ConstraintResult>();

        foreach (var constraint in constraints)
        {
            var result = constraint switch
            {
                NotContainsConstraint nc => CheckNotContains(lines, nc, lang),
                LineStartsWithConstraint ls => CheckLineStartsWith(lines, ls, lang),
                LineEndsWithConstraint le => CheckLineEndsWith(lines, le, lang),
                ContainsWordConstraint cw => CheckContainsWord(lines, cw),
                LineEqualsConstraint eq => CheckLineEquals(lines, eq),
                AksharAtPositionConstraint ap => CheckAksharAtPosition(lines, ap, lang),
                _ => new ConstraintResult { Type = "unknown", Passed = false, Error = "Unknown constraint type" }
            };
            results.Add(result);
        }

        int passed = results.Count(r => r.Passed);
        int total = results.Count;
        return new ConstraintCheckResult
        {
            Valid = passed == total,
            Score = total > 0 ? Math.Round((double)passed / total * 100, 1) : 100,
            Total = total,
            Passed = passed,
            Failed = total - passed,
            Results = results
        };
    }

    private ConstraintResult CheckNotContains(string[] lines, NotContainsConstraint constraint, RuleLanguage lang)
    {
        if (constraint.Mode == "anywhere")
        {
            var violations = new List<string>();
            for (int i = 0; i < lines.Length; i++)
            {
                foreach (var letter in constraint.Letters)
                {
                    if (lines[i].Contains(letter))
                    {
                        violations.Add($"Line {i + 1} contains '{letter}'");
                    }
                }
            }
            if (violations.Count > 0)
            {
                return new ConstraintResult
                {
                    Type = "not_contains",
                    Passed = false,
                    Details = string.Join("; ", violations)
                };
            }
            return new ConstraintResult { Type = "not_contains", Passed = true, Details = "No forbidden letters found" };
        }

        // Syllable mode: check leading consonant of each akshar
        var parser = CreateParser(lang);
        var syllableViolations = new List<string>();

        for (int i = 0; i < lines.Length; i++)
        {
            if (string.IsNullOrWhiteSpace(lines[i])) continue;
            var aksharas = parser.Split(lines[i]);
            if (aksharas == null) continue;

            foreach (var akshar in aksharas)
            {
                if (akshar.Chars == null || akshar.Chars.Length == 0) continue;
                if (!akshar.IsValid) continue;

                var leading = akshar.Chars[0];
                if (!leading.IsHallu) continue;

                string leadingStr = leading.BaseChar.ToString();
                foreach (var forbidden in constraint.Letters)
                {
                    if (forbidden.Length > 0 && leadingStr == forbidden[0].ToString())
                    {
                        syllableViolations.Add($"Line {i + 1}: '{akshar}' starts with forbidden '{forbidden}'");
                    }
                }
            }
        }

        if (syllableViolations.Count > 0)
        {
            return new ConstraintResult
            {
                Type = "not_contains",
                Passed = false,
                Details = string.Join("; ", syllableViolations.Take(10))
            };
        }
        return new ConstraintResult { Type = "not_contains", Passed = true, Details = "No forbidden letters found" };
    }

    private ConstraintResult CheckLineStartsWith(string[] lines, LineStartsWithConstraint constraint, RuleLanguage lang)
    {
        int lineIdx = constraint.Line - 1;
        if (lineIdx < 0 || lineIdx >= lines.Length)
        {
            return new ConstraintResult
            {
                Type = "line_starts_with",
                Passed = false,
                Line = constraint.Line,
                Expected = constraint.Akshar,
                Error = $"Line {constraint.Line} does not exist (poem has {lines.Length} lines)"
            };
        }

        var aksharas = GetLineSyllables(lines[lineIdx], lang);
        if (aksharas.Count == 0)
        {
            return new ConstraintResult
            {
                Type = "line_starts_with",
                Passed = false,
                Line = constraint.Line,
                Expected = constraint.Akshar,
                Error = $"Line {constraint.Line} has no syllables"
            };
        }

        string actual = aksharas[0];
        bool passed = actual == constraint.Akshar;
        return new ConstraintResult
        {
            Type = "line_starts_with",
            Passed = passed,
            Line = constraint.Line,
            Expected = constraint.Akshar,
            Actual = actual,
            LineSyllables = aksharas
        };
    }

    private ConstraintResult CheckLineEndsWith(string[] lines, LineEndsWithConstraint constraint, RuleLanguage lang)
    {
        int lineIdx = constraint.Line - 1;
        if (lineIdx < 0 || lineIdx >= lines.Length)
        {
            return new ConstraintResult
            {
                Type = "line_ends_with",
                Passed = false,
                Line = constraint.Line,
                Expected = constraint.Akshar,
                Error = $"Line {constraint.Line} does not exist (poem has {lines.Length} lines)"
            };
        }

        var aksharas = GetLineSyllables(lines[lineIdx], lang);
        if (aksharas.Count == 0)
        {
            return new ConstraintResult
            {
                Type = "line_ends_with",
                Passed = false,
                Line = constraint.Line,
                Expected = constraint.Akshar,
                Error = $"Line {constraint.Line} has no syllables"
            };
        }

        string actual = aksharas[^1];
        bool passed = actual == constraint.Akshar;
        return new ConstraintResult
        {
            Type = "line_ends_with",
            Passed = passed,
            Line = constraint.Line,
            Expected = constraint.Akshar,
            Actual = actual,
            LineSyllables = aksharas
        };
    }

    private ConstraintResult CheckContainsWord(string[] lines, ContainsWordConstraint constraint)
    {
        int lineIdx = constraint.Line - 1;
        if (lineIdx < 0 || lineIdx >= lines.Length)
        {
            return new ConstraintResult
            {
                Type = "contains_word",
                Passed = false,
                Line = constraint.Line,
                Expected = constraint.Word,
                Error = $"Line {constraint.Line} does not exist (poem has {lines.Length} lines)"
            };
        }

        string line = lines[lineIdx];
        int pos = line.IndexOf(constraint.Word, StringComparison.Ordinal);
        if (pos >= 0)
        {
            return new ConstraintResult
            {
                Type = "contains_word",
                Passed = true,
                Line = constraint.Line,
                Expected = constraint.Word,
                Position = pos
            };
        }

        return new ConstraintResult
        {
            Type = "contains_word",
            Passed = false,
            Line = constraint.Line,
            Expected = constraint.Word,
            Details = $"Word '{constraint.Word}' not found in line {constraint.Line}"
        };
    }

    private ConstraintResult CheckLineEquals(string[] lines, LineEqualsConstraint constraint)
    {
        int lineIdx = constraint.Line - 1;
        if (constraint.Line == -1) lineIdx = lines.Length - 1;
        if (lineIdx < 0 || lineIdx >= lines.Length)
        {
            return new ConstraintResult
            {
                Type = "line_equals",
                Passed = false,
                Line = constraint.Line,
                Expected = constraint.Text,
                Error = $"Line {constraint.Line} does not exist (poem has {lines.Length} lines)"
            };
        }

        string actual = NormalizeWhitespace(lines[lineIdx]);
        string expected = NormalizeWhitespace(constraint.Text);
        bool passed = actual == expected;

        return new ConstraintResult
        {
            Type = "line_equals",
            Passed = passed,
            Line = constraint.Line,
            Expected = expected,
            Actual = actual
        };
    }

    private ConstraintResult CheckAksharAtPosition(string[] lines, AksharAtPositionConstraint constraint, RuleLanguage lang)
    {
        int lineIdx = constraint.Line - 1;
        if (lineIdx < 0 || lineIdx >= lines.Length)
        {
            return new ConstraintResult
            {
                Type = "akshar_at_position",
                Passed = false,
                Line = constraint.Line,
                Position = constraint.Position,
                Expected = constraint.Akshar,
                Error = $"Line {constraint.Line} does not exist (poem has {lines.Length} lines)"
            };
        }

        var aksharas = GetLineSyllables(lines[lineIdx], lang);
        int count = aksharas.Count;

        // Resolve negative index (Python-style)
        int idx = constraint.Position < 0 ? count + constraint.Position : constraint.Position - 1;

        if (idx < 0 || idx >= count)
        {
            return new ConstraintResult
            {
                Type = "akshar_at_position",
                Passed = false,
                Line = constraint.Line,
                Position = constraint.Position,
                Expected = constraint.Akshar,
                Error = $"Position {constraint.Position} exceeds syllable count of {count} in line {constraint.Line}",
                LineSyllables = aksharas
            };
        }

        string actual = aksharas[idx];
        bool passed = actual == constraint.Akshar;

        return new ConstraintResult
        {
            Type = "akshar_at_position",
            Passed = passed,
            Line = constraint.Line,
            Position = constraint.Position,
            Expected = constraint.Akshar,
            Actual = actual,
            LineSyllables = aksharas
        };
    }

    private List<string> GetLineSyllables(string line, RuleLanguage lang)
    {
        var parser = CreateParser(lang);
        var aksharas = parser.Split(line);
        if (aksharas == null) return [];

        var result = new List<string>();
        foreach (var a in aksharas)
        {
            if (!a.IsValid || a.Length == 0) continue;
            var str = a.ToString2();
            if (string.IsNullOrWhiteSpace(str)) continue;
            if (str == "\n" || str == "\r") continue;
            result.Add(str);
        }
        return result;
    }

    private static IndicParser CreateParser(RuleLanguage lang)
    {
        var parser = new IndicParser();
        parser.CharSet = lang switch
        {
            RuleLanguage.Kannada => new KannadaCharSet(),
            _ => new TeluguCharSet()
        };
        return parser;
    }

    private static string NormalizeWhitespace(string text)
    {
        return string.Join(" ", text.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
    }
}
