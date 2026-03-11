using Chandam.MCP.Tools;

var builder = WebApplication.CreateBuilder(args);

var rulesDir = builder.Configuration["Chandam:RulesDirectory"] ?? "Chandam.Config/Rules";
builder.Services.AddChandamServices(rulesDir);

builder.Services
    .AddMcpServer()
    .WithHttpTransport()
    .WithTools<ChandamTools>();

var app = builder.Build();
app.MapMcp();
app.Run();
