using System.Collections.Generic;

namespace Chandam.API.Models;

/// <summary>
/// Response containing match scores for all Chandam rules
/// </summary>
public class ScoresResponse
{
    /// <summary>
    /// List of all Chandam rules with their match scores
    /// Sorted by match percentage (descending)
    /// </summary>
    public List<ChandamScore> Scores { get; set; } = new();

    /// <summary>
    /// Total number of rules evaluated
    /// </summary>
    public int TotalRulesEvaluated { get; set; }

    /// <summary>
    /// Error message if scoring failed
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Represents the match score for a single Chandam rule
/// </summary>
public class ChandamScore
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
    /// Frequency (Frequent, Rare)
    /// </summary>
    public string Frequency { get; set; } = string.Empty;
}
