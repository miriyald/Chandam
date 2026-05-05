using System.Text.Json.Serialization;

namespace Chandam.MCP.Tools.Models;

public class SyllableSplitResult
{
    public List<string> Syllables { get; set; } = [];
    public int Count { get; set; }
    public List<string> GuruLaghu { get; set; } = [];
    public List<string> Weights { get; set; } = [];
}

public class ConstraintCheckResult
{
    public bool Valid { get; set; }
    public double Score { get; set; }
    public int Total { get; set; }
    public int Passed { get; set; }
    public int Failed { get; set; }
    public List<ConstraintResult> Results { get; set; } = [];
}

public class ConstraintResult
{
    public string Type { get; set; } = "";
    public bool Passed { get; set; }
    public int? Line { get; set; }
    public string? Expected { get; set; }
    public string? Actual { get; set; }
    public string? Details { get; set; }
    public string? Error { get; set; }
    public int? Position { get; set; }
    public List<string>? LineSyllables { get; set; }
}

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(NotContainsConstraint), "not_contains")]
[JsonDerivedType(typeof(LineStartsWithConstraint), "line_starts_with")]
[JsonDerivedType(typeof(LineEndsWithConstraint), "line_ends_with")]
[JsonDerivedType(typeof(ContainsWordConstraint), "contains_word")]
[JsonDerivedType(typeof(LineEqualsConstraint), "line_equals")]
[JsonDerivedType(typeof(AksharAtPositionConstraint), "akshar_at_position")]
public abstract class TextConstraint
{
    [JsonPropertyName("type")]
    public abstract string Type { get; }
}

public class NotContainsConstraint : TextConstraint
{
    public override string Type => "not_contains";
    [JsonPropertyName("letters")]
    public List<string> Letters { get; set; } = [];
    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "syllable";
}

public class LineStartsWithConstraint : TextConstraint
{
    public override string Type => "line_starts_with";
    [JsonPropertyName("line")]
    public int Line { get; set; }
    [JsonPropertyName("akshar")]
    public string Akshar { get; set; } = "";
}

public class LineEndsWithConstraint : TextConstraint
{
    public override string Type => "line_ends_with";
    [JsonPropertyName("line")]
    public int Line { get; set; }
    [JsonPropertyName("akshar")]
    public string Akshar { get; set; } = "";
}

public class ContainsWordConstraint : TextConstraint
{
    public override string Type => "contains_word";
    [JsonPropertyName("word")]
    public string Word { get; set; } = "";
    [JsonPropertyName("line")]
    public int Line { get; set; }
}

public class LineEqualsConstraint : TextConstraint
{
    public override string Type => "line_equals";
    [JsonPropertyName("line")]
    public int Line { get; set; }
    [JsonPropertyName("text")]
    public string Text { get; set; } = "";
}

public class AksharAtPositionConstraint : TextConstraint
{
    public override string Type => "akshar_at_position";
    [JsonPropertyName("line")]
    public int Line { get; set; }
    [JsonPropertyName("position")]
    public int Position { get; set; }
    [JsonPropertyName("akshar")]
    public string Akshar { get; set; } = "";
}
