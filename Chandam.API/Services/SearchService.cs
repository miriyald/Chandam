using Chandam.API.Models;
using Chandam.Rules;
using Chandam.Util;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Chandam.API.Services
{
    public class SearchService
    {
        private readonly RuleLoaderService _ruleLoader;

        public SearchService(RuleLoaderService ruleLoader)
        {
            _ruleLoader = ruleLoader;
        }

        /// <summary>
        /// Search and filter rules within a specific ruleset
        /// </summary>
        public List<RuleSummaryDetailed> SearchRules(
            RuleSearchFilters filters,
            string? ruleSetId = null,
            RuleLanguage? language = null)
        {
            // Ensure correct ruleset is active
            if (!string.IsNullOrEmpty(ruleSetId))
            {
                _ruleLoader.SetActiveRuleSet(ruleSetId);
            }

            // Get all rules for language
            var allRules = _ruleLoader.GetAllRules(language);

            // Convert to detailed DTOs (reuse existing logic from GetAllRulesDetailed)
            var detailedRules = ConvertToDetailed(allRules);

            // Apply filters
            var filtered = ApplyFilters(detailedRules, filters, ruleSetId);

            return filtered;
        }

        private List<RuleSummaryDetailed> ConvertToDetailed(List<Rule> rules)
        {
            // Pre-allocate exact capacity to avoid resizing
            var result = new List<RuleSummaryDetailed>(rules.Count);

            foreach (var r in rules)
            {
                try
                {
                    var detail = new RuleSummaryDetailed
                    {
                        Identifier = r.Identifier,
                        Name = r.Name,
                        PadyamType = r.PadyamType.ToString(),
                        PadyamSubType = r.PadyamSubType.ToString(),
                        Frequency = r.Frequency.ToString(),
                        Lines = r.Lines,
                        ChandamName = r.ChandamName,
                        CharLength = r.CharLength,
                        MatraLength = r.MatraLength,
                        Sequence = r.Sequence,
                        ShortName = r.ShortName,
                        Alias = r.Alias,
                        ExamplesCount = r.Examples2?.Length ?? 0
                    };

                    // Try to get Min/Max - check rule type first to avoid exceptions
                    // RowWiseRules don't have Min/Max (Akkara, Divpada, Sisamu, DaMDakamu)
                    var ruleType = r.GetType().Name;
                    if (ruleType != "RowWiseRule" && ruleType != "AkkaraRule" &&
                        ruleType != "DivpadaRule" && ruleType != "SisamuRule" &&
                        ruleType != "DaMDakamuRule")
                    {
                        try
                        {
                            detail.Min = r.Min;
                            detail.Max = r.Max;
                        }
                        catch (InvalidCastException)
                        {
                            // Fallback: skip min/max for this rule type
                        }
                    }

                    result.Add(detail);
                }
                catch (Exception ex)
                {
                    // Log and skip problematic rules
                    Console.Error.WriteLine($"Skipping rule {r.Identifier}: {ex.Message}");
                }
            }

            return result;
        }

        private List<RuleSummaryDetailed> ApplyFilters(List<RuleSummaryDetailed> rules, RuleSearchFilters filters, string? ruleSetId)
        {
            IEnumerable<RuleSummaryDetailed>? filtered = null;
            var activeRuleSetId = ruleSetId ?? _ruleLoader.GetCurrentRuleSetId();

            // 1. Text search optimization - Telugu name search only
            if (!string.IsNullOrWhiteSpace(filters.Query))
            {
                var query = filters.Query.Trim();

                // Fast path: exact Telugu name lookup O(1)
                var nameMatches = _ruleLoader.GetRulesByName(query, activeRuleSetId);
                if (nameMatches.Count > 0)
                {
                    // Found exact Telugu name match(es)
                    filtered = ConvertToDetailed(nameMatches).AsEnumerable();
                }
                else
                {
                    // Fallback: substring search on Name field only O(n)
                    var queryLower = query.ToLowerInvariant();
                    filtered = (filtered ?? rules.AsEnumerable())
                        .Where(r => r.Name.ToLowerInvariant().Contains(queryLower));
                }
            }

            // 2. Category filter (PadyamSubType) - use index for fast lookup
            // Support both Categories (new) and SubTypes (backward compatibility)
            var categories = filters.Categories ?? filters.SubTypes;
            if (categories != null && categories.Count > 0)
            {
                if (filtered == null)
                {
                    // No prior filters - use index directly
                    var matchingRules = _ruleLoader.GetRulesBySubTypes(categories, activeRuleSetId);
                    filtered = ConvertToDetailed(matchingRules).AsEnumerable();
                }
                else
                {
                    // Apply as filter to existing results
                    var categorySet = new HashSet<string>(categories, StringComparer.OrdinalIgnoreCase);
                    filtered = filtered.Where(r => categorySet.Contains(r.PadyamSubType));
                }
            }

            // 3. ChandamName filter (for Vruttam only) - use index for fast lookup
            if (filters.ChandamNames != null && filters.ChandamNames.Count > 0)
            {
                if (filtered == null)
                {
                    // No prior filters - use index directly
                    var matchingRules = _ruleLoader.GetRulesByChandamNames(filters.ChandamNames, activeRuleSetId);
                    filtered = ConvertToDetailed(matchingRules).AsEnumerable();
                }
                else
                {
                    // Apply as filter to existing results
                    var chandamSet = new HashSet<string>(filters.ChandamNames, StringComparer.OrdinalIgnoreCase);
                    filtered = filtered.Where(r => !string.IsNullOrEmpty(r.ChandamName) && chandamSet.Contains(r.ChandamName));
                }
            }

            // Start with all rules if no index-based filters applied
            if (filtered == null)
            {
                filtered = rules.AsEnumerable();
            }

            // 4. Frequency filter
            if (filters.Frequencies != null && filters.Frequencies.Count > 0)
            {
                var freqSet = new HashSet<string>(filters.Frequencies, StringComparer.OrdinalIgnoreCase);
                filtered = filtered.Where(r => freqSet.Contains(r.Frequency));
            }

            // 5. Examples filter (boolean check)
            if (filters.HasExamples.HasValue)
            {
                var hasExamples = filters.HasExamples.Value;
                filtered = filtered.Where(r => (r.ExamplesCount > 0) == hasExamples);
            }

            // 6. Matra length range - exclude -1 and undefined
            if (filters.MatraLengthMin.HasValue || filters.MatraLengthMax.HasValue)
            {
                filtered = filtered.Where(r => r.MatraLength.HasValue && r.MatraLength.Value > 0);

                if (filters.MatraLengthMin.HasValue)
                {
                    filtered = filtered.Where(r => r.MatraLength >= filters.MatraLengthMin.Value);
                }

                if (filters.MatraLengthMax.HasValue)
                {
                    filtered = filtered.Where(r => r.MatraLength <= filters.MatraLengthMax.Value);
                }
            }

            // 7. Apply result limit
            if (filters.MaxResults > 0)
            {
                filtered = filtered.Take(filters.MaxResults);
            }

            return filtered.ToList();
        }

        /// <summary>
        /// Get facet counts for filter UI (cached per ruleset + language)
        /// </summary>
        public FacetCounts GetFacetCounts(string? ruleSetId = null, RuleLanguage? language = null)
        {
            if (!string.IsNullOrEmpty(ruleSetId))
            {
                _ruleLoader.SetActiveRuleSet(ruleSetId);
            }

            // Check cache first
            var cached = _ruleLoader.GetCachedFacets(language);
            if (cached is FacetCounts cachedFacets)
            {
                return cachedFacets;
            }

            // Not cached - calculate and cache
            var allRules = _ruleLoader.GetAllRules(language);
            var detailedRules = ConvertToDetailed(allRules);
            var facets = CalculateFacetCounts(detailedRules);

            // Cache for next time
            _ruleLoader.CacheFacets(facets, language);

            return facets;
        }

        /// <summary>
        /// Get rules and facets in one call (optimization for WASM)
        /// Avoids duplicate rule conversions
        /// </summary>
        public (List<RuleSummaryDetailed> Rules, FacetCounts Facets) GetRulesWithFacets(string? ruleSetId = null, RuleLanguage? language = null)
        {
            if (!string.IsNullOrEmpty(ruleSetId))
            {
                _ruleLoader.SetActiveRuleSet(ruleSetId);
            }

            // Convert rules once
            var allRules = _ruleLoader.GetAllRules(language);
            var detailedRules = ConvertToDetailed(allRules);

            // Check if facets are cached
            var cached = _ruleLoader.GetCachedFacets(language);
            FacetCounts facets;

            if (cached is FacetCounts cachedFacets)
            {
                facets = cachedFacets;
            }
            else
            {
                // Calculate and cache facets
                facets = CalculateFacetCounts(detailedRules);
                _ruleLoader.CacheFacets(facets, language);
            }

            return (detailedRules, facets);
        }

        private FacetCounts CalculateFacetCounts(List<RuleSummaryDetailed> rules)
        {
            var categories = new Dictionary<string, int>();
            var chandamNames = new Dictionary<string, int>();
            var frequencies = new Dictionary<string, int>();
            int matraLengthMin = int.MaxValue;
            int matraLengthMax = int.MinValue;
            int withExamples = 0;
            int withoutExamples = 0;

            foreach (var rule in rules)
            {
                // Category counts (PadyamSubType) - exclude "Unspecified"
                if (!string.IsNullOrEmpty(rule.PadyamSubType) && rule.PadyamSubType != "Unspecified")
                {
                    categories[rule.PadyamSubType] = categories.GetValueOrDefault(rule.PadyamSubType) + 1;
                }

                // ChandamName counts (for Vruttam only)
                // Matches UI grouping: groupKey = `vruttam:${rule.chandamName}`
                if (rule.PadyamType == "Vruttam" &&
                    rule.PadyamSubType == "Vruttam" &&
                    !string.IsNullOrEmpty(rule.ChandamName))
                {
                    chandamNames[rule.ChandamName] = chandamNames.GetValueOrDefault(rule.ChandamName) + 1;
                }

                // Frequency counts
                if (!string.IsNullOrEmpty(rule.Frequency))
                {
                    frequencies[rule.Frequency] = frequencies.GetValueOrDefault(rule.Frequency) + 1;
                }

                // Matra length range - exclude -1 and undefined
                if (rule.MatraLength.HasValue && rule.MatraLength.Value > 0)
                {
                    matraLengthMin = Math.Min(matraLengthMin, rule.MatraLength.Value);
                    matraLengthMax = Math.Max(matraLengthMax, rule.MatraLength.Value);
                }

                // Examples count
                if (rule.ExamplesCount > 0)
                    withExamples++;
                else
                    withoutExamples++;
            }

            return new FacetCounts
            {
                Categories = categories,
                ChandamNames = chandamNames,
                Frequencies = frequencies,
                MatraLengthRange = new Range
                {
                    Min = matraLengthMin == int.MaxValue ? 0 : matraLengthMin,
                    Max = matraLengthMax == int.MinValue ? 0 : matraLengthMax
                },
                WithExamples = withExamples,
                WithoutExamples = withoutExamples
            };
        }
    }

    public class RuleSummaryDetailed
    {
        public string Identifier { get; set; }
        public string Name { get; set; }
        public string PadyamType { get; set; }
        public string PadyamSubType { get; set; }
        public string Frequency { get; set; }
        public int Lines { get; set; }
        public string? ChandamName { get; set; }
        public int? CharLength { get; set; }
        public int? MatraLength { get; set; }
        public int? Min { get; set; }
        public int? Max { get; set; }
        public string? Sequence { get; set; }
        public string? ShortName { get; set; }
        public string? Alias { get; set; }
        public int ExamplesCount { get; set; }
    }

    public class FacetCounts
    {
        public Dictionary<string, int> Categories { get; set; }       // PadyamSubType counts (was SubTypes)
        public Dictionary<string, int> ChandamNames { get; set; }     // ChandamName counts for Vruttam only
        public Dictionary<string, int> Frequencies { get; set; }
        public Range MatraLengthRange { get; set; }                   // Keep - independent of character length
        public int WithExamples { get; set; }
        public int WithoutExamples { get; set; }
    }

    public class Range
    {
        public int Min { get; set; }
        public int Max { get; set; }
    }
}
