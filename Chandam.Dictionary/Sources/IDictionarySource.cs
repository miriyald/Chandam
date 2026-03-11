using Chandam.Dictionary.Models;

namespace Chandam.Dictionary.Sources;

/// <summary>
/// Port of DictionarySource ABC from Crawler/api/sources/base.py lines 44-52.
/// </summary>
public interface IDictionarySource
{
    string SourceName { get; }
    Task<DictionaryResult> LookupAsync(string word);
}
