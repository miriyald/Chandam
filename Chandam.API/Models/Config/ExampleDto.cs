using System.Text.Json.Serialization;

namespace Chandam.API.Models.Config;

/// <summary>
/// Enhanced example structure with metadata (author, date, notes)
/// </summary>
public class ExampleDto
{
    /// <summary>
    /// The poem text (required)
    /// </summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Author name (optional - UI should provide default if needed)
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Author { get; set; }

    /// <summary>
    /// Date/period of composition (optional - UI should provide default if needed)
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Date { get; set; }

    /// <summary>
    /// Source reference (optional)
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Reference { get; set; }

    /// <summary>
    /// Additional notes/remarks (optional)
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Notes { get; set; }
}
