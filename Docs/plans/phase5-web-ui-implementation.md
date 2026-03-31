# Plan: Convert Chandam.Wasm to Minimal Blazor + TypeScript/Vite UI

## Context

The current Chandam.Wasm project is a **full Blazor WebAssembly app** with 9 Razor files providing the UI. The goal is to convert it to a **minimal Blazor bootstrap** (WASM runtime, DI, JSInvokable bridge only) with a **pure HTML/CSS/TypeScript frontend** built via Vite.

**Why:** The current Blazor UI is not mobile-friendly and lacks modern interactivity. A TypeScript-based UI with mobile-first design, collapsible accordions, and client-side routing will provide a better user experience. Blazor remains only for its battle-tested WASM bootstrapping and clean JSInvokable interop.

**Implementation approach:** This plan focuses on **functional baseline** with minimal styles. A separate future phase will handle UI/UX polish, animations, accessibility, and design refinement. Get it working first, then make it beautiful.

**Current state:**
- Full Blazor app: 9 Razor files (App, MainLayout, 4 Pages, 2 Components, _Imports)
- [Chandam.Wasm/Program.cs](../../../Chandam.Wasm/Program.cs): Boots Blazor, loads rules via WasmRuleLoaderService
- No JSInvokable methods exist yet
- [Chandam.Wasm/wwwroot/](../../../Chandam.Wasm/wwwroot/): index.html (Blazor shell), css/app.css, data/telugu-complete.json

**User requirements:**
- Minimal Blazor (bootstrap only)
- Pure HTML/CSS/TypeScript with Vite
- Multi-page routing: /, /analyze, /about, /credits, /contact
- Mobile-first design with accordion sections
- MSBuild integration: `dotnet publish` runs `npm build`
- Playwright automated tests
- Focus on `/analyze` page (main editor) - other pages are placeholder shells
- Noto Sans Telugu from Google Fonts CDN
- **Rule set switching**: User can select between rule sets (Frequent/Complete) via UI
- **Brotli compression**: Use `.min.json.br` files (92% size reduction: 9.3KB frequent, 65KB complete)
- **Centralized config**: Rule sets defined in `config.ts` with short names

---

## Architecture

```
Blazor WASM runtime → Loads default rule set (frequent, 9.3KB) → Signals onWasmReady()
     ↓
TypeScript Router (history.pushState) → Loads pages or renders UI
     ↓
Rule Set Switcher (UI dropdown) → ReloadRules(rulesFile, examplesFile)
     ↓
UI Modules (editor, rule-picker, results) → Call WASM Bridge
     ↓
WASM Bridge (DotNet.invokeMethodAsync) → JsBridge.cs [JSInvokable]
     ↓
ChandamService methods (Determine, TryMatch, GetScores, etc.)
```

**Rule Set Strategy:**
- **Default**: Frequent rules (14 rules, 9.3KB compressed) - fast startup
- **On-demand**: Complete rules (379 rules, 65KB compressed) - user switches via dropdown
- **Files**: `.min.json` + `.min.json.br` (browser auto-selects Brotli if supported)
- **Config**: Centralized in `config.ts` with short names
- **Compression**: Brotli achieves 92% size reduction (806KB → 65KB for complete set)
- **Dynamic loading**: No page reload needed when switching rule sets

**Key decisions:**
- Keep App.razor (minimal shell) + MainLayout.razor (empty) - required for Blazor boot
- All UI logic moves to TypeScript modules
- TypeScript types manually match C# DTOs (no codegen)
- Custom 40-line router (no external dependency)
- Pure CSS with mobile-first approach
- MSBuild targets run npm build + copy compressed rule files
- Playwright .NET tests in separate project
- Dynamic rule loading via JsBridge (no page reload needed)

---

## Implementation Phases

### Phase 1: Blazor Simplification

**Goal:** Remove all Blazor UI, keep minimal bootstrap shell.

**Delete (6 Razor files):**
- [Chandam.Wasm/Pages/Determine.razor](../../../Chandam.Wasm/Pages/Determine.razor)
- [Chandam.Wasm/Pages/TryMatch.razor](../../../Chandam.Wasm/Pages/TryMatch.razor)
- [Chandam.Wasm/Pages/Scores.razor](../../../Chandam.Wasm/Pages/Scores.razor)
- [Chandam.Wasm/Pages/Home.razor](../../../Chandam.Wasm/Pages/Home.razor)
- [Chandam.Wasm/Components/PoemInput.razor](../../../Chandam.Wasm/Components/PoemInput.razor)
- [Chandam.Wasm/Components/ResultDisplay.razor](../../../Chandam.Wasm/Components/ResultDisplay.razor)

**Modify [Chandam.Wasm/App.razor](../../../Chandam.Wasm/App.razor):**
```razor
<div id="app"></div>
```
(Remove Router, RouteView - no Blazor routing)

**Modify [Chandam.Wasm/MainLayout.razor](../../../Chandam.Wasm/MainLayout.razor):**
```razor
<div>@Body</div>
```
(Empty layout, no chrome)

**Verification:** `dotnet build Chandam.Wasm` succeeds, no Blazor routing errors.

---

### Phase 2: C# JSInvokable Bridge

**Goal:** Expose ChandamService methods to JavaScript via [JSInvokable].

**Create [Chandam.Wasm/JsBridge.cs](../../../Chandam.Wasm/JsBridge.cs):**

