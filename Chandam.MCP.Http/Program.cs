using Chandam.MCP.Tools;

var builder = WebApplication.CreateBuilder(args);

var configuredRulesPath = builder.Configuration["Chandam:RulesDirectory"] ?? "Chandam.Config/Rules";
var rulesDir = Path.IsPathRooted(configuredRulesPath)
    ? configuredRulesPath
    : Path.Combine(Directory.GetParent(builder.Environment.ContentRootPath)!.FullName, configuredRulesPath);
builder.Services.AddChandamServices(rulesDir);

builder.Services
    .AddMcpServer()
    .WithHttpTransport()
    .WithTools<ChandamTools>()
    .WithTools<AvadhaanamTools>();

var app = builder.Build();
app.MapMcp();
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Service = "Chandam.MCP.Http" }));
app.Run();
