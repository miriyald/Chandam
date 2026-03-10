using Chandam.API.Models;
using Chandam.API.Services;
using Chandam.Rules;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Unicode;

var builder = WebApplication.CreateBuilder(args);

// Configure JSON options to preserve Telugu characters
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Encoder = JavaScriptEncoder.Create(UnicodeRanges.All);
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.SerializerOptions.WriteIndented = true;
});

// Register Chandam services
var rulesPath = builder.Configuration.GetValue<string>("Chandam:RulesPath") ?? "config/rules";
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
    var response = service.Determine(request);
    return Results.Ok(response);
});

app.MapPost("/api/try-match", (TryMatchRequest request, ChandamService service) =>
{
    var response = service.TryMatch(request);
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

app.MapGet("/api/rules", (RuleLoaderService loader, RuleLanguage? language) =>
{
    var rules = loader.GetAllRules(language);
    return Results.Ok(new
    {
        TotalRules = rules.Count,
        Rules = rules.Select(r => new
        {
            r.Identifier,
            r.Name,
            Type = r.PadyamType.ToString(),
            SubType = r.PadyamSubType.ToString(),
            Language = r.Language.ToString(),
            Frequency = r.Frequency.ToString(),
            r.Lines
        })
    });
});

app.MapGet("/", () => Results.Redirect("/health"));

Console.WriteLine($"Chandam API starting...");
Console.WriteLine($"Rules path: {rulesPath}");
Console.WriteLine($"Active rule set: {ruleSet}");

app.Run();