```csharp
using System;
using System.Linq;
using System.Text.Json;
using Microsoft.JSInterop;
using Microsoft.Extensions.DependencyInjection;
using Chandam.API.Services;
using Chandam.API.Models;
using Chandam.Rules;

namespace Chandam.Wasm;

public static class JsBridge
{
    [JSInvokable]
    public static string GetAllRules(string language = "te")
    {
        var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();
        var langEnum = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var rules = ruleLoader.GetAllRules(langEnum);
        var summary = rules.Select(r => new {
            r.Identifier,
            r.Name,
            PadyamType = r.PadyamType.ToString(),
            PadyamSubType = r.PadyamSubType.ToString(),
            Frequency = r.Frequency.ToString(),
            r.Lines
        });
        return JsonSerializer.Serialize(summary);
    }

    [JSInvokable]
    public static string Determine(string poemText, bool matchYati, bool matchPrasa, string language = "te")
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var langEnum = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
        var request = new DetermineRequest {
            PoemText = poemText,
            MatchYati = matchYati,
            MatchPrasa = matchPrasa,
            Language = langEnum,
            RenderFormat = RenderFormat.Html
        };
        var response = service.Determine(request);
        return JsonSerializer.Serialize(response);
    }

    [JSInvokable]
    public static string TryMatch(string poemText, string ruleId, bool matchYati, bool matchPrasa)
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var request = new TryMatchRequest {
            PoemText = poemText,
            RuleIdentifier = ruleId,
            MatchYati = matchYati,
            MatchPrasa = matchPrasa,
            RenderFormat = RenderFormat.Html
        };
        var response = service.TryMatch(request);
        return JsonSerializer.Serialize(response);
    }

    [JSInvokable]
    public static string GetScores(string poemText, bool matchYati, bool matchPrasa, int minPercentage = 50)
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var request = new ScoresRequest {
            PoemText = poemText,
            MatchYati = matchYati,
            MatchPrasa = matchPrasa,
            MinimumMatchPercentage = minPercentage
        };
        var response = service.Scores(request);
        return JsonSerializer.Serialize(response);
    }

    [JSInvokable]
    public static string GetRuleInfo(string ruleId)
    {
        var service = ServiceAccessor.Services!.GetRequiredService<ChandamService>();
        var request = new GetRuleInfoRequest {
            RuleIdentifier = ruleId,
            IncludeExamples = true
        };
        var response = service.GetRuleInfo(request);
        return JsonSerializer.Serialize(response);
    }

    [JSInvokable]
    public static string GetRandomPoem(string ruleId)
    {
        var rule = Manager.FetchRule(ruleId);
        if (rule?.Examples2 != null && rule.Examples2.Length > 0)
        {
            var random = new Random();
            var example = rule.Examples2[random.Next(rule.Examples2.Length)];
            return example.Text;
        }
        return string.Empty;
    }

    [JSInvokable]
    public static async Task<string> ReloadRules(string rulesFile, string examplesFile)
    {
        try
        {
            var wasmLoader = ServiceAccessor.Services!.GetRequiredService<WasmRuleLoaderService>();
            await wasmLoader.LoadRuleSetAsync(rulesFile, examplesFile);
            return JsonSerializer.Serialize(new { success = true, message = "Rules reloaded successfully" });
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { success = false, errorMessage = ex.Message });
        }
    }
}

// Static accessor for DI services
internal static class ServiceAccessor
{
    public static IServiceProvider? Services { get; set; }
}
```

**Modify [Chandam.Wasm/Program.cs](../../../Chandam.Wasm/Program.cs):**

After `var host = builder.Build();`, add:
```csharp
// Store IServiceProvider for JsBridge
ServiceAccessor.Services = host.Services;
```

After `await wasmLoader.InitializeAsync();`, add:
```csharp
// Signal JavaScript that WASM is ready
await host.Services.GetRequiredService<IJSRuntime>()
    .InvokeVoidAsync("onWasmReady");
```

**Modify [Chandam.Wasm/Services/WasmRuleLoaderService.cs](../../../Chandam.Wasm/Services/WasmRuleLoaderService.cs):**

Change `InitializeAsync()` to load default rule set (frequent), and add `LoadRuleSetAsync()` method:

```csharp
public async Task InitializeAsync()
{
    if (_initialized) return;
    
    // Load default rule set (Frequent - 9.3KB compressed)
    await LoadRuleSetAsync("data/chandam-rules.min.json", "data/chandam-examples.min.json");
    _initialized = true;
}

public async Task LoadRuleSetAsync(string rulesFile, string examplesFile)
{
    try
    {
        // Load rules
        var rulesJson = await _httpClient.GetStringAsync(rulesFile);
        var rules = _ruleLoader.LoadFromJsonString(rulesJson);

        if (rules != null && rules.Length > 0)
        {
            // Load examples if provided
            if (!string.IsNullOrEmpty(examplesFile))
            {
                try
                {
                    var examplesJson = await _httpClient.GetStringAsync(examplesFile);
                    var exampleSet = LoadExampleSetFromJson(examplesJson);

                    if (exampleSet != null)
                    {
                        MergeExamplesIntoRules(rules, exampleSet);
                        Console.WriteLine($"WASM: Merged examples for {exampleSet.Examples.Count} rules from {examplesFile}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"WASM: Failed to load examples from {examplesFile}: {ex.Message}");
                }
            }

            Manager.Clear();
            Manager.Register(rules);
            Console.WriteLine($"WASM: Loaded {rules.Length} rules from {rulesFile}");
        }
        else
        {
            Console.WriteLine($"WASM: No rules loaded from {rulesFile}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"WASM: Failed to load rules from {rulesFile}: {ex.Message}");
        throw;
    }
}
```

**Verification:** `dotnet build` succeeds, JsBridge methods visible to JS.

---

### Phase 3: TypeScript/Vite Setup

**Goal:** Create TypeScript project with Vite bundler.

**Create directory:** [Chandam.Wasm/Client/](../../../Chandam.Wasm/Client/)

**Create [Chandam.Wasm/Client/package.json](../../../Chandam.Wasm/Client/package.json):**
```json
{
  "name": "chandam-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint src"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.56.0"
  }
}
```

**Create [Chandam.Wasm/Client/tsconfig.json](../../../Chandam.Wasm/Client/tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "../wwwroot/js"
  },
  "include": ["src/**/*"]
}
```

**Create [Chandam.Wasm/Client/vite.config.ts](../../../Chandam.Wasm/Client/vite.config.ts):**
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '../wwwroot/js',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        entryFileNames: 'chandam-app.js',
        format: 'es'
      }
    }
  }
});
```

**Create [Chandam.Wasm/Client/eslint.config.js](../../../Chandam.Wasm/Client/eslint.config.js):**
```javascript
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules
    }
  }
];
```

**Verification:** `cd Client && npm install && npm run build` creates `wwwroot/js/chandam-app.js`.

---

### Phase 3a: Rule Set Configuration

**Goal:** Define available rule sets in centralized config.

**Create [Chandam.Wasm/Client/src/config.ts](../../../Chandam.Wasm/Client/src/config.ts):**

```typescript
export interface RuleSet {
  id: string;
  name: string;
  rulesFile: string;
  examplesFile: string;
  description: string;
  sizeKB: number;
}

export const RULE_SETS: RuleSet[] = [
  {
    id: 'frequent',
    name: 'Frequent Rules',
    rulesFile: 'data/chandam-rules.min.json',
    examplesFile: 'data/chandam-examples.min.json',
    description: '14 most common rules (fast)',
    sizeKB: 9.3
  },
  {
    id: 'complete',
    name: 'Complete Telugu',
    rulesFile: 'data/telugu-complete.min.json',
    examplesFile: 'data/telugu-complete-examples.min.json',
    description: '379 rules with examples',
    sizeKB: 65
  }
];

export const DEFAULT_RULE_SET = 'frequent';

export function getRuleSet(id: string): RuleSet | undefined {
  return RULE_SETS.find(rs => rs.id === id);
}
```

