using Chandam.API.Converters;
using Chandam.API.Helpers;
using Chandam.API.Models;
using Chandam.API.Services;
using Chandam.API.WebApi.Middleware;
using Chandam.Rules;
using System.Text.Encodings.Web;
using System.Text.Json;
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
var rulesPath = builder.Configuration.GetValue<string>("Chandam:RulesPath") ?? "Chandam.Config/Rules";
var ruleSet = builder.Configuration.GetValue<string>("Chandam:RuleSet") ??
              Environment.GetEnvironmentVariable("CHANDAM_RULESET") ?? "default";

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

app.MapGet("/api/rules/{identifier}", (string identifier, ChandamService service) =>
{
    var request = new GetRuleInfoRequest
    {
        RuleIdentifier = identifier,
        IncludeExamples = true
    };
    var response = service.GetRuleInfo(request);

    if (response.ErrorMessage != null)
    {
        return Results.NotFound(response);
    }

    return Results.Ok(response);
});

app.MapGet("/api/rules/{identifier}/samples", (string identifier, int? maxExamples, ChandamService service) =>
{
    var request = new GetSamplesRequest
    {
        RuleIdentifier = identifier,
        MaxExamples = maxExamples ?? 0
    };
    var response = service.GetSamples(request);

    if (response.ErrorMessage != null)
    {
        return Results.NotFound(response);
    }

    return Results.Ok(response);
});

app.MapGet("/api/rules", (RuleLoaderService loader, string? language) =>
{
    // Parse language code (supports "te", "0", "Telugu", etc.)
    RuleLanguage? languageEnum = null;
    if (!string.IsNullOrWhiteSpace(language))
    {
        languageEnum = LanguageCodeMapper.ParseLanguage(language);
    }

    var rules = loader.GetAllRules(languageEnum);
    return Results.Ok(new
    {
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
