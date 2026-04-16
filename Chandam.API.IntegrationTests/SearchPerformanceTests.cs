using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Chandam.API.Services;
using Chandam.API.Models;
using Chandam.Rules;
using Xunit;
using Xunit.Abstractions;

namespace Chandam.API.IntegrationTests
{
    public class SearchPerformanceTests : IDisposable
    {
        private readonly ITestOutputHelper _output;
        private readonly RuleLoaderService _ruleLoader;
        private readonly SearchService _searchService;

        public SearchPerformanceTests(ITestOutputHelper output)
        {
            _output = output;
            _ruleLoader = new RuleLoaderService();
            _ruleLoader.LoadAllRuleSets();
            _searchService = new SearchService(_ruleLoader);
        }

        [Fact]
        public void SearchByExactTeluguName_Topella_CompletesUnder10ms()
        {
            // Arrange: Load topella (2,337 rules)
            _ruleLoader.SetActiveRuleSet("topella");
            var filters = new RuleSearchFilters { Query = "ఇంద్రవజ్ర" }; // Telugu name search

            // Warmup (avoid JIT compilation overhead)
            _searchService.SearchRules(filters, "topella");

            // Act
            var sw = Stopwatch.StartNew();
            var results = _searchService.SearchRules(filters, "topella");
            sw.Stop();

            // Assert
            _output.WriteLine($"Exact Telugu name search time: {sw.ElapsedMilliseconds}ms");
            _output.WriteLine($"Results found: {results.Count}");
            Assert.True(sw.ElapsedMilliseconds < 10, $"Search took {sw.ElapsedMilliseconds}ms, expected <10ms");
            Assert.NotEmpty(results);
        }

        [Fact]
        public void SearchByPartialTeluguName_Topella_CompletesUnder20ms()
        {
            // Arrange: Load topella
            _ruleLoader.SetActiveRuleSet("topella");
            var filters = new RuleSearchFilters { Query = "త్రి" }; // Partial Telugu name

            // Warmup
            _searchService.SearchRules(filters, "topella");

            // Act
            var sw = Stopwatch.StartNew();
            var results = _searchService.SearchRules(filters, "topella");
            sw.Stop();

            // Assert
            _output.WriteLine($"Partial Telugu name search time: {sw.ElapsedMilliseconds}ms");
            _output.WriteLine($"Results found: {results.Count}");
            Assert.True(sw.ElapsedMilliseconds < 20, $"Search took {sw.ElapsedMilliseconds}ms, expected <20ms");
        }

        [Fact]
        public void SearchByCategory_Topella_CompletesUnder15ms()
        {
            // Arrange: Load topella
            _ruleLoader.SetActiveRuleSet("topella");
            var filters = new RuleSearchFilters
            {
                Categories = new List<string> { "Vruttam" }
            };

            // Warmup
            _searchService.SearchRules(filters, "topella");

            // Act
            var sw = Stopwatch.StartNew();
            var results = _searchService.SearchRules(filters, "topella");
            sw.Stop();

            // Assert
            _output.WriteLine($"Category filter search time: {sw.ElapsedMilliseconds}ms for {results.Count} results");
            Assert.True(sw.ElapsedMilliseconds < 15, $"Search took {sw.ElapsedMilliseconds}ms, expected <15ms");
            Assert.NotEmpty(results);
        }

        [Fact]
        public void SearchByChandamName_Topella_CompletesUnder15ms()
        {
            // Arrange: Load topella
            _ruleLoader.SetActiveRuleSet("topella");
            var filters = new RuleSearchFilters
            {
                ChandamNames = new List<string> { "గాయత్రి" }
            };

            // Warmup
            _searchService.SearchRules(filters, "topella");

            // Act
            var sw = Stopwatch.StartNew();
            var results = _searchService.SearchRules(filters, "topella");
            sw.Stop();

            // Assert
            _output.WriteLine($"ChandamName filter search time: {sw.ElapsedMilliseconds}ms for {results.Count} results");
            Assert.True(sw.ElapsedMilliseconds < 15, $"Search took {sw.ElapsedMilliseconds}ms, expected <15ms");
        }

        [Fact]
        public void SearchWithAllFilters_Topella_CompletesUnder30ms()
        {
            // Arrange: Load topella
            _ruleLoader.SetActiveRuleSet("topella");
            var filters = new RuleSearchFilters
            {
                Query = "త్రి",
                Categories = new List<string> { "Vruttam" },
                MatraLengthMin = 10,
                MatraLengthMax = 20,
                HasExamples = true
            };

            // Warmup
            _searchService.SearchRules(filters, "topella");

            // Act
            var sw = Stopwatch.StartNew();
            var results = _searchService.SearchRules(filters, "topella");
            sw.Stop();

            // Assert
            _output.WriteLine($"Multi-filter search: {sw.ElapsedMilliseconds}ms for {results.Count} results");
            Assert.True(sw.ElapsedMilliseconds < 30, $"Search took {sw.ElapsedMilliseconds}ms, expected <30ms");
        }