**Note:** Browser automatically fetches `.br` files if `Accept-Encoding: br` header is present. No code changes needed - web server handles it transparently.

**Verification:** TypeScript compiles without errors.

---

### Phase 4: TypeScript Type Definitions

**Goal:** Define interfaces matching C# DTOs.

**Create [Chandam.Wasm/Client/src/types.ts](../../../Chandam.Wasm/Client/src/types.ts):**

```typescript
export interface RuleSummary {
  identifier: string;
  name: string;
  padyamType: string;
  padyamSubType: string;
  frequency: string;
  lines: number;
}

export interface DetermineResponse {
  matches: ChandamMatch[];
  success: boolean;
  errorMessage?: string;
}

export interface ChandamMatch {
  rule: RuleInfo;
  score: number;
  total: number;
  matchPercentage: number;
  isMatched: boolean;
  errors?: MatchError[];
  renderedHtml?: string;
  renderedText?: string;
  renderedMarkdown?: string;
}

export interface RuleInfo {
  identifier: string;
  name: string;
  description: string;
  padyamType: string;
  padyamSubType: string;
  frequency: string;
  lines: number;
  ganas?: string;
  yati?: string;
  prasa?: string;
  examples?: PoemExample[];
}

export interface MatchError {
  line: number;
  position: number;
  mismatchType: string;
  mismatchDescription: string;
  expected: string;
  actual: string;
  remarks?: string;
}

export interface PoemExample {
  text: string;
  author?: string;
  source?: string;
}

export interface TryMatchResponse {
  match: ChandamMatch;
  success: boolean;
  errorMessage?: string;
}

export interface ScoresResponse {
  scores: ScoreEntry[];
  totalRulesEvaluated: number;
  success: boolean;
  errorMessage?: string;
}

export interface ScoreEntry {
  ruleId: string;
  ruleName: string;
  score: number;
  total: number;
  matchPercentage: number;
}
```

---

### Phase 5: WASM Bridge Module

**Goal:** Type-safe wrappers for DotNet.invokeMethodAsync.

**Create [Chandam.Wasm/Client/src/wasm-bridge.ts](../../../Chandam.Wasm/Client/src/wasm-bridge.ts):**

```typescript
import type {
  RuleSummary,
  DetermineResponse,
  TryMatchResponse,
  ScoresResponse,
  RuleInfo
} from './types';

declare const DotNet: {
  invokeMethodAsync<T>(assemblyName: string, methodName: string, ...args: any[]): Promise<T>;
};

export class WasmBridge {
  private static readonly ASSEMBLY = 'Chandam.Wasm';

  static async getAllRules(language: string = 'te'): Promise<RuleSummary[]> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetAllRules',
      language
    );
    return JSON.parse(json);
  }

  static async determine(
    poemText: string,
    matchYati: boolean,
    matchPrasa: boolean,
    language: string = 'te'
  ): Promise<DetermineResponse> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'Determine',
      poemText,
      matchYati,
      matchPrasa,
      language
    );
    return JSON.parse(json);
  }

  static async tryMatch(
    poemText: string,
    ruleId: string,
    matchYati: boolean,
    matchPrasa: boolean
  ): Promise<TryMatchResponse> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'TryMatch',
      poemText,
      ruleId,
      matchYati,
      matchPrasa
    );
    return JSON.parse(json);
  }

  static async getScores(
    poemText: string,
    matchYati: boolean,
    matchPrasa: boolean,
    minPercentage: number = 50
  ): Promise<ScoresResponse> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetScores',
      poemText,
      matchYati,
      matchPrasa,
      minPercentage
    );
    return JSON.parse(json);
  }

  static async getRuleInfo(ruleId: string): Promise<RuleInfo> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetRuleInfo',
      ruleId
    );
    return JSON.parse(json);
  }

  static async getRandomPoem(ruleId: string): Promise<string> {
    return await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetRandomPoem',
      ruleId
    );
  }

  static async reloadRules(rulesFile: string, examplesFile: string): Promise<{ success: boolean; message?: string; errorMessage?: string }> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'ReloadRules',
      rulesFile,
      examplesFile
    );
    return JSON.parse(json);
  }
}
```

---

### Phase 6: Client-Side Router

**Goal:** Clean URL routing with history.pushState.

**Create [Chandam.Wasm/Client/src/router.ts](../../../Chandam.Wasm/Client/src/router.ts):**

```typescript
type RouteHandler = () => void | Promise<void>;

interface Route {
  path: string;
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];

  register(path: string, handler: RouteHandler) {
    this.routes.push({ path, handler });
  }

  async navigate(path: string) {
    history.pushState(null, '', path);
    await this.route();
  }

  async route() {
    const path = window.location.pathname;
    const route = this.routes.find(r => r.path === path);
    
    if (route) {
      await route.handler();
    } else {
      // Default to home if not found
      const homeRoute = this.routes.find(r => r.path === '/');
      if (homeRoute) await homeRoute.handler();
    }
  }

  init() {
    // Handle browser back/forward
    window.addEventListener('popstate', () => this.route());
    
    // Intercept link clicks
    document.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href && target.origin === location.origin) {
        e.preventDefault();
        this.navigate(new URL(target.href).pathname);
      }
    });
    
    // Route initial load
    this.route();
  }
}

// Helper to load static HTML pages
export async function loadStaticPage(url: string) {
  const content = document.getElementById('content');
  if (!content) return;
  
  try {
    const response = await fetch(url);
    if (response.ok) {
      content.innerHTML = await response.text();
    } else {
      content.innerHTML = '<p>Page not found</p>';
    }
  } catch (err) {
    console.error('Failed to load page:', err);
    content.innerHTML = '<p>Error loading page</p>';
  }
}
```

---

### Phase 7: UI Modules (Analyze Page)

**Goal:** Build interactive /analyze page with editor, rule picker, and results.

**Create [Chandam.Wasm/Client/src/ui/editor.ts](../../../Chandam.Wasm/Client/src/ui/editor.ts):**
```typescript
export function getEditorText(): string {
  const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
  return editor?.value || '';
}

export function setEditorText(text: string) {
  const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
  if (editor) editor.value = text;
}

export function clearEditor() {
  setEditorText('');
}
```

**Create [Chandam.Wasm/Client/src/ui/accordion.ts](../../../Chandam.Wasm/Client/src/ui/accordion.ts):**
```typescript
export function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling as HTMLElement;
      const isOpen = content.style.maxHeight !== '0px';
      content.style.maxHeight = isOpen ? '0px' : `${content.scrollHeight}px`;
      header.classList.toggle('open');
    });
  });
}

export function openAccordion(id: string) {
  const header = document.querySelector(`#${id} .accordion-header`) as HTMLElement;
  const content = header?.nextElementSibling as HTMLElement;
  if (content) {
    content.style.maxHeight = `${content.scrollHeight}px`;
    header?.classList.add('open');
  }
}
```

**Create [Chandam.Wasm/Client/src/ui/rule-picker.ts](../../../Chandam.Wasm/Client/src/ui/rule-picker.ts):**
```typescript
import type { RuleSummary } from '../types';

