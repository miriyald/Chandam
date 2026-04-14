using System.Text.Json.Serialization;
#if !EXCLUDE_YAML
using YamlDotNet.Serialization;
#endif

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
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public string? Author { get; set; }

    /// <summary>
    /// Date/period of composition (optional - UI should provide default if needed)
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public string? Date { get; set; }

    /// <summary>
    /// Source reference (optional)
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public string? Reference { get; set; }

    /// <summary>
    /// Additional notes/remarks (optional)
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
#if !EXCLUDE_YAML
    [YamlIgnore]
#endif
    public string? Notes { get; set; }
}
