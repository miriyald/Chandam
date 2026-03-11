using Chandam.MCP.Tools;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var builder = Host.CreateApplicationBuilder(args);

// Suppress console logging to stderr only (stdout is reserved for JSON-RPC protocol)
builder.Logging.ClearProviders();
builder.Logging.AddConsole(options => options.LogToStandardErrorThreshold = LogLevel.Trace);

var rulesDir = args
    .FirstOrDefault(a => a.StartsWith("--rules-dir="))
    ?.Split('=', 2)[1];

// RuleLoaderService uses Console.WriteLine during init.
// Temporarily redirect Console.Out to stderr to keep stdout clean for MCP protocol.
var originalOut = Console.Out;
Console.SetOut(Console.Error);
builder.Services.AddChandamServices(rulesDir);
Console.SetOut(originalOut);

builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithTools<ChandamTools>();

var app = builder.Build();
await app.RunAsync();
