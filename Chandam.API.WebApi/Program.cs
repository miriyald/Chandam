using Chandam.API.Converters;
using Chandam.API.Helpers;
using Chandam.API.Models;
using Chandam.API.Services;
using Chandam.API.WebApi.Middleware;
using Chandam.Rules;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using System.Text.Encodings.Web;
using System.Text.Json.Serialization;
using System.Text.Unicode;

var builder = WebApplication.CreateBuilder(args);

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.SetMinimumLevel(LogLevel.Information);

// Configure JSON options to preserve Telugu characters
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Encoder = JavaScriptEncoder.Create(UnicodeRanges.All);
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.SerializerOptions.WriteIndented = true;

    // Add custom language converter (supports "te", "0", "Telugu", etc.)
    options.SerializerOptions.Converters.Add(new LanguageJsonConverter());
    options.SerializerOptions.Converters.Add(new NullableLanguageJsonConverter());
});

// Register Chandam services
var configuredRulesPath = builder.Configuration.GetValue<string>("Chandam:RulesPath") ?? "Chandam.Config/Rules";
var ruleSet = builder.Configuration.GetValue<string>("Chandam:RuleSet") ??
              Environment.GetEnvironmentVariable("CHANDAM_RULESET") ?? "default";

// Resolve rulesPath: if relative, build path from solution root (parent of WebApi project)
var rulesPath = Path.IsPathRooted(configuredRulesPath)
    ?  configuredRulesPath 
    : Path.Combine(Directory.GetParent(builder.Environment.ContentRootPath)!.FullName, configuredRulesPath);

builder.Services.AddSingleton<RuleLoaderService>(sp =>
{
    var loader = new RuleLoaderService(rulesPath);
    loader.LoadAllRuleSets();

    // Set active rule set if specified
    if (!string.IsNullOrEmpty(ruleSet) && ruleSet != "default")
    {
        loader.SetActiveRuleSet(ruleSet);
    }

    return loader;
});

builder.Services.AddScoped<ChandamService>();

// Add API Explorer for Swagger (required for Minimal APIs)
builder.Services.AddEndpointsApiExplorer();

// Add Swagger/OpenAPI documentation
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Chandam API",
        Version = "1.0.0",
        Description = "",
        Contact = new OpenApiContact
        {
            Name = "Chandam",
            Url = new Uri("https://chandamu.github.io")
        },
        License = new OpenApiLicense
        {
            Name = "MIT",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });
});

// Add CORS for development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Add Swagger UI and OpenAPI schema endpoints
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Chandam API v1");
    options.RoutePrefix = "swagger";
    options.DocumentTitle = "Chandam Poetry Meter Analysis";
});

// Add request logging middleware
app.UseRequestLogging();

app.UseCors();

// Health check endpoint
app.MapGet("/health", (RuleLoaderService loader) => new
{
    Status = "Healthy",
    RuleSets = loader.ListRuleSetIds(),
    CurrentRuleSet = loader.GetCurrentRuleSetId(),
    Timestamp = DateTime.UtcNow
});

// API endpoints
app.MapPost("/api/determine", (DetermineRequest request, ChandamService service) =>
{
    // Use new method that returns BOTH table and beautified
    var response = service.DetermineWithBeautified(request);
    return Results.Ok(response);
});

app.MapPost("/api/try-match", (TryMatchRequest request, ChandamService service) =>
{
    // Use new method that returns BOTH table and beautified
    var response = service.TryMatchWithBeautified(request);
    return Results.Ok(response);
});

app.MapPost("/api/try-match-custom", (TryMatchCustomRequest request, ChandamService service) =>
{
    var response = service.TryMatchCustom(request);
    return Results.Ok(response);
});

app.MapPost("/api/scores", (ScoresRequest request, ChandamService service) =>
{
    var response = service.Scores(request);
    return Results.Ok(response);
});

app.MapGet("/api/rules/{ruleSetId}/{identifier}/samples", (string ruleSetId, string identifier, int? maxExamples, ChandamService service) =>
{
    var request = new GetSamplesRequest
    {
        RuleIdentifier = identifier,
        MaxExamples = maxExamples ?? 0,
        RuleSetId = ruleSetId
    };
    var response = service.GetSamples(request);

    if (response.ErrorMessage != null)
    {
        return Results.NotFound(response);
    }

    return Results.Ok(response);
});

app.MapGet("/api/rules/{ruleSetId}/{identifier}", (string ruleSetId, string identifier, ChandamService service) =>
{
    var request = new GetRuleInfoRequest
    {
        RuleIdentifier = identifier,
        IncludeExamples = true,
        RuleSetId = ruleSetId
    };
    var response = service.GetRuleInfo(request);

    if (response.ErrorMessage != null)
    {
        return Results.NotFound(response);
    }

    return Results.Ok(response);
});

