using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace Chandam.API.IntegrationTests
{
    public class SearchEndpointTests
    {
        private readonly HttpClient _client;
        private const string BaseUrl = "http://localhost:5000";

        public SearchEndpointTests()
        {
            _client = new HttpClient { BaseAddress = new Uri(BaseUrl) };
        }

        [Fact(Skip = "Requires running API server")]
        public async Task SearchRules_ByQuery_ReturnsResults()
        {
            var response = await _client.GetAsync("/api/rules/chandam/search?query=త్రిష్టుప్పు");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);

            Assert.True(doc.RootElement.GetProperty("Success").GetBoolean());
            var count = doc.RootElement.GetProperty("Count").GetInt32();
            Assert.True(count > 0);
        }

        [Fact(Skip = "Requires running API server")]
        public async Task SearchRules_WithMultipleFilters_ReturnsResults()
        {
            var response = await _client.GetAsync("/api/rules/chandam/search?types=Vruttam&char_length_min=10&char_length_max=15");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);

            Assert.True(doc.RootElement.GetProperty("Success").GetBoolean());
        }

        [Fact(Skip = "Requires running API server")]
        public async Task GetFacetCounts_ReturnsStructure()
        {
            var response = await _client.GetAsync("/api/rules/chandam/facets?language=te");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);

            Assert.True(doc.RootElement.GetProperty("Success").GetBoolean());
            var facets = doc.RootElement.GetProperty("Facets");
            Assert.True(facets.TryGetProperty("Types", out _));
            Assert.True(facets.TryGetProperty("SubTypes", out _));
        }

        internal void Dispose()
        {
            _client?.Dispose();
        }
    }
}