export function renderRulePicker(rules: RuleSummary[], containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Group by type
  const grouped = rules.reduce((acc, rule) => {
    const type = rule.padyamType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(rule);
    return acc;
  }, {} as Record<string, RuleSummary[]>);
  
  // Build select dropdown
  const select = document.createElement('select');
  select.id = 'rule-select';
  select.className = 'rule-picker';
  
  Object.keys(grouped).sort().forEach(type => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = type;
    
    grouped[type].forEach(rule => {
      const option = document.createElement('option');
      option.value = rule.identifier;
      option.textContent = `${rule.name} (${rule.frequency})`;
      optgroup.appendChild(option);
    });
    
    select.appendChild(optgroup);
  });
  
  container.innerHTML = '';
  container.appendChild(select);
}

export function getSelectedRule(): string {
  const select = document.getElementById('rule-select') as HTMLSelectElement;
  return select?.value || '';
}
```

**Create [Chandam.Wasm/Client/src/ui/results.ts](../../../Chandam.Wasm/Client/src/ui/results.ts):**
```typescript
import type { ChandamMatch } from '../types';
import { openAccordion } from './accordion';

export function renderResults(matches: ChandamMatch[], containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = matches.map(match => `
    <div class="match-card ${match.isMatched ? 'match-success' : 'match-failure'}">
      <h3>${match.rule.name} (${match.matchPercentage}%)</h3>
      <p>${match.rule.description}</p>
      ${match.renderedHtml || ''}
      ${match.errors && match.errors.length > 0 ? `
        <div class="errors">
          <h4>Mismatches:</h4>
          <ul>
            ${match.errors.map(e => `<li>Line ${e.line}: ${e.mismatchDescription}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');
  
  // Auto-open results section
  openAccordion('results-section');
}

export function clearResults() {
  const container = document.getElementById('results-container');
  if (container) container.innerHTML = '';
}
```

**Create [Chandam.Wasm/Client/src/ui/actions.ts](../../../Chandam.Wasm/Client/src/ui/actions.ts):**
```typescript
import { WasmBridge } from '../wasm-bridge';
import { getEditorText, setEditorText, clearEditor } from './editor';
import { getSelectedRule } from './rule-picker';
import { renderResults, clearResults } from './results';

export async function handleDetermine() {
  const poemText = getEditorText();
  if (!poemText.trim()) {
    alert('దయచేసి పద్యం టెక్స్ట్ ఇవ్వండి (Please enter poem text)');
    return;
  }
  
  const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
  const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;
  
  try {
    const response = await WasmBridge.determine(poemText, yati, prasa);
    if (response.success && response.matches.length > 0) {
      renderResults(response.matches, 'results-container');
    } else {
      alert(response.errorMessage || 'సరిపోలికలు దొరకలేదు (No matches found)');
    }
  } catch (err) {
    console.error('Determine failed:', err);
    alert('లోపం సంభవించింది (Error occurred)');
  }
}

export async function handleMatch() {
  const poemText = getEditorText();
  const ruleId = getSelectedRule();
  
  if (!poemText.trim() || !ruleId) {
    alert('దయచేసి పద్యం మరియు ఛందం ఎంచుకోండి (Please select poem and rule)');
    return;
  }
  
  const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
  const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;
  
  try {
    const response = await WasmBridge.tryMatch(poemText, ruleId, yati, prasa);
    if (response.success) {
      renderResults([response.match], 'results-container');
    } else {
      alert(response.errorMessage || 'సరిపోలలేదు (No match)');
    }
  } catch (err) {
    console.error('Match failed:', err);
    alert('లోపం సంభవించింది (Error occurred)');
  }
}

export async function handleRandom() {
  const ruleId = getSelectedRule();
  if (!ruleId) {
    alert('దయచేసి ఛందం ఎంచుకోండి (Please select a rule)');
    return;
  }
  
  try {
    const poem = await WasmBridge.getRandomPoem(ruleId);
    if (poem) {
      setEditorText(poem);
    } else {
      alert('ఉదాహరణలు అందుబాటులో లేవు (No examples available)');
    }
  } catch (err) {
    console.error('Random poem failed:', err);
  }
}

export function handleClear() {
  clearEditor();
  clearResults();
}
```

**Create [Chandam.Wasm/Client/src/ui/rule-set-switcher.ts](../../../Chandam.Wasm/Client/src/ui/rule-set-switcher.ts):**
```typescript
import { RULE_SETS, getRuleSet } from '../config';
import { WasmBridge } from '../wasm-bridge';
import { renderRulePicker } from './rule-picker';

export function renderRuleSetSwitcher(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const select = document.createElement('select');
  select.id = 'rule-set-select';
  select.className = 'rule-set-switcher';
  
  RULE_SETS.forEach(ruleSet => {
    const option = document.createElement('option');
    option.value = ruleSet.id;
    option.textContent = `${ruleSet.name} (${ruleSet.sizeKB}KB)`;
    select.appendChild(option);
  });
  
  // Handle change
  select.addEventListener('change', async () => {
    const selectedId = select.value;
    await switchRuleSet(selectedId);
  });
  
  container.appendChild(select);
}

export async function switchRuleSet(ruleSetId: string) {
  const ruleSet = getRuleSet(ruleSetId);
  if (!ruleSet) {
    console.error(`Rule set not found: ${ruleSetId}`);
    return;
  }
  
  // Show loading indicator
  const indicator = document.getElementById('loading-indicator');
  if (indicator) indicator.style.display = 'block';
  
  try {
    console.log(`Switching to rule set: ${ruleSet.name}`);
    
    // Reload rules via WASM bridge
    const result = await WasmBridge.reloadRules(ruleSet.rulesFile, ruleSet.examplesFile);
    
    if (result.success) {
      // Refresh rule picker
      const rules = await WasmBridge.getAllRules();
      renderRulePicker(rules, 'rule-picker-container');
      console.log(`Loaded ${rules.length} rules from ${ruleSet.name}`);
    } else {
      alert(`Failed to load rules: ${result.errorMessage}`);
    }
  } catch (err) {
    console.error('Failed to switch rule set:', err);
    alert('లోపం సంభవించింది (Error occurred)');
  } finally {
    // Hide loading indicator
    if (indicator) indicator.style.display = 'none';
  }
}
```

---

### Phase 8: Main Entry Point & Page Rendering

**Create [Chandam.Wasm/Client/src/main.ts](../../../Chandam.Wasm/Client/src/main.ts):**

```typescript
import { Router, loadStaticPage } from './router';
import { WasmBridge } from './wasm-bridge';
import { renderRulePicker } from './ui/rule-picker';
import { renderRuleSetSwitcher } from './ui/rule-set-switcher';
import { initAccordions } from './ui/accordion';
import { handleDetermine, handleMatch, handleRandom, handleClear } from './ui/actions';

const router = new Router();

// Route handlers
router.register('/', () => loadStaticPage('pages/home.html'));
router.register('/home', () => loadStaticPage('pages/home.html'));
router.register('/analyze', renderAnalyzePage);
router.register('/about', () => loadStaticPage('pages/about.html'));
router.register('/credits', () => loadStaticPage('pages/credits.html'));
router.register('/contact', () => loadStaticPage('pages/contact.html'));

async function renderAnalyzePage() {
  const content = document.getElementById('content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="analyze-page">
      <h2>Poem Analysis</h2>
      
      <div class="rule-set-section">
        <label for="rule-set-select">Rule Set:</label>
        <div id="rule-set-switcher-container"></div>
        <span id="loading-indicator" style="display: none;">⟳ Loading...</span>
      </div>
      
      <div class="editor-section">
        <label for="poem-editor">Enter Telugu poem:</label>
        <textarea id="poem-editor" rows="8" placeholder="పద్యం ఇక్కడ టైప్ చేయండి..."></textarea>
      </div>
      
      <div class="accordion" id="options-section">
        <div class="accordion-header">Options ▼</div>
        <div class="accordion-content">
          <label><input type="checkbox" id="match-yati" checked> Yati (యతి)</label>
          <label><input type="checkbox" id="match-prasa" checked> Prasa (ప్రాస)</label>
        </div>
      </div>
      
      <div class="accordion" id="rule-section">
        <div class="accordion-header">Rule Selection ▼</div>
        <div class="accordion-content">
          <div id="rule-picker-container"></div>
        </div>
      </div>
      
      <div class="actions">
        <button id="btn-determine">▶ Determine</button>
        <button id="btn-match">▶ Match</button>
        <button id="btn-random"># Random</button>
        <button id="btn-clear">✕ Clear</button>
      </div>
      
      <div class="accordion" id="results-section">
        <div class="accordion-header">Results ▼</div>
        <div class="accordion-content">
          <div id="results-container"></div>
        </div>
      </div>
    </div>
  `;
  
  // Initialize accordions
  initAccordions();
  
  // Render rule set switcher
  renderRuleSetSwitcher('rule-set-switcher-container');
  
  // Load rules and populate picker
  try {
    const rules = await WasmBridge.getAllRules();
    renderRulePicker(rules, 'rule-picker-container');
  } catch (err) {
    console.error('Failed to load rules:', err);
  }
  
  // Wire up buttons
  document.getElementById('btn-determine')?.addEventListener('click', handleDetermine);
  document.getElementById('btn-match')?.addEventListener('click', handleMatch);
  document.getElementById('btn-random')?.addEventListener('click', handleRandom);
  document.getElementById('btn-clear')?.addEventListener('click', handleClear);
}

// Global function called by Blazor WASM when ready
(window as any).onWasmReady = () => {
  console.log('WASM ready, initializing router');
  router.init();
};
```

---

### Phase 9: HTML Shell & Static Pages

**Rewrite [Chandam.Wasm/wwwroot/index.html](../../../Chandam.Wasm/wwwroot/index.html):**

```html
<!DOCTYPE html>
<html lang="te">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chandam - Telugu Poetry Meter Analysis</title>
    <base href="/" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&display=swap" rel="stylesheet" />
    <link href="css/chandam.css" rel="stylesheet" />
</head>
<body>
    <header>
        <div class="container">
            <h1>ఛందం</h1>
            <nav id="main-nav">
                <a href="/">Home</a>
                <a href="/analyze">Analyze</a>
                <a href="/about">About</a>
                <a href="/credits">Credits</a>
                <a href="/contact">Contact</a>
            </nav>
            <button id="nav-toggle" aria-label="Toggle navigation">☰</button>
        </div>
    </header>
    
    <main id="content">
        <p>Loading...</p>
    </main>
    
    <footer>
        <div class="container">
            <p>© 2026 Chandam | <a href="https://github.com/chandamu/chandam" target="_blank">GitHub</a></p>
        </div>
    </footer>
    
    <!-- Hidden Blazor bootstrap container -->
    <div id="app" style="display: none;"></div>
    
    <!-- Blazor WASM runtime -->
    <script src="_framework/blazor.webassembly.js"></script>
    
    <!-- TypeScript app bundle -->
    <script type="module" src="js/chandam-app.js"></script>
</body>
</html>
```

**Create static page shells in [Chandam.Wasm/wwwroot/pages/](../../../Chandam.Wasm/wwwroot/pages/):**

**home.html:**
```html
<div class="home-page">
  <h2>Welcome to Chandam</h2>
  <p>ఛందం is a Telugu poetry meter analysis tool that helps identify metrical patterns in Telugu, Sanskrit, and Kannada verses.</p>
  <p><a href="/analyze" class="btn-primary">Get Started →</a></p>
</div>
```

**about.html:**
```html
<div class="content-page">
  <h2>About Chandam</h2>
  <p>Coming soon...</p>
</div>
```

**credits.html:**
```html
<div class="content-page">
  <h2>Credits</h2>
  <p>Coming soon...</p>
</div>
```

**contact.html:**
```html
<div class="content-page">
  <h2>Contact</h2>
  <p>Coming soon...</p>
</div>
```

---

### Phase 10: CSS Styles (Minimal Functional)

**Goal:** Create minimal functional styles to demonstrate features. UI polish deferred to future phase.

**Design principles for baseline:**
- Functional, not beautiful (polish comes later)
- Basic layout and spacing
- Simple colors (black/white/gray with minimal accent colors)
- Mobile viewport support (but not optimized)
- No animations or transitions (added in polish phase)
- Focus on readability and usability

**Create [Chandam.Wasm/wwwroot/css/chandam.css](../../../Chandam.Wasm/wwwroot/css/chandam.css):**

```css
/* Minimal functional styles - design polish deferred to future phase */

:root {
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-header-bg: #000000;
  --color-header-text: #ffffff;
  --color-success: #2d6a4f;
  --color-error: #c1121f;
  --color-border: #cccccc;
  --font-main: 'Noto Sans Telugu', sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-main);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Header */
header {
  background: var(--color-header-bg);
  color: var(--color-header-text);
  padding: 1rem 0;
}

header h1 {
  font-size: 1.5rem;
  display: inline-block;
  margin-right: 2rem;
}

nav {
  display: inline-block;
}

nav a {
  color: var(--color-header-text);
  text-decoration: none;
  margin-right: 1rem;
  padding: 0.5rem;
}

nav a:hover {
  background: rgba(255, 255, 255, 0.1);
}

#nav-toggle {
  display: none;
  background: transparent;
  border: 1px solid var(--color-header-text);
  color: var(--color-header-text);
  font-size: 1.5rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  float: right;
}

@media (max-width: 768px) {
  #nav-toggle {
    display: block;
  }
  
  nav {
    display: none;
    width: 100%;
    margin-top: 1rem;
  }
  
  nav.open {
    display: block;
  }
  
  nav a {
    display: block;
    padding: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
}

/* Main Content */
main {
  flex: 1;
  padding: 2rem 1rem;
}

/* Footer */
footer {
  background: var(--color-header-bg);
  color: var(--color-header-text);
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
}

footer a {
  color: var(--color-header-text);
}

/* Analyze Page */
.rule-set-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rule-set-section label {
  font-weight: bold;
  white-space: nowrap;
}

.rule-set-switcher {
  padding: 0.5rem;
  font-family: var(--font-main);
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  min-width: 200px;
}

#loading-indicator {
  color: #666;
  font-size: 0.9rem;
}

.editor-section {
  margin-bottom: 1.5rem;
}

#poem-editor {
  width: 100%;
  padding: 0.75rem;
  font-family: var(--font-main);
  font-size: 1.1rem;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  resize: vertical;
}

