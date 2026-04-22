using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Chandam.Dictionary.Models;

namespace Chandam.Dictionary.Cache;

public class DiskCache
{
    private readonly string _cacheDir;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public DiskCache(string cacheDir = "cache")
    {
        _cacheDir = cacheDir;
    }

    public List<DictionaryResult>? TryGet(string word)
    {
        var filePath = GetFilePath(word);
        if (!File.Exists(filePath))
            return null;

        var json = File.ReadAllText(filePath, Encoding.UTF8);
        return JsonSerializer.Deserialize<List<DictionaryResult>>(json, JsonOptions);
    }

    public void Set(string word, List<DictionaryResult> results)
    {
        var filePath = GetFilePath(word);
        var dir = Path.GetDirectoryName(filePath)!;
        Directory.CreateDirectory(dir);

        var json = JsonSerializer.Serialize(results, JsonOptions);
        File.WriteAllText(filePath, json, Encoding.UTF8);
    }

    private string GetFilePath(string word)
    {
        var hash = ComputeHash(word);
        return Path.Combine(_cacheDir, $"{hash}.json");
    }

    private static string ComputeHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
