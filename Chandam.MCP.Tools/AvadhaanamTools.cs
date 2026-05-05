using System.ComponentModel;
using System.Text.Json;
using Chandam.API.Helpers;
using Chandam.MCP.Tools.Models;
using Chandam.Rules;
using ModelContextProtocol.Server;

namespace Chandam.MCP.Tools;

[McpServerToolType]
public class AvadhaanamTools
{
    private readonly AvadhaanamService _service;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly JsonSerializerOptions DeserializeOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public AvadhaanamTools(AvadhaanamService service)
    {
        _service = service;
    }

    [McpServerTool, Description("Split Telugu/Indic text into syllables (aksharas) with guru/laghu weight classification. Use this to inspect syllable structure, count positions, or self-check during composition.")]
    public string SplitSyllables(
        [Description("Telugu/Indic text to split into syllables")] string text,
        [Description("Language code: te (Telugu), kn (Kannada), sa (Sanskrit)")] string language = "te")
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return JsonSerializer.Serialize(new { valid = false, error = "Empty text provided" }, JsonOptions);
        }

        var lang = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var result = _service.SplitSyllables(text, lang);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Validate multiple Avadhaanam constraints on a poem in one call. Constraint types: not_contains (nisheddhakshari), line_starts_with/line_ends_with (nirdishTakshari), akshar_at_position (nyastakshari, supports negative indexing), contains_word (dattapadi), line_equals (samasyaa). Returns pass/fail for each constraint with score.")]
    public string CheckTextConstraints(
        [Description("The poem text (lines separated by newline)")] string poem_text,
        [Description("JSON array of constraints, e.g. [{\"type\":\"not_contains\",\"letters\":[\"ర\"],\"mode\":\"syllable\"},{\"type\":\"akshar_at_position\",\"line\":1,\"position\":-1,\"akshar\":\"డు\"}]")] string constraints,
        [Description("Language code: te (Telugu), kn (Kannada), sa (Sanskrit)")] string language = "te")
    {
        if (string.IsNullOrWhiteSpace(poem_text))
        {
            return JsonSerializer.Serialize(new { valid = false, score = 0.0, error = "Empty poem text" }, JsonOptions);
        }

        List<TextConstraint>? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<List<TextConstraint>>(constraints, DeserializeOptions);
        }
        catch (JsonException ex)
        {
            return JsonSerializer.Serialize(new { valid = false, score = 0.0, error = $"Invalid constraints JSON: {ex.Message}" }, JsonOptions);
        }

        if (parsed == null || parsed.Count == 0)
        {
            return JsonSerializer.Serialize(new ConstraintCheckResult { Valid = true, Score = 100, Total = 0, Results = [] }, JsonOptions);
        }

        var lang = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var result = _service.CheckConstraints(poem_text, parsed, lang);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Check if poem contains forbidden letters (nisheddhakshari). In 'syllable' mode (default), only flags when the forbidden letter is the leading consonant of a syllable. In 'anywhere' mode, does simple substring check.")]
    public string CheckNisheddhakshari(
        [Description("The poem text")] string poem_text,
        [Description("Comma-separated forbidden Telugu letters, e.g. 'ర,క'")] string forbidden_letters,
        [Description("Check mode: 'syllable' (default, traditional) or 'anywhere' (substring)")] string mode = "syllable",
        [Description("Language code")] string language = "te")
    {
        if (string.IsNullOrWhiteSpace(poem_text))
        {
            return JsonSerializer.Serialize(new { valid = false, score = 0.0, error = "Empty poem text" }, JsonOptions);
        }

        var letters = forbidden_letters.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
        var constraint = new NotContainsConstraint { Letters = letters, Mode = mode };
        var lang = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var result = _service.CheckConstraints(poem_text, [constraint], lang);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Check if specific lines start or end with prescribed aksharas (nirdishTakshari).")]
    public string CheckNirdishTakshari(
        [Description("The poem text")] string poem_text,
        [Description("JSON object: {\"1\":{\"start\":\"క\"},\"2\":{\"end\":\"ని\"}} where keys are line numbers")] string prescribed,
        [Description("Language code")] string language = "te")
    {
        if (string.IsNullOrWhiteSpace(poem_text))
        {
            return JsonSerializer.Serialize(new { valid = false, score = 0.0, error = "Empty poem text" }, JsonOptions);
        }

        Dictionary<string, JsonElement>? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(prescribed, DeserializeOptions);
        }
        catch (JsonException ex)
        {
            return JsonSerializer.Serialize(new { valid = false, score = 0.0, error = $"Invalid prescribed JSON: {ex.Message}" }, JsonOptions);
        }

        if (parsed == null || parsed.Count == 0)
        {
            return JsonSerializer.Serialize(new ConstraintCheckResult { Valid = true, Score = 100, Total = 0, Results = [] }, JsonOptions);
        }

        var constraints = new List<TextConstraint>();
        foreach (var (lineStr, value) in parsed)
        {
            if (!int.TryParse(lineStr, out int lineNum)) continue;
            if (value.TryGetProperty("start", out var startEl))
            {
                constraints.Add(new LineStartsWithConstraint { Line = lineNum, Akshar = startEl.GetString() ?? "" });
            }
            if (value.TryGetProperty("end", out var endEl))
            {
                constraints.Add(new LineEndsWithConstraint { Line = lineNum, Akshar = endEl.GetString() ?? "" });
            }
        }

        var lang = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var result = _service.CheckConstraints(poem_text, constraints, lang);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Check that specific aksharas appear at exact syllable positions (nyastakshari). Supports Python-style negative indexing: -1 = last syllable, -2 = second to last.")]
    public string CheckNyastakshari(
        [Description("The poem text")] string poem_text,
        [Description("JSON array: [{\"line\":1,\"position\":3,\"akshar\":\"ము\"},{\"line\":2,\"position\":-1,\"akshar\":\"డు\"}]")] string placements,
        [Description("Language code")] string language = "te")
    {
        if (string.IsNullOrWhiteSpace(poem_text))
        {
            return JsonSerializer.Serialize(new { valid = false, score = 0.0, error = "Empty poem text" }, JsonOptions);
        }

        List<AksharAtPositionConstraint>? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<List<AksharAtPositionConstraint>>(placements, DeserializeOptions);
        }
        catch (JsonException ex)
        {
            return JsonSerializer.Serialize(new { valid = false, score = 0.0, error = $"Invalid placements JSON: {ex.Message}" }, JsonOptions);
        }

        if (parsed == null || parsed.Count == 0)
        {
            return JsonSerializer.Serialize(new ConstraintCheckResult { Valid = true, Score = 100, Total = 0, Results = [] }, JsonOptions);
        }

        var constraints = parsed.Cast<TextConstraint>().ToList();
        var lang = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var result = _service.CheckConstraints(poem_text, constraints, lang);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Check that specified words appear in their assigned lines (dattapadi). Uses substring matching.")]
    public string CheckDattapadi(
        [Description("The poem text")] string poem_text,
        [Description("JSON array: [{\"word\":\"వంకాయ\",\"line\":1},{\"word\":\"అమెరికా\",\"line\":2}]")] string words,
        [Description("Language code")] string language = "te")
    {
        if (string.IsNullOrWhiteSpace(poem_text))
        {
            return JsonSerializer.Serialize(new { valid = false, score = 0.0, error = "Empty poem text" }, JsonOptions);
        }

        List<ContainsWordConstraint>? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<List<ContainsWordConstraint>>(words, DeserializeOptions);
        }
        catch (JsonException ex)
        {
            return JsonSerializer.Serialize(new { valid = false, score = 0.0, error = $"Invalid words JSON: {ex.Message}" }, JsonOptions);
        }

        if (parsed == null || parsed.Count == 0)
        {
            return JsonSerializer.Serialize(new ConstraintCheckResult { Valid = true, Score = 100, Total = 0, Results = [] }, JsonOptions);
        }

        var constraints = parsed.Cast<TextConstraint>().ToList();
        var lang = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var result = _service.CheckConstraints(poem_text, constraints, lang);
        return JsonSerializer.Serialize(result, JsonOptions);
    }

    [McpServerTool, Description("Check that a specific line in the poem exactly matches given text (samasyaa pooranam). Normalizes whitespace before comparison.")]
    public string CheckSamasyaaLine(
        [Description("The poem text")] string poem_text,
        [Description("Expected exact line text")] string expected_line,
        [Description("Line number (1-based, or -1 for last line)")] int line_number = -1,
        [Description("Language code")] string language = "te")
    {
        if (string.IsNullOrWhiteSpace(poem_text))
        {
            return JsonSerializer.Serialize(new { valid = false, score = 0.0, error = "Empty poem text" }, JsonOptions);
        }

        var constraint = new LineEqualsConstraint { Line = line_number, Text = expected_line };
        var lang = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var result = _service.CheckConstraints(poem_text, [constraint], lang);
        return JsonSerializer.Serialize(result, JsonOptions);
    }
}