/* Accordion */
.accordion {
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.accordion-header {
  padding: 0.75rem;
  background: #f5f5f5;
  cursor: pointer;
  font-weight: bold;
  user-select: none;
}

.accordion-header:hover {
  background: #eeeeee;
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: 0 0.75rem;
}

.accordion-header.open + .accordion-content {
  padding: 0.75rem;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1.5rem 0;
}

.actions button {
  padding: 0.75rem 1.5rem;
  font-family: var(--font-main);
  font-size: 1rem;
  background: var(--color-header-bg);
  color: var(--color-header-text);
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.actions button:hover {
  opacity: 0.9;
}

.actions button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

/* Rule Picker */
.rule-picker {
  width: 100%;
  padding: 0.5rem;
  font-family: var(--font-main);
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

/* Results */
.match-card {
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.match-card.match-success {
  border-color: var(--color-success);
  background: rgba(45, 106, 79, 0.05);
}

.match-card.match-failure {
  border-color: var(--color-error);
  background: rgba(193, 18, 31, 0.05);
}

.match-card h3 {
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.errors {
  margin-top: 1rem;
  padding: 0.5rem;
  background: rgba(193, 18, 31, 0.1);
  border-radius: 4px;
}

.errors h4 {
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.errors ul {
  margin-left: 1.5rem;
  font-size: 0.9rem;
}

/* Utility */
.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--color-header-bg);
  color: var(--color-header-text);
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
}

.btn-primary:hover {
  opacity: 0.9;
}
```

Add nav toggle script to main.ts:
```typescript
document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('main-nav')?.classList.toggle('open');
});
```

---

### Phase 11: MSBuild Integration & Rule File Deployment

**Modify [Chandam.Wasm/Chandam.Wasm.csproj](../../../Chandam.Wasm/Chandam.Wasm.csproj):**

Add before closing `</Project>`:

```xml
<!-- NPM build integration -->
<Target Name="NpmInstall" BeforeTargets="BeforeBuild" Condition="!Exists('Client\node_modules')">
  <Exec Command="npm install" WorkingDirectory="Client" />
</Target>

<Target Name="NpmBuild" BeforeTargets="Build">
  <Exec Command="npm run build" WorkingDirectory="Client" />
</Target>

<!-- Copy compressed rule files from Chandam.Config/Rules/ to wwwroot/data/ -->
<Target Name="CopyCompressedRules" BeforeTargets="Build">
  <ItemGroup>
    <CompressedRuleFiles Include="..\Chandam.Config\Rules\*.min.json" />
    <CompressedRuleFiles Include="..\Chandam.Config\Rules\*.min.json.br" />
  </ItemGroup>
  <Copy SourceFiles="@(CompressedRuleFiles)" DestinationFolder="wwwroot\data\" SkipUnchangedFiles="true" />
  <Message Text="Copied compressed rule files to wwwroot/data/" Importance="high" />
</Target>
```

**Files copied to wwwroot/data/:**
- `chandam-rules.min.json` (1.6KB) + `.br` 
- `chandam-examples.min.json` (7.7KB) + `.br`
- `telugu-complete.min.json` (19KB) + `.br`
- `telugu-complete-examples.min.json` (46KB) + `.br`

**Verification:** 
1. `dotnet build Chandam.Wasm` automatically runs `npm run build`
2. Check `wwwroot/data/` contains 8 files (4 `.min.json` + 4 `.min.json.br`)

---

### Phase 12: Playwright Tests

**Create new project:** [Chandam.Wasm.Tests/Chandam.Wasm.Tests.csproj](../../../Chandam.Wasm.Tests/Chandam.Wasm.Tests.csproj)

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
    <PackageReference Include="Microsoft.Playwright.NUnit" Version="1.40.0" />
    <PackageReference Include="NUnit" Version="3.14.0" />
    <PackageReference Include="NUnit3TestAdapter" Version="4.5.0" />
  </ItemGroup>
</Project>
```

**Create [Chandam.Wasm.Tests/AnalyzePageTests.cs](../../../Chandam.Wasm.Tests/AnalyzePageTests.cs):**

```csharp
using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;
using NUnit.Framework;

namespace Chandam.Wasm.Tests;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class AnalyzePageTests : PageTest
{
    private const string BaseUrl = "http://localhost:5000";

    [Test]
    public async Task Homepage_Loads_Successfully()
    {
        await Page.GotoAsync(BaseUrl);
        await Expect(Page.Locator("h1")).ToContainTextAsync("ఛందం");
        await Expect(Page.Locator("nav a[href='/']")).ToBeVisibleAsync();
    }

    [Test]
    public async Task Navigation_To_Analyze_Page_Works()
    {
        await Page.GotoAsync(BaseUrl);
        await Page.ClickAsync("a[href='/analyze']");
        await Expect(Page).ToHaveURLAsync($"{BaseUrl}/analyze");
        await Expect(Page.Locator("#poem-editor")).ToBeVisibleAsync();
    }

    [Test]
    public async Task Analyze_Page_Has_Required_Elements()
    {
        await Page.GotoAsync($"{BaseUrl}/analyze");
        await Expect(Page.Locator("#poem-editor")).ToBeVisibleAsync();
        await Expect(Page.Locator("#btn-determine")).ToBeVisibleAsync();
        await Expect(Page.Locator("#btn-match")).ToBeVisibleAsync();
        await Expect(Page.Locator("#btn-random")).ToBeVisibleAsync();
        await Expect(Page.Locator("#btn-clear")).ToBeVisibleAsync();
    }

    [Test]
    public async Task WASM_Loads_And_Rules_Populate()
    {
        await Page.GotoAsync($"{BaseUrl}/analyze");
        
        // Wait for WASM to load and rules to populate
        await Page.WaitForSelectorAsync("#rule-select option", new() { Timeout = 10000 });
        
        var optionCount = await Page.Locator("#rule-select option").CountAsync();
        Assert.That(optionCount, Is.GreaterThan(0), "Rules should be loaded");
    }

    [Test]
    public async Task Determine_Flow_Shows_Results()
    {
        await Page.GotoAsync($"{BaseUrl}/analyze");
        await Page.WaitForSelectorAsync("#rule-select option");
        
        // Enter poem
        await Page.FillAsync("#poem-editor", "తేనెలేని తేటతేనె దొరకునె ధరణిపై");
        
        // Click Determine
        await Page.ClickAsync("#btn-determine");
        
        // Wait for results
        await Page.WaitForSelectorAsync(".match-card", new() { Timeout = 5000 });
        
        var resultCards = await Page.Locator(".match-card").CountAsync();
        Assert.That(resultCards, Is.GreaterThan(0), "Should show match results");
    }

    [Test]
    public async Task Mobile_Viewport_Renders_Correctly()
    {
        await Page.SetViewportSizeAsync(360, 640);
        await Page.GotoAsync($"{BaseUrl}/analyze");
        
        // Nav toggle should be visible on mobile
        await Expect(Page.Locator("#nav-toggle")).ToBeVisibleAsync();
        
        // Editor should be full width
        var editorWidth = await Page.Locator("#poem-editor").BoundingBoxAsync();
        Assert.That(editorWidth!.Width, Is.GreaterThan(300));
    }

    [Test]
    public async Task Browser_Back_Button_Works()
    {
        await Page.GotoAsync(BaseUrl);
        await Page.ClickAsync("a[href='/analyze']");
        await Page.ClickAsync("a[href='/about']");
        
        await Page.GoBackAsync();
        await Expect(Page).ToHaveURLAsync($"{BaseUrl}/analyze");
        
        await Page.GoBackAsync();
        await Expect(Page).ToHaveURLAsync($"{BaseUrl}/");
    }

    [Test]
    public async Task Rule_Set_Switching_Works()
    {
        await Page.GotoAsync($"{BaseUrl}/analyze");
        await Page.WaitForSelectorAsync("#rule-set-select");
        
        // Should default to frequent rules (14 rules)
        var defaultValue = await Page.Locator("#rule-set-select").InputValueAsync();
        Assert.That(defaultValue, Is.EqualTo("frequent"));
        
        // Switch to complete rule set
        await Page.SelectOptionAsync("#rule-set-select", "complete");
        
        // Wait for rules to reload
        await Page.WaitForTimeoutAsync(2000);
        
        // Should have more rules now
        var ruleCount = await Page.Locator("#rule-select option").CountAsync();
        Assert.That(ruleCount, Is.GreaterThan(100), "Complete rule set should have 379 rules");
    }
}
```

**Install Playwright browsers:**
```bash
cd Chandam.Wasm.Tests
dotnet build
pwsh bin/Debug/net8.0/playwright.ps1 install
```

**Run tests:**
```bash
dotnet test Chandam.Wasm.Tests
```

---

## Verification Checklist

After implementation, verify each phase:

1. ✅ **Phase 1:** `dotnet build Chandam.Wasm` succeeds, no Blazor routing errors
2. ✅ **Phase 2:** JsBridge.cs compiles, methods visible to TypeScript
3. ✅ **Phase 3:** `npm install && npm run build` creates `wwwroot/js/chandam-app.js`
4. ✅ **Phase 4-8:** TypeScript compiles without errors (`tsc`)
5. ✅ **Phase 9-10:** HTML/CSS render correctly in browser
6. ✅ **Phase 11:** `dotnet publish -c Release` runs npm build automatically
7. ✅ **Phase 12:** Playwright tests pass

**End-to-end test:**
1. `dotnet publish Chandam.Wasm -c Release -p:ExcludeYaml=true`
2. Serve `bin/Release/net8.0/publish/wwwroot/` via HTTP server
3. Open http://localhost:5000
4. Navigate to /analyze
5. **Verify default rule set**: Should show "Frequent Rules (9.3KB)" selected
6. **Verify rule count**: Rule picker should have 14 options
7. **Switch to complete**: Change dropdown to "Complete Telugu (65KB)"
8. **Verify reload**: Rule picker should update to 379 rules
9. Enter Telugu poem: `తేనెలేని తేటతేనె దొరకునె ధరణిపై`
10. Click Determine → verify results with green card
11. Select rule → Click Match → verify match/no-match indication
12. Click Random → verify editor fills with example poem
13. Test on mobile (360px viewport)
14. **Check network tab**: Verify `.br` files loaded (if browser supports Brotli)
15. Run `dotnet test Chandam.Wasm.Tests` → all green

---

## Risk Mitigation

**If JS/WASM interop fails:**
- Check browser console for DotNet global object
- Verify Program.cs calls `onWasmReady()`
- Test JsBridge methods via browser console: `DotNet.invokeMethodAsync('Chandam.Wasm', 'GetAllRules', 'te')`

**If npm build fails:**
- Check Node.js version (requires 18+)
- Run `npm install` manually in Client/
- Check vite.config.ts output path

**Rollback strategy:**
- Git branch `feature/vite-ui` before starting
- Keep deleted Razor files in `backup/` for reference
- If blocked, Blazor pages can coexist with TypeScript (different routes)

---

## Critical Files

**C# files:**
- [Chandam.Wasm/Program.cs](../../../Chandam.Wasm/Program.cs) - Store ServiceAccessor, signal onWasmReady
- [Chandam.Wasm/JsBridge.cs](../../../Chandam.Wasm/JsBridge.cs) - JSInvokable bridge (new)

**TypeScript files:**
- [Chandam.Wasm/Client/src/main.ts](../../../Chandam.Wasm/Client/src/main.ts) - Entry point
- [Chandam.Wasm/Client/src/wasm-bridge.ts](../../../Chandam.Wasm/Client/src/wasm-bridge.ts) - WASM interop
- [Chandam.Wasm/Client/src/router.ts](../../../Chandam.Wasm/Client/src/router.ts) - Client routing

**HTML/CSS:**
- [Chandam.Wasm/wwwroot/index.html](../../../Chandam.Wasm/wwwroot/index.html) - Shell
- [Chandam.Wasm/wwwroot/css/chandam.css](../../../Chandam.Wasm/wwwroot/css/chandam.css) - Styles

**Build:**
- [Chandam.Wasm/Chandam.Wasm.csproj](../../../Chandam.Wasm/Chandam.Wasm.csproj) - MSBuild targets
- [Chandam.Wasm/Client/vite.config.ts](../../../Chandam.Wasm/Client/vite.config.ts) - Vite config

**Tests:**
- [Chandam.Wasm.Tests/AnalyzePageTests.cs](../../../Chandam.Wasm.Tests/AnalyzePageTests.cs) - Playwright tests

---

## Docker Deployment

**Dockerfile updates:**
- Installs Node.js 20.x for TypeScript/Vite build
- Copies Client/ directory and runs `npm install && npm run build`
- Copies compressed rule files from Chandam.Config/Rules/
- Multi-stage build: .NET SDK → nginx:alpine
- Final image size: ~50MB (nginx + static files)

**nginx.conf updates:**
- Serves pre-compressed .br files for /data/ (rule files)
- Falls back to .gz then uncompressed if .br not available
- Proper Content-Encoding headers for Brotli
- Cache headers: 1 day for data, 7 days for framework

**docker-compose.yml:**
```yaml
chandam-wasm:
  build:
    context: .
    dockerfile: Chandam.Wasm/Dockerfile
  ports:
    - "8082:80"
  restart: unless-stopped
```

**Build & Run:**
```bash
# Build WASM image
docker build -t chandam-wasm:latest -f Chandam.Wasm/Dockerfile .

# Run standalone
docker run -d -p 8082:80 --name chandam-wasm chandam-wasm:latest

# Or via docker-compose (with API and MCP servers)
docker-compose up chandam-wasm

# Access at http://localhost:8082
```

**Verification:**
```bash
# Check container health
docker ps | grep chandam-wasm

# View logs
docker logs chandam-wasm

# Test endpoints
curl -I http://localhost:8082/
curl -I http://localhost:8082/data/chandam-rules.min.json
# Should see: Content-Encoding: br (if browser supports Brotli)

# Verify rule files loaded
docker exec chandam-wasm ls -lh /usr/share/nginx/html/data/
```

**Production deployment:**
- Push to Docker Hub: `docker push chandam-wasm:latest`
- Or deploy to cloud platforms (AWS ECS, Azure Container Apps, Google Cloud Run)
- Configure CDN (CloudFlare, CloudFront) for global distribution
- Enable HTTPS via reverse proxy (Traefik, nginx-proxy, Caddy)

---

## Future Phase: UI/UX Design Polish

**Status:** Deferred to separate implementation after functional baseline is working.

**Current phase delivers:**
- ✅ All functionality working (determine, match, scores, rule info, random)
- ✅ Rule set switching (frequent ↔ complete)
- ✅ Multi-page routing with clean URLs
- ✅ Basic mobile responsiveness (viewport meta, stacking)
- ✅ Minimal functional CSS for usability

**Future polish phase will add:**

### Visual Design
- [ ] **Color scheme refinement**: Test multiple Telugu-appropriate color palettes
- [ ] **Typography**: Font sizing hierarchy, line height, Telugu script rendering optimization
- [ ] **Spacing & layout**: Professional spacing system (8px grid), visual rhythm
- [ ] **Icons**: Replace Unicode symbols with proper Telugu-themed icons or SVG
- [ ] **Branding**: Logo design, consistent visual identity

### Mobile-First Enhancements
- [ ] **Touch targets**: 44px minimum for buttons/links (accessibility)
- [ ] **Swipe gestures**: Swipe between accordion sections
- [ ] **Virtual keyboard handling**: Prevent layout shift when keyboard opens
- [ ] **Orientation handling**: Portrait vs landscape optimization
- [ ] **Tablet breakpoint**: 768px+ layout improvements

### UX Improvements
- [ ] **Loading states**: Skeleton screens while WASM loads
- [ ] **Animations**: Smooth transitions (accordion, page navigation, results)
- [ ] **Empty states**: Helpful messages when no results
- [ ] **Tooltips**: Explain Yati/Prasa/Gana terms on hover
- [ ] **Keyboard shortcuts**: Power user features (Ctrl+Enter to determine)
- [ ] **Focus management**: Proper tab order, focus indicators

### Accessibility (WCAG 2.1 AA)
- [ ] **Color contrast**: Ensure 4.5:1 minimum for text
- [ ] **ARIA labels**: Screen reader support
- [ ] **Keyboard navigation**: All features accessible without mouse
- [ ] **Focus indicators**: Clear visible focus states
- [ ] **Error messages**: Clear, actionable Telugu error text
- [ ] **Alt text**: For any images/icons added

### Performance & Polish
- [ ] **CSS optimization**: Remove unused styles, minify
- [ ] **Animation performance**: Use transform/opacity only (GPU acceleration)
- [ ] **Print styles**: Clean print layout for saving results
- [ ] **Dark mode**: Optional dark theme (prefers-color-scheme)
- [ ] **Service worker**: Offline support with cached rules

### Content Pages (Currently Placeholders)
- [ ] **About page**: Full Chandam/prosody explanation with examples
- [ ] **Credits page**: Contributors, acknowledgments, references
- [ ] **Contact page**: Feedback form or contact information
- [ ] **Help/FAQ page**: Common questions, usage tips

### Testing
- [ ] **Cross-browser**: Safari, Firefox, Edge (currently only Chrome tested)
- [ ] **Device testing**: Real device testing on iOS/Android
- [ ] **Accessibility audit**: Lighthouse, axe DevTools
- [ ] **Performance audit**: Lighthouse performance score
- [ ] **User testing**: Feedback from Telugu speakers

**Estimated effort:** 2-3 weeks for full design polish
**Prerequisite:** Current phase must be functionally complete and deployed

**Design references to consider:**
- Telugu typography best practices
- Indian language UI patterns (Google Indic Keyboard, Microsoft Translator)
- Poetry/literary tool UIs (Poetry Foundation, Poets.org)
- Mobile-first design systems (Material Design, Fluent UI)

---

## Implementation Strategy

**This plan focuses on Phase 1: Functional Baseline**
- Get TypeScript + Blazor WASM integration working
- Implement all core features (determine, match, scores, etc.)
- Add rule set switching with Brotli compression
- Create minimal functional CSS
- Write Playwright tests for functionality

**Once baseline works:**
- Deploy to staging for user feedback
- Create separate plan for UI/UX polish phase
- Iterate on design based on real usage patterns
