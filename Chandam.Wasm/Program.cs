using System;
using System.Net.Http;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Chandam.API.Services;
using Chandam.Wasm;
using Chandam.Wasm.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddSingleton<RuleLoaderService>();
builder.Services.AddScoped<ChandamService>();
builder.Services.AddScoped<WasmRuleLoaderService>();

var host = builder.Build();

// Load rules before app starts
var wasmLoader = host.Services.GetRequiredService<WasmRuleLoaderService>();
await wasmLoader.InitializeAsync();

await host.RunAsync();
