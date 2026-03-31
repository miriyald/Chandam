# WASM JSON Compression Options

## Current Situation

**WASM loads**:
- `telugu-complete.json` - 481KB (379 rules)
- `telugu-complete-examples.json` - 325KB (317 rules with examples)
- **Total**: 806KB

## Compression Strategies

### 1. **Brotli Compression (Recommended)**

Most web servers (including GitHub Pages, Netlify, Vercel) automatically serve `.br` files if available.

**Advantages**:
- 70-80% compression for JSON (expect ~160KB total)
- Zero code changes in WASM
- Transparent to browser (automatic decompression)
- Best compression ratio for text

**Implementation**:
```bash
# Pre-compress files at build time
brotli -q 11 telugu-complete.json
brotli -q 11 telugu-complete-examples.json

# Deploy both .json and .json.br files
# Server automatically serves .br if Accept-Encoding: br header present
```

**MSBuild Integration** (Chandam.Wasm.csproj):
```xml
<Target Name="CompressBrotli" AfterTargets="Publish">
  <Exec Command="brotli -q 11 $(PublishDir)wwwroot/data/*.json" />
</Target>
```

**Expected Result**: ~160KB total download (80% reduction)

---

### 2. **Gzip Compression**

Fallback for older servers/browsers.

**Advantages**:
- 60-70% compression (expect ~240KB total)
- Universal support
- Transparent to browser

**Implementation**:
```bash
gzip -9 telugu-complete.json
gzip -9 telugu-complete-examples.json
```

**Expected Result**: ~240KB total (70% reduction)

---

### 3. **Binary Formats (Not Recommended)**

#### MessagePack
- **Compression**: 20-30% smaller than JSON
- **Cost**: Requires C# library (MessagePack-CSharp, ~120KB)
- **Net Result**: Negative (more bytes than compression saves)

#### Protocol Buffers (Protobuf)
- **Compression**: 30-40% smaller than JSON
- **Cost**: Requires schema + library (~200KB)
- **Net Result**: Negative

---

### 4. **JSON Minification (Quick Win)**

Remove whitespace from JSON files.

**Implementation**:
```csharp
// In GenerateRulesJSON.cs
var json = JsonSerializer.Serialize(ruleSet, new JsonSerializerOptions
{
    WriteIndented = false,  // Change to false
    Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
});
```

**Advantages**:
- Free (no runtime cost)
- ~25-30% smaller files (expect ~560KB total)

**Disadvantages**:
- JSON files harder to debug/read

**Expected Result**: ~560KB total (30% reduction)

---

### 5. **Differential Loading**

Load rules on-demand instead of all upfront.

**Strategy**:
```
Load Priority:
1. Frequent rules (14 rules) - 19KB
2. User requests analysis → Load full rules (481KB)
3. User views examples → Load examples (325KB)
```

**Implementation**:
```csharp
// Initial load
await LoadRulesAsync("data/chandam-rules.json");  // 19KB

// Lazy load when needed
if (needFullRules)
    await LoadRulesAsync("data/telugu-complete.json");  // 481KB

if (showExamples)
    await LoadExamplesAsync("data/telugu-complete-examples.json");  // 325KB
```

**Expected Result**: 19KB initial load (98% reduction)

---

### 6. **IndexedDB Caching**

Cache rules in browser storage after first load.

**Advantages**:
- Load once, cache forever (until updated)
- No network request on subsequent visits
- Works with Service Workers

**Implementation**:
```csharp
// Check IndexedDB first
var cachedRules = await GetFromIndexedDB("telugu-complete");
if (cachedRules != null && cachedRules.Version == currentVersion)
{
    return cachedRules.Data;
}

// Load from network and cache
var rules = await HttpClient.GetStringAsync("data/telugu-complete.json");
await SaveToIndexedDB("telugu-complete", rules, currentVersion);
```

---

## Recommended Approach

### **Phase 1: Quick Wins (No Code Changes)**

1. **Brotli compression** - 80% reduction → ~160KB
2. **JSON minification** - Build with `WriteIndented = false`
3. **Server configuration** - Enable Brotli/Gzip serving

**Total**: ~160KB download (from 806KB)

### **Phase 2: Smart Loading**

1. **Differential loading** - Start with frequent rules (19KB)
2. **Lazy load** full rules when needed
3. **IndexedDB caching** - Cache after first load

**Total**: 19KB initial, cached thereafter

---

## Implementation Steps

### 1. Add Brotli Compression to Build

```xml
<!-- Chandam.Wasm/Chandam.Wasm.csproj -->
<Target Name="CompressDataFiles" AfterTargets="Publish">
  <Exec Condition="Exists('/usr/bin/brotli') Or Exists('C:\Program Files\brotli\brotli.exe')"
        Command="brotli -q 11 -k $(PublishDir)wwwroot/data/*.json" />
  <Message Condition="!Exists('/usr/bin/brotli') And !Exists('C:\Program Files\brotli\brotli.exe')"
           Text="Warning: brotli not found. Install: npm install -g brotli" />
</Target>
```

### 2. JSON Minification

```csharp
// Chandam.Tasks/GenerateRulesJSON.cs - Change WriteIndented to false
var json = JsonSerializer.Serialize(ruleSet, new JsonSerializerOptions
{
    WriteIndented = false,  // Minified JSON
    Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
});
```

### 3. Configure Server (GitHub Pages example)

```yaml
# .github/workflows/deploy.yml
- name: Compress data files
  run: |
    cd Chandam.Wasm/bin/Release/net8.0/publish/wwwroot/data
    for file in *.json; do
      brotli -q 11 -k "$file"
      gzip -9 -k "$file"
    done
```

### 4. Verify Compression

```bash
# Check file sizes
ls -lh Chandam.Wasm/bin/Release/net8.0/publish/wwwroot/data/

# Expected:
# telugu-complete.json      481K
# telugu-complete.json.br    96K (80% smaller)
# telugu-complete.json.gz   145K (70% smaller)
```

---

## Size Comparison

| Strategy | Initial (KB) | After (KB) | Reduction | Effort |
|----------|--------------|------------|-----------|--------|
| Current | 806 | 806 | 0% | - |
| JSON Minify | 806 | 560 | 30% | 1 line |
| Gzip | 806 | 240 | 70% | Low |
| **Brotli** | **806** | **~160** | **80%** | **Low** |
| Differential Load | 806 | 19* | 98%* | Medium |
| IndexedDB | 806 | 0** | 100%** | High |

\* Initial load only, full data loaded on-demand  
\*\* After first visit

---

## Conclusion

**Best approach**: Brotli + JSON minification
- **Minimal effort**: Build-time compression
- **Maximum impact**: 80% size reduction
- **No code changes**: Works transparently
- **Expected result**: ~160KB total (from 806KB)

**Next level**: Add differential loading for 19KB initial load.
