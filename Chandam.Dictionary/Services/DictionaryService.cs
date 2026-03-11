using Chandam.Dictionary.Cache;
using Chandam.Dictionary.Models;
using Chandam.Dictionary.Sources;

namespace Chandam.Dictionary.Services;

public class DictionaryService
{
    private readonly IEnumerable<IDictionarySource> _sources;
    private readonly DiskCache _cache;

    public DictionaryService(IEnumerable<IDictionarySource> sources, DiskCache cache)
    {
        _sources = sources;
        _cache = cache;
    }

    public async Task<List<DictionaryResult>> LookupAsync(string word)
    {
        // Check cache first
        var cached = _cache.TryGet(word);
        if (cached != null)
            return cached;

        // Query all sources in parallel
        var tasks = _sources.Select(s => s.LookupAsync(word));
        var results = (await Task.WhenAll(tasks)).ToList();

        // Cache only when all sources return success
        if (results.All(r => r.Status == "success"))
        {
            _cache.Set(word, results);
        }

        return results;
    }
}
