using Chandam.API.Helpers;
using Chandam.Rules;
using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Chandam.API.Converters;

/// <summary>
/// JSON converter for RuleLanguage that accepts both numeric values and ISO language codes
/// Supports: 0, "0", "te", "Telugu", "tel", etc.
/// </summary>
public class LanguageJsonConverter : JsonConverter<RuleLanguage>
{
    public override RuleLanguage Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            // Handle numeric value (e.g., 0 for Telugu)
            var numericValue = reader.GetInt32();
            if (Enum.IsDefined(typeof(RuleLanguage), numericValue))
            {
                return (RuleLanguage)numericValue;
            }
        }
        else if (reader.TokenType == JsonTokenType.String)
        {
            // Handle string value (e.g., "te", "Telugu", "0")
            var stringValue = reader.GetString();
            var parsed = LanguageCodeMapper.ParseLanguage(stringValue);
            if (parsed.HasValue)
            {
                return parsed.Value;
            }
        }

        // Default to Telugu if parsing fails
        return RuleLanguage.Telugu;
    }

    public override void Write(Utf8JsonWriter writer, RuleLanguage value, JsonSerializerOptions options)
    {
        // Write as ISO language code (e.g., "te")
        writer.WriteStringValue(LanguageCodeMapper.ToLanguageCode(value));
    }
}

/// <summary>
/// JSON converter for nullable RuleLanguage
/// </summary>
public class NullableLanguageJsonConverter : JsonConverter<RuleLanguage?>
{
    public override RuleLanguage? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        if (reader.TokenType == JsonTokenType.Number)
        {
            var numericValue = reader.GetInt32();
            if (Enum.IsDefined(typeof(RuleLanguage), numericValue))
            {
                return (RuleLanguage)numericValue;
            }
        }
        else if (reader.TokenType == JsonTokenType.String)
        {
            var stringValue = reader.GetString();
            return LanguageCodeMapper.ParseLanguage(stringValue);
        }

        return null;
    }

    public override void Write(Utf8JsonWriter writer, RuleLanguage? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
        {
            writer.WriteStringValue(LanguageCodeMapper.ToLanguageCode(value.Value));
        }
        else
        {
            writer.WriteNullValue();
        }
    }
}
