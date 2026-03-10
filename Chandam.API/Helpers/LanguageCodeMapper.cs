using Chandam.Rules;
using System;
using System.Collections.Generic;

namespace Chandam.API.Helpers;

/// <summary>
/// Maps between ISO 639-1 language codes and RuleLanguage enum
/// Supports both numeric values and standard language codes
/// </summary>
public static class LanguageCodeMapper
{
    private static readonly Dictionary<string, RuleLanguage> CodeToEnum = new(StringComparer.OrdinalIgnoreCase)
    {
        { "te", RuleLanguage.Telugu },
        { "tel", RuleLanguage.Telugu },
        { "telugu", RuleLanguage.Telugu },

        { "kn", RuleLanguage.Kannada },
        { "kan", RuleLanguage.Kannada },
        { "kannada", RuleLanguage.Kannada },

        { "sa", RuleLanguage.Sanskrit },
        { "san", RuleLanguage.Sanskrit },
        { "sanskrit", RuleLanguage.Sanskrit },

        { "hi", RuleLanguage.Hindi },
        { "hin", RuleLanguage.Hindi },
        { "hindi", RuleLanguage.Hindi },

        { "ml", RuleLanguage.Malayalam },
        { "mal", RuleLanguage.Malayalam },
        { "malayalam", RuleLanguage.Malayalam }
    };

    private static readonly Dictionary<RuleLanguage, string> EnumToCode = new()
    {
        { RuleLanguage.Telugu, "te" },
        { RuleLanguage.Kannada, "kn" },
        { RuleLanguage.Sanskrit, "sa" },
        { RuleLanguage.Hindi, "hi" },
        { RuleLanguage.Malayalam, "ml" }
    };

    /// <summary>
    /// Parse language from string (supports ISO codes, full names, and numeric values)
    /// </summary>
    public static RuleLanguage? ParseLanguage(string? languageCode)
    {
        if (string.IsNullOrWhiteSpace(languageCode))
            return null;

        var code = languageCode.Trim();

        // Try ISO code or name
        if (CodeToEnum.TryGetValue(code, out var language))
            return language;

        // Try numeric value (e.g., "0" for Telugu)
        if (int.TryParse(code, out var numericValue))
        {
            if (Enum.IsDefined(typeof(RuleLanguage), numericValue))
                return (RuleLanguage)numericValue;
        }

        // Try enum name directly
        if (Enum.TryParse<RuleLanguage>(code, ignoreCase: true, out var result))
            return result;

        return null;
    }

    /// <summary>
    /// Convert RuleLanguage to ISO 639-1 code
    /// </summary>
    public static string ToLanguageCode(RuleLanguage language)
    {
        return EnumToCode.TryGetValue(language, out var code) ? code : language.ToString().ToLower();
    }

    /// <summary>
    /// Get all supported language codes
    /// </summary>
    public static IReadOnlyDictionary<string, RuleLanguage> GetSupportedLanguages()
    {
        return new Dictionary<string, RuleLanguage>
        {
            { "te", RuleLanguage.Telugu },
            { "kn", RuleLanguage.Kannada },
            { "sa", RuleLanguage.Sanskrit },
            { "hi", RuleLanguage.Hindi },
            { "ml", RuleLanguage.Malayalam }
        };
    }
}
