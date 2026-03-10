using Chandam.Rules;
using System.Collections.Generic;

namespace Chandam.API.Models;

/// <summary>
/// Response containing the best matching Chandam(s) for a poem
/// </summary>
public class DetermineResponse
{
    /// <summary>
    /// List of top matching Chandams, ordered by match score
    /// </summary>
    public List<ChandamMatch> Matches { get; set; } = new();

    /// <summary>
    /// Whether any matches were found
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Error message if analysis failed
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Represents a single Chandam match result
/// </summary>
public class ChandamMatch
{
    /// <summary>
    /// Rule identifier (e.g., "iMdravajramu", "utpalamaala")
    /// </summary>
    public string Identifier { get; set; } = string.Empty;

    /// <summary>
    /// Rule name in Telugu (e.g., "ఇంద్రవజ్రము")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Match percentage (0-100)
    /// </summary>
    public double MatchPercentage { get; set; }

    /// <summary>
    /// Type of Chandam (Vruttam, Jati, UpaJati)
    /// </summary>
    public string PadyamType { get; set; } = string.Empty;

    /// <summary>
    /// Subtype classification
    /// </summary>
    public string PadyamSubType { get; set; } = string.Empty;

    /// <summary>
    /// Whether this Chandam is frequently used
    /// </summary>
    public string Frequency { get; set; } = string.Empty;

    /// <summary>
    /// Description/pattern of the Chandam in Telugu
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Match details (which lines matched, mismatches, etc.)
    /// </summary>
    public MatchDetails? Details { get; set; }
}

/// <summary>
/// Detailed match information
/// </summary>
public class MatchDetails
{
    /// <summary>
    /// Number of lines in the poem
    /// </summary>
    public int LineCount { get; set; }

    /// <summary>
    /// Number of lines that matched the rule
    /// </summary>
    public int MatchedLines { get; set; }

    /// <summary>
    /// Whether Yati (caesura) matched
    /// </summary>
    public bool YatiMatched { get; set; }

    /// <summary>
    /// Whether Prasa (rhyme) matched
    /// </summary>
    public bool PrasaMatched { get; set; }

    /// <summary>
    /// List of mismatches found (if any)
    /// </summary>
    public List<string>? Mismatches { get; set; }
}
