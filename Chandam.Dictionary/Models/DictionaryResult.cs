namespace Chandam.Dictionary.Models;

public class DictionaryResult
{
    public string Source { get; set; } = string.Empty;
    public string Word { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "success", "not_found", "error"
    public string? Content { get; set; }
    public string? Error { get; set; }
}
