# Phase 4: Dictionary/Word Meanings MCP Tool

## Goal

Add a new MCP tool `get_word_meaning` that looks up Telugu word meanings from 3 external dictionary sources (Andhrabharati, Wiktionary, Shabdkosh), with disk-based caching. Ported from existing Python implementations in `Crawler/api/sources/`.

## Prerequisites

- Phase 2 complete: MCP servers (Stdio + HTTP) with 6 tools
- .NET 8 SDK

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| New `Chandam.Dictionary` project | Modifying existing business logic |
| 3 dictionary sources (C# ports) | Adding new dictionary sources |
| Disk-based caching (one file per word) | Cache TTL/expiry |
| New MCP tool: `get_word_meaning` | REST API endpoint for dictionary |
| Named HTTP clients with per-source config | Authentication |

---

## New Project: `Chandam.Dictionary`

### Structure
```
Chandam.Dictionary/
├── Chandam.Dictionary.csproj    # net8.0, deps: HtmlAgilityPack, Microsoft.Extensions.Http
├── Models/
│   └── DictionaryResult.cs      # { Source, Word, Status, Content, Error }
├── Sources/
│   ├── IDictionarySource.cs     # interface: Task<DictionaryResult> LookupAsync(string word)
│   ├── AndhrabharatiSource.cs   # Port from andhrabharati_httpx.py
│   ├── WiktionarySource.cs      # Port from wiktionary.py
│   └── ShabdkoshSource.cs       # Port from shabdkosh.py
├── Cache/
│   └── DiskCache.cs             # cache/{SHA256(word)}.json (one file per word)
├── Helpers/
│   └── HtmlCleaner.cs           # Port strip_html from base.py (using HtmlAgilityPack)
└── Services/
    └── DictionaryService.cs     # Queries all 3 sources in parallel, returns combined result
```

### Key Dependencies
- `HtmlAgilityPack` - HTML parsing (C# equivalent of BeautifulSoup)
- `Microsoft.Extensions.Http` - IHttpClientFactory support

### HTTP Client Configuration
- SSL cert bypass via `HttpClientHandler.ServerCertificateCustomValidationCallback`
- Named clients per source with different timeouts/headers
- Auto-redirect enabled by default (matches Python `follow_redirects=True`)

---

## Dictionary Sources

### 1. AndhrabharatiSource
- **Original**: `Crawler/api/sources/andhrabharati_httpx.py`
- POST to `https://andhrabharati.com/dictionary/getWM.php`
- Custom headers (User-Agent, X-Requested-With, Origin, Referer, X-Ps-Ext)
- Custom cookies (te_iLang, te_iScript, te_oScript, etc.)
- Timeout: 15s

### 2. WiktionarySource
- **Original**: `Crawler/api/sources/wiktionary.py`
- MediaWiki Parse API for Telugu + English Wiktionary in parallel
- Response path: `data["parse"]["text"]["*"]`
- Timeout: 10s

### 3. ShabdkoshSource
- **Original**: `Crawler/api/sources/shabdkosh.py`
- GET `https://www.shabdkosh.com/search-dictionary?lc=te&sl=en&tl=te&e={word}`
- Content extraction: `#ehresults` div with noise marker truncation
- Timeout: 10s

### HtmlCleaner
- **Original**: `Crawler/api/sources/base.py` `strip_html()`
- Removes script/style/meta tags, Wiktionary edit sections
- Regex cleanup of edit brackets, close-button artifacts
- Collapses blank lines, strips whitespace

---

## Disk Cache

- One JSON file per word: `cache/{SHA256(word)}.json`
- Contains `List<DictionaryResult>` (all 3 sources)
- **Partial results returned** to caller (failed sources get `status="error"`)
- **Cache all-or-nothing**: only write when all 3 sources return `status="success"`
- No TTL/expiry - dictionary definitions are stable
- Configurable cache directory

---

## MCP Tool

### `get_word_meaning`
Look up the meaning of a Telugu word from multiple dictionary sources.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `word` | string | yes | The Telugu word to look up |

**Returns**: JSON array of results from all 3 sources, each with `source`, `word`, `status`, `content`, `error`.

---

## DI Registration (ServiceRegistration.cs)

- Named HTTP clients: `andhrabharati` (15s), `wiktionary` (10s), `shabdkosh` (10s)
- SSL bypass on all clients
- Singleton: `DiskCache`, all 3 sources, `DictionaryService`

---

## Test Results

### Existing Tests: 13/13 Passed (no regressions)
### Builds: Dictionary, MCP.Tools, MCP.Stdio, MCP.Http all succeed
