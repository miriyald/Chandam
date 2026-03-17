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
    /// Author name (default: "మహానుభావుడు." for legacy examples)
    /// </summary>
    public string? Author { get; set; }

    /// <summary>
    /// Date/period of composition (default: "తెలియదు" for legacy examples)
    /// </summary>
    public string? Date { get; set; }

    /// <summary>
    /// Source reference (optional)
    /// </summary>
    public string? Reference { get; set; }

    /// <summary>
    /// Additional notes/remarks (optional)
    /// </summary>
    public string? Notes { get; set; }
}
