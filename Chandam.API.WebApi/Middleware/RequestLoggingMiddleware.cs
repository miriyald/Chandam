using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace Chandam.API.WebApi.Middleware;

/// <summary>
/// Middleware to log HTTP requests and responses with timing metrics
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        var stopwatch = Stopwatch.StartNew();

        // Log request
        await LogRequestAsync(context, requestId);

        // Capture response
        var originalBodyStream = context.Response.Body;
        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{RequestId}] Unhandled exception during request processing", requestId);
            throw;
        }
        finally
        {
            stopwatch.Stop();

            // Log response
            await LogResponseAsync(context, requestId, stopwatch.ElapsedMilliseconds);

            // Copy response back to original stream
            responseBody.Seek(0, SeekOrigin.Begin);
            await responseBody.CopyToAsync(originalBodyStream);
        }
    }

    private async Task LogRequestAsync(HttpContext context, string requestId)
    {
        var request = context.Request;

        // Read request body for debug logging
        request.EnableBuffering();
        var requestBody = await ReadBodyAsync(request.Body);
        request.Body.Position = 0;

        // Log concise info at Information level
        _logger.LogInformation("[{RequestId}] {Method} {Path} - ContentLength: {ContentLength}",
            requestId,
            request.Method,
            request.Path + request.QueryString,
            request.ContentLength ?? 0);

        // Log detailed info at Debug level
        if (_logger.IsEnabled(LogLevel.Debug))
        {
            var logMessage = new StringBuilder();
            logMessage.AppendLine($"[{requestId}] HTTP Request Details:");
            logMessage.AppendLine($"  Method: {request.Method}");
            logMessage.AppendLine($"  Path: {request.Path}{request.QueryString}");
            logMessage.AppendLine($"  ContentType: {request.ContentType}");
            logMessage.AppendLine($"  ContentLength: {request.ContentLength ?? 0}");

            if (!string.IsNullOrEmpty(requestBody) && requestBody.Length < 2000)
            {
                logMessage.AppendLine($"  Body: {TruncateForLog(requestBody, 1000)}");
            }

            _logger.LogDebug(logMessage.ToString());
        }
    }

    private async Task LogResponseAsync(HttpContext context, string requestId, long elapsedMs)
    {
        var response = context.Response;

        // Read response body for debug logging
        response.Body.Seek(0, SeekOrigin.Begin);
        var responseBody = await ReadBodyAsync(response.Body);
        response.Body.Seek(0, SeekOrigin.Begin);

        var logLevel = response.StatusCode >= 400 ? LogLevel.Warning : LogLevel.Information;

        // Log concise summary at Information/Warning level
        _logger.Log(logLevel,
            "[{RequestId}] {Method} {Path} → {StatusCode} in {Duration}ms",
            requestId,
            context.Request.Method,
            context.Request.Path,
            response.StatusCode,
            elapsedMs);

        // Log detailed response at Debug level
        if (_logger.IsEnabled(LogLevel.Debug))
        {
            var logMessage = new StringBuilder();
            logMessage.AppendLine($"[{requestId}] HTTP Response Details:");
            logMessage.AppendLine($"  StatusCode: {response.StatusCode}");
            logMessage.AppendLine($"  ContentType: {response.ContentType}");
            logMessage.AppendLine($"  ContentLength: {response.ContentLength ?? responseBody.Length}");
            logMessage.AppendLine($"  Duration: {elapsedMs}ms");

            if (!string.IsNullOrEmpty(responseBody) && responseBody.Length < 2000)
            {
                logMessage.AppendLine($"  Body: {TruncateForLog(responseBody, 1000)}");
            }

            _logger.LogDebug(logMessage.ToString());
        }
    }

    private static async Task<string> ReadBodyAsync(Stream body)
    {
        using var reader = new StreamReader(body, Encoding.UTF8, leaveOpen: true);
        var content = await reader.ReadToEndAsync();
        return content;
    }

    private static string TruncateForLog(string text, int maxLength)
    {
        if (string.IsNullOrEmpty(text) || text.Length <= maxLength)
            return text;

        return text.Substring(0, maxLength) + "... (truncated)";
    }
}

/// <summary>
/// Extension methods for RequestLoggingMiddleware
/// </summary>
public static class RequestLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestLoggingMiddleware>();
    }
}