app.MapGet("/api/rules/{ruleSetId:regex(^(chandam|popular|topella|chandam\\.min|popular\\.min|topella\\.min)$)}", (string ruleSetId, RuleLoaderService loader, ChandamService service, string? language) =>
{
    // Ensure the requested ruleset is active
    if (!string.IsNullOrEmpty(ruleSetId) && ruleSetId != loader.GetCurrentRuleSetId())
    {
        if (!loader.SetActiveRuleSet(ruleSetId))
        {
            return Results.BadRequest(new { error = $"Invalid RuleSet: {ruleSetId}" });
        }
    }

    // Parse language code (supports "te", "0", "Telugu", etc.)
    RuleLanguage? languageEnum = null;
    if (!string.IsNullOrWhiteSpace(language))
    {
        languageEnum = LanguageCodeMapper.ParseLanguage(language);
    }

    var rules = loader.GetAllRules(languageEnum);
    return Results.Ok(new
    {
        RuleSet = ruleSetId,
        TotalRules = rules.Count,
        Language = languageEnum?.ToString() ?? "All",
        LanguageCode = languageEnum.HasValue ? LanguageCodeMapper.ToLanguageCode(languageEnum.Value) : null,
        Rules = rules.Select(r => new
        {
            r.Identifier,
            r.Name,
            Type = r.PadyamType.ToString(),
            SubType = r.PadyamSubType.ToString(),
            Language = r.Language.ToString(),
            LanguageCode = LanguageCodeMapper.ToLanguageCode(r.Language),
            Frequency = r.Frequency.ToString(),
            r.Lines
        })
    });
});

// Search rules within a ruleset
app.MapGet("/api/rules/{ruleSetId}/search", (
    string ruleSetId,
    [FromQuery] string? query,
    [FromQuery] string? language,
    [FromQuery] string? categories,
    [FromQuery] string? chandam_names,
    [FromQuery] string? frequencies,
    [FromQuery] int? matra_length_min,
    [FromQuery] int? matra_length_max,
    [FromQuery] bool? has_examples,
    [FromQuery] int max_results,
    SearchService searchService) =>
{
    try
    {
        var lang = !string.IsNullOrEmpty(language)
            ? LanguageCodeMapper.ParseLanguage(language)
            : (RuleLanguage?)null;

        var filters = new RuleSearchFilters
        {
            Query = query,
            Categories = categories?.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(t => t.Trim()).ToList(),
            ChandamNames = chandam_names?.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).ToList(),
            Frequencies = frequencies?.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(f => f.Trim()).ToList(),
            MatraLengthMin = matra_length_min,
            MatraLengthMax = matra_length_max,
            HasExamples = has_examples,
            MaxResults = max_results > 0 ? max_results : 0
        };

        var results = searchService.SearchRules(filters, ruleSetId, lang);

        return Results.Ok(new
        {
            Success = true,
            Count = results.Count,
            RuleSetId = ruleSetId,
            Results = results
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { ErrorMessage = ex.Message });
    }
})
.WithName("SearchRules");

// Get facet counts for filter UI
app.MapGet("/api/rules/{ruleSetId}/facets", (
    string ruleSetId,
    [FromQuery] string? language,
    SearchService searchService) =>
{
    try
    {
        var lang = !string.IsNullOrEmpty(language)
            ? LanguageCodeMapper.ParseLanguage(language)
            : (RuleLanguage?)null;

        var facets = searchService.GetFacetCounts(ruleSetId, lang);

        return Results.Ok(new
        {
            Success = true,
            RuleSetId = ruleSetId,
            Facets = facets
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { ErrorMessage = ex.Message });
    }
})
.WithName("GetFacetCounts");

// Legacy endpoints (backward compatibility) - uses default "chandam" ruleset
app.MapGet("/api/rules/{identifier}/samples", (string identifier, int? maxExamples, ChandamService service) =>
{
    var request = new GetSamplesRequest
    {
        RuleIdentifier = identifier,
        MaxExamples = maxExamples ?? 0,
        RuleSetId = "chandam"
    };
    var response = service.GetSamples(request);

    if (response.ErrorMessage != null)
    {
        return Results.NotFound(response);
    }

    return Results.Ok(response);
});

app.MapGet("/api/rules/{identifier}", (string identifier, ChandamService service) =>
{
    var request = new GetRuleInfoRequest
    {
        RuleIdentifier = identifier,
        IncludeExamples = true,
        RuleSetId = "chandam"
    };
    var response = service.GetRuleInfo(request);

    if (response.ErrorMessage != null)
    {
        return Results.NotFound(response);
    }

    return Results.Ok(response);
});

// List supported languages
app.MapGet("/api/languages", () =>
{
    var languages = LanguageCodeMapper.GetSupportedLanguages();
    return Results.Ok(new
    {
        SupportedLanguages = languages.Select(kvp => new
        {
            Code = kvp.Key,
            Name = kvp.Value.ToString(),
            NumericValue = (int)kvp.Value
        })
    });
});

app.MapGet("/", () => Results.Redirect("/health"));

Console.WriteLine($"Chandam API starting...");
Console.WriteLine($"Rules path: {rulesPath}");
Console.WriteLine($"Active rule set: {ruleSet}");

app.Run();