        [Fact]
        public void GetFacetCounts_Topella_CompletesUnder20ms()
        {
            // Arrange: Load topella
            _ruleLoader.SetActiveRuleSet("topella");

            // Warmup
            _searchService.GetFacetCounts("topella");

            // Act
            var sw = Stopwatch.StartNew();
            var facets = _searchService.GetFacetCounts("topella");
            sw.Stop();

            // Assert
            _output.WriteLine($"Facet calculation: {sw.ElapsedMilliseconds}ms");
            _output.WriteLine($"Categories found: {facets.Categories.Count}");
            _output.WriteLine($"ChandamNames found: {facets.ChandamNames.Count}");
            Assert.True(sw.ElapsedMilliseconds < 20, $"Facets took {sw.ElapsedMilliseconds}ms, expected <20ms");
            Assert.NotEmpty(facets.Categories);
        }

        [Fact]
        public void GetRulesWithFacets_Topella_FasterThanSeparateCalls()
        {
            // Arrange: Load topella
            _ruleLoader.SetActiveRuleSet("topella");

            // Warmup
            _searchService.GetRulesWithFacets("topella");

            // Measure combined call
            var sw1 = Stopwatch.StartNew();
            var (rules, facets) = _searchService.GetRulesWithFacets("topella");
            sw1.Stop();

            // Measure separate calls
            var sw2 = Stopwatch.StartNew();
            var allRules = _ruleLoader.GetAllRules(RuleLanguage.Telugu);
            var separateFacets = _searchService.GetFacetCounts("topella");
            sw2.Stop();

            // Assert
            _output.WriteLine($"Combined call: {sw1.ElapsedMilliseconds}ms");
            _output.WriteLine($"Separate calls: {sw2.ElapsedMilliseconds}ms");
            _output.WriteLine($"Speedup: {(double)sw2.ElapsedMilliseconds / sw1.ElapsedMilliseconds:F2}x");

            Assert.True(sw1.ElapsedMilliseconds < sw2.ElapsedMilliseconds,
                "Combined call should be faster than separate calls");
            Assert.Equal(allRules.Count, rules.Count);
        }

        [Theory]
        [InlineData(10)]      // Small: 10 searches
        [InlineData(100)]     // Medium: 100 searches
        [InlineData(1000)]    // Large: 1000 searches
        public void SearchThroughput_MeasureOpsPerSecond(int iterations)
        {
            // Arrange: Load topella
            _ruleLoader.SetActiveRuleSet("topella");
            var filters = new RuleSearchFilters { Query = "త్రిష్టుప్పు" };

            // Warmup
            _searchService.SearchRules(filters, "topella");

            // Act
            var sw = Stopwatch.StartNew();
            for (int i = 0; i < iterations; i++)
            {
                _searchService.SearchRules(filters, "topella");
            }
            sw.Stop();

            // Calculate throughput
            var opsPerSecond = (iterations * 1000.0) / sw.ElapsedMilliseconds;
            _output.WriteLine($"Throughput: {opsPerSecond:F2} searches/second ({iterations} iterations in {sw.ElapsedMilliseconds}ms)");

            // Assert: Should handle at least 50 searches/second
            Assert.True(opsPerSecond > 50, $"Throughput {opsPerSecond:F2} ops/sec is below 50 ops/sec");
        }

        [Fact]
        public void IndexBuildTime_Topella_CompletesUnder50ms()
        {
            // Arrange: Create new loader
            var loader = new RuleLoaderService();

            // Act: Measure index build time during load
            var sw = Stopwatch.StartNew();
            loader.LoadAllRuleSets();
            loader.SetActiveRuleSet("topella");
            sw.Stop();

            // Assert
            _output.WriteLine($"Index build time (with ruleset load): {sw.ElapsedMilliseconds}ms");

            // Index building should add minimal overhead (<50ms total including load)
            Assert.True(sw.ElapsedMilliseconds < 50,
                $"Index build took {sw.ElapsedMilliseconds}ms, expected <50ms");
        }

        [Fact]
        public void SearchByCategory_Chandam_CompletesUnder5ms()
        {
            // Arrange: Load smaller chandam ruleset (379 rules)
            _ruleLoader.SetActiveRuleSet("chandam");
            var filters = new RuleSearchFilters
            {
                Categories = new List<string> { "Jati" }
            };

            // Warmup
            _searchService.SearchRules(filters, "chandam");

            // Act
            var sw = Stopwatch.StartNew();
            var results = _searchService.SearchRules(filters, "chandam");
            sw.Stop();

            // Assert
            _output.WriteLine($"Chandam category search time: {sw.ElapsedMilliseconds}ms for {results.Count} results");
            Assert.True(sw.ElapsedMilliseconds < 5, $"Search took {sw.ElapsedMilliseconds}ms, expected <5ms for smaller dataset");
        }

        public void Dispose()
        {
            // Cleanup if needed
        }
    }
}
