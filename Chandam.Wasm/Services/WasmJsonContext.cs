using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using Chandam.API.Models;
using Chandam.API.Models.Config;
using Chandam.API.Services;

namespace Chandam.Wasm.Services;

/// <summary>
/// Source-generated JSON context for WASM.
/// Avoids NullabilityInfoContext_NotSupported under HybridGlobalization.
/// </summary>
// Config DTOs (deserialization)
[JsonSerializable(typeof(RuleSetDto))]
[JsonSerializable(typeof(List<RuleDto>))]
[JsonSerializable(typeof(RuleDto))]
[JsonSerializable(typeof(List<ExampleDto>))]
[JsonSerializable(typeof(ExampleDto))]
[JsonSerializable(typeof(ExampleSetDto))]
[JsonSerializable(typeof(Dictionary<string, List<ExampleDto>>))]
// API response types (serialization)
[JsonSerializable(typeof(DetermineResponse))]
[JsonSerializable(typeof(TryMatchResponse))]
[JsonSerializable(typeof(ScoresResponse))]
[JsonSerializable(typeof(GetRuleInfoResponse))]
[JsonSerializable(typeof(AvailableFilters))]
[JsonSerializable(typeof(List<RuleSummaryDetailed>))]
[JsonSerializable(typeof(RuleSummaryDetailed))]
[JsonSerializable(typeof(List<string>))]
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    PropertyNameCaseInsensitive = true,
    AllowTrailingCommas = true,
    ReadCommentHandling = JsonCommentHandling.Skip)]
public partial class WasmJsonContext : JsonSerializerContext
{
}
