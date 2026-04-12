# Implementation Plan: Animated Brand Icon Loaders for Chandam.Wasm

## Context

The user wants to replace the plain "Loading..." text in the Chandam WASM application with animated brand icons from the Chandam.Branding project. The animations should display during both:
1. Initial page load (while Blazor WASM bootstrap + rule loading happens)
2. Dynamic rule set switching (user-triggered via dropdown)

**User Requirements:**
1. **Remove 26-second minimum duration requirement** - Animation should hide immediately when resources load (better UX)
2. **Use `chandam-icon-telugu.gif`** - Traditional manuscript style (114 KB, most culturally authentic)
3. **Keep favicon.svg** - Not using animated GIF for favicon
4. **Create proper 404 page** - Use HTML page like `about.html` instead of inline content

**Additional Issues to Address:**
1. **Build failure in GitHub Actions:** The CopyBrandingAssets target fails because branding files don't exist in CI/CD
2. **Font spacing request:** Add more letter spacing for Suranna font with configurable CSS variables

## Current State Analysis

### Loading Mechanisms

**Initial Page Load:**
- `index.html` shows `<p>Loading...</p>` in `<main id="content">`
- Blazor WASM runtime boots, loads .br compressed assemblies
- `Program.cs` calls `WasmRuleLoaderService.InitializeAsync()` to load default rule set (9.3 KB .br)
- `Program.cs` signals JavaScript via `JSInterop.InvokeVoidAsync("onWasmReady")`
- `chandam-app.js` receives callback → initializes router → replaces content

**Dynamic Rule Set Switching:**
- User clicks dropdown → `switchRuleSet(ruleSetId)` in `rule-set-switcher.ts`
- Shows basic `#loading-indicator` div (simple text, no animation)
- Calls `WasmBridge.reloadRules()` → fetches new .br files (up to 108 KB for Topella)
- Hides loading indicator

### Available Brand Assets

Located in `Chandam.Branding/out/`:
- `chandam-icon-circles.gif` (945 KB) - Minimalist circles
- `chandam-icon-squares.gif` (235 KB) - Geometric squares
- `chandam-icon-telugu.gif` (114 KB) - **SELECTED** - Traditional manuscript style with dots and vertical lines

All 128×128px, 26-second loops at 30 FPS showing laghu-guru biological cell transitions.

**Note:** Not using animated GIF for favicon - continuing with existing `favicon.svg`.

### Build Issues

**Problem:** GitHub Actions fails at publish step
```
error MSB3030: Could not copy the file "../Chandam.Branding/out/favicon-animated-32.gif" because it was not found.
```

**Root Cause:** `Chandam.Wasm.csproj` lines 41-48 define `CopyBrandingAssets` target that expects Branding assets to exist. In CI/CD, Chandam.Branding is not built, so files don't exist.

**Solution:** Commit the 3 loader GIFs to git in `wwwroot/images/` so they're always available. Remove favicon-animated-32.gif from build target since we're keeping favicon.svg.

## Implementation Plan

### Phase 1: Fix Build Issue (Critical - Blocking)

**File:** `Chandam.Wasm/Chandam.Wasm.csproj`

**Current (lines 40-48):**
```xml
<!-- Copy branding assets (favicon GIFs) from Chandam.Branding/out/ to wwwroot/images/ -->
<Target Name="CopyBrandingAssets" BeforeTargets="Build">
  <ItemGroup>
    <!-- Only copy the optimized favicon (2.9 KB), not the large icon variants (114-945 KB) -->
    <BrandingGifFiles Include="..\Chandam.Branding\out\favicon-animated-32.gif" />
  </ItemGroup>
  <Copy SourceFiles="@(BrandingGifFiles)" DestinationFolder="wwwroot\images\" SkipUnchangedFiles="true" />
  <Message Text="Copied optimized favicon to wwwroot/images/" Importance="high" />
</Target>
```

**Replace with:**
```xml
<!-- Copy branding loader GIFs from Chandam.Branding/out/ to wwwroot/images/ -->
<Target Name="CopyBrandingAssets" BeforeTargets="Build" Condition="Exists('..\Chandam.Branding\out\')">
  <ItemGroup>
    <!-- Loader animations for WASM (114-945 KB) - only copy if source exists -->
    <BrandingGifFiles Include="..\Chandam.Branding\out\chandam-icon-circles.gif" Condition="Exists('..\Chandam.Branding\out\chandam-icon-circles.gif')" />
    <BrandingGifFiles Include="..\Chandam.Branding\out\chandam-icon-squares.gif" Condition="Exists('..\Chandam.Branding\out\chandam-icon-squares.gif')" />
    <BrandingGifFiles Include="..\Chandam.Branding\out\chandam-icon-telugu.gif" Condition="Exists('..\Chandam.Branding\out\chandam-icon-telugu.gif')" />
  </ItemGroup>
  <Copy SourceFiles="@(BrandingGifFiles)" DestinationFolder="wwwroot\images\" SkipUnchangedFiles="true" ContinueOnError="true" />
  <Message Text="Copied branding loader GIFs to wwwroot/images/" Importance="high" Condition="'@(BrandingGifFiles)' != ''" />
  <Message Text="Branding assets not found - using pre-committed files in wwwroot/images/" Importance="normal" Condition="'@(BrandingGifFiles)' == ''" />
</Target>
```

**Changes:**
1. Remove `favicon-animated-32.gif` (keeping existing `favicon.svg`)
2. Add `Condition="Exists('..\Chandam.Branding\out\')"` to entire target
3. Add individual `Condition` checks for each loader GIF
4. Add `ContinueOnError="true"` to Copy task
5. Conditional messages based on success/failure

**Result:** Build succeeds in CI/CD even if Branding project isn't built.

**Recommended Strategy:** Commit the 3 loader GIFs to `Chandam.Wasm/wwwroot/images/` in git so they're always available. This is the cleanest solution for CI/CD.

### Phase 2: Commit Pre-Built Loader Assets to Git

**Action:** Copy 3 loader GIF files to wwwroot and commit them

```bash
# From Chandam root directory
cp Chandam.Branding/out/chandam-icon-circles.gif Chandam.Wasm/wwwroot/images/
cp Chandam.Branding/out/chandam-icon-squares.gif Chandam.Wasm/wwwroot/images/
cp Chandam.Branding/out/chandam-icon-telugu.gif Chandam.Wasm/wwwroot/images/

git add Chandam.Wasm/wwwroot/images/chandam-icon-*.gif
git commit -m "Add pre-built brand loader animations for WASM

- chandam-icon-circles.gif (945 KB)
- chandam-icon-squares.gif (235 KB)  
- chandam-icon-telugu.gif (114 KB) - primary loader
"
```

**Rationale:**
- These are final, stable assets (unlikely to change frequently)
- Eliminates build dependency on Chandam.Branding project
- Ensures CI/CD always has assets available
- CopyBrandingAssets target becomes a local dev convenience only
- **Note:** Not including `favicon-animated-32.gif` - continuing with existing `favicon.svg`

### Phase 3: Create Event-Driven Loading System

**New File:** `Chandam.Wasm/Client/src/utils/loading-events.ts`

```typescript
// Event-driven loading system - decouples business logic from UI

export enum LoadingEventType {
  LoadingStarted = 'loading:started',
  LoadingCompleted = 'loading:completed',
  LoadingFailed = 'loading:failed'
}

export interface LoadingEventDetail {
  source: string; // 'wasm-init' | 'rule-set-switch'
  message?: string;
}

export class LoadingEvents {
  static emit(type: LoadingEventType, detail: LoadingEventDetail): void {
    const event = new CustomEvent(type, { detail });
    window.dispatchEvent(event);
    console.log(`LoadingEvent: ${type}`, detail);
  }

  static onLoadingStarted(callback: (detail: LoadingEventDetail) => void): void {
    window.addEventListener(LoadingEventType.LoadingStarted, (e: Event) => {
      callback((e as CustomEvent<LoadingEventDetail>).detail);
    });
  }

  static onLoadingCompleted(callback: (detail: LoadingEventDetail) => void): void {
    window.addEventListener(LoadingEventType.LoadingCompleted, (e: Event) => {
      callback((e as CustomEvent<LoadingEventDetail>).detail);
    });
  }

  static onLoadingFailed(callback: (detail: LoadingEventDetail) => void): void {
    window.addEventListener(LoadingEventType.LoadingFailed, (e: Event) => {
      callback((e as CustomEvent<LoadingEventDetail>).detail);
    });
  }
}
```

**New File:** `Chandam.Wasm/Client/src/utils/loader.ts`

```typescript
import { LoadingEvents, LoadingEventType } from './loading-events';

export interface LoaderConfig {
  gifPath: string;
  fallbackText: string;
  containerId: string;
}

export class LoadingAnimationManager {
  private config: LoaderConfig;
  private isShowing: boolean = false;

  constructor(config: LoaderConfig) {
    this.config = config;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    LoadingEvents.onLoadingStarted((detail) => {
      this.show();
    });

    LoadingEvents.onLoadingCompleted((detail) => {
      this.hide();
    });

    LoadingEvents.onLoadingFailed((detail) => {
      this.hide();
    });
  }

  private show(): void {
    const container = document.getElementById(this.config.containerId);
    if (!container) {
      console.error(`Loader: Container #${this.config.containerId} not found`);
      return;
    }

    if (this.isShowing) return; // Already showing

    container.innerHTML = this.createLoaderHTML();
    this.isShowing = true;
    console.log('Loader: Showing');
  }

  private async hide(): Promise<void> {
    if (!this.isShowing) return;

    const container = document.getElementById(this.config.containerId);
    if (container) {
      const loaderDiv = container.querySelector('.loader-container');
      if (loaderDiv) {
        loaderDiv.classList.add('fade-out');
        await this.delay(500); // Wait for CSS fade-out transition
        container.innerHTML = '';
      }
    }

    this.isShowing = false;
    console.log('Loader: Hidden');
  }

  private createLoaderHTML(): string {
    return `
      <div class="loader-container">
        <img src="${this.config.gifPath}" 
             alt="${this.config.fallbackText}" 
             class="loader-gif"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <p class="loader-fallback" style="display:none;">${this.config.fallbackText}</p>
      </div>
    `;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Pre-load image to browser cache for instant display
export function preloadLoaderImage(gifPath: string): void {
  const img = new Image();
  img.src = gifPath;
  console.log(`Preloading loader image: ${gifPath}`);
}

export function createInitialLoader(): LoadingAnimationManager {
  return new LoadingAnimationManager({
    gifPath: '/images/chandam-icon-telugu.gif',
    fallbackText: 'Loading Chandam...',
    containerId: 'initial-loader'
  });
}

export function createDynamicLoader(): LoadingAnimationManager {
  return new LoadingAnimationManager({
    gifPath: '/images/chandam-icon-telugu.gif',
    fallbackText: 'Loading rule set...',
    containerId: 'dynamic-loader-container'
  });
}
```

**Key Improvements:**
- **Event-driven architecture** - Business logic emits events, loader listens
- **Separation of concerns** - Rule loading code doesn't know about loader UI
- **Pre-load support** - `preloadLoaderImage()` function caches GIF in browser
- **Auto-wiring** - Loader automatically listens to loading events
- Simpler API - No manual show/hide calls in business logic

### Phase 4: Update Initial Page Load HTML

**File:** `Chandam.Wasm/wwwroot/index.html`

**In `<head>` section, add preload link (after line 10, before closing `</head>`):**
```html
<!-- Preload loader GIF to browser cache for instant display -->
<link rel="preload" href="/images/chandam-icon-telugu.gif" as="image" type="image/gif" />
```

**Current (lines 27-29):**
```html
<main id="content">
  <p>Loading...</p>
</main>
```

**Replace with:**
```html
<main id="content">
  <div id="initial-loader">
    <!-- Loader will be injected here, but show static version initially -->
    <div class="loader-container">
      <img src="/images/chandam-icon-telugu.gif" 
           alt="Loading Chandam..." 
           class="loader-gif"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
      <p class="loader-fallback" style="display:none;">Loading...</p>
    </div>
  </div>
</main>
```

**Rationale:**
- `<link rel="preload">` tells browser to cache GIF immediately on page load
- Static HTML version shows instantly (no JavaScript delay)
- Event system can replace content later if needed

### Phase 5: Update CSS Styling

**File:** `Chandam.Wasm/wwwroot/css/chandam.css`

**Add after line 169 (after `#loading-indicator`):**

```css
/* ========================================
   ANIMATED BRAND LOADERS
   ======================================== */

/* Container for loading animation - ALWAYS CENTERED */
.loader-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  
  /* Flexbox centering */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  z-index: 9999;
  opacity: 1;
  transition: opacity 0.5s ease-out;
}

/* Fade-out animation */
.loader-container.fade-out {
  opacity: 0;
}

/* Loader GIF - centered by parent flexbox */
.loader-gif {
  width: 128px;
  height: 128px;
  
  /* Preserve GIF quality */
  image-rendering: crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-optimize-contrast;
  
  /* Prevent unwanted margins */
  margin: 0;
  display: block;
}

/* Fallback text (if GIF fails to load) */
.loader-fallback {
  color: #ffffff;
  font-family: var(--font-main);
  font-size: 1.2rem;
  margin-top: 1rem;
  text-align: center;
}

/* Initial loader specific styling */
#initial-loader .loader-container {
  background: var(--color-header-bg); /* Black background for initial load */
}

/* Dynamic loader overlay (appears over content) */
#dynamic-loader-container .loader-container {
  background: rgba(0, 0, 0, 0.95); /* Slightly more opaque */
}

/* Mobile responsive */
@media (max-width: 768px) {
  .loader-gif {
    width: 96px;
    height: 96px;
  }
  
  .loader-fallback {
    font-size: 1rem;
  }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .loader-gif {
    width: 112px;
    height: 112px;
  }
}
```

**Centering Strategy:**
- **Flexbox on parent** - `display: flex` + `align-items: center` + `justify-content: center`
- **Full viewport coverage** - `position: fixed` + `100vw/100vh`
- **Block display on img** - Prevents inline spacing issues
- **No manual positioning** - No `top: 50%` / `transform` hacks needed

### Phase 6: Update JavaScript Entry Point (Event-Driven)

**File:** `Chandam.Wasm/Client/src/main.ts`

**Add imports at top:**
```typescript
import { createInitialLoader, preloadLoaderImage } from './utils/loader';
import { LoadingEvents, LoadingEventType } from './utils/loading-events';
```

**Add after router initialization (before `window.onWasmReady` definition):**
```typescript
// Pre-load loader GIF to browser cache
preloadLoaderImage('/images/chandam-icon-telugu.gif');

// Initialize loader system (sets up event listeners)
const initialLoader = createInitialLoader();

// Note: Initial loader is already visible in HTML,
// We just need to emit completion event when WASM is ready
```

**Replace `window.onWasmReady` (current lines ~83-86) with:**
```typescript
window.onWasmReady = () => {
  console.log('WASM ready, emitting completion event...');
  
  // Emit event - loader listens and hides itself
  LoadingEvents.emit(LoadingEventType.LoadingCompleted, {
    source: 'wasm-init',
    message: 'WASM initialization complete'
  });
  
  // Router initializes after loader fades out (500ms)
  setTimeout(() => {
    console.log('Initializing router');
    router.init();
  }, 600); // Slightly longer than fade-out duration
};
```

**Key Benefits:**
- **No direct loader calls** - Business logic just emits events
- **Loader auto-manages itself** - Listens to events and shows/hides
- **Pre-loading** - GIF cached immediately on page load
- **Clean separation** - WASM init code doesn't import loader classes

### Phase 7: Update Dynamic Rule Switching (Event-Driven)

**File:** `Chandam.Wasm/Client/src/ui/rule-set-switcher.ts`

**Add imports at top:**
```typescript
import { createDynamicLoader } from '../utils/loader';
import { LoadingEvents, LoadingEventType } from '../utils/loading-events';
```

**Add initialization (run once on module load):**
```typescript
// Initialize dynamic loader system (sets up event listeners)
// Create container once
const loaderContainer = document.createElement('div');
loaderContainer.id = 'dynamic-loader-container';
document.body.appendChild(loaderContainer);

// Initialize loader (auto-wires to events)
const dynamicLoader = createDynamicLoader();
```

**Replace `switchRuleSet` function with:**
```typescript
export async function switchRuleSet(ruleSetId: string) {
  const ruleSet = getRuleSet(ruleSetId);
  if (!ruleSet) {
    console.error(`Rule set not found: ${ruleSetId}`);
    return;
  }

  // Emit loading started event - loader listens and shows itself
  LoadingEvents.emit(LoadingEventType.LoadingStarted, {
    source: 'rule-set-switch',
    message: `Loading ${ruleSet.name}`
  });

  try {
    console.log(`Switching to rule set: ${ruleSet.name}`);
    
    // Pure business logic - no UI concerns
    const result = await WasmBridge.reloadRules(ruleSet.rulesFile, ruleSet.examplesFile);

    if (result.success) {
      const rules = await WasmBridge.getAllRules();
      renderRulePicker(rules, 'rule-picker-container');
      console.log(`Loaded ${rules.length} rules from ${ruleSet.name}`);
      
      // Emit success event
      LoadingEvents.emit(LoadingEventType.LoadingCompleted, {
        source: 'rule-set-switch',
        message: `Loaded ${rules.length} rules`
      });
    } else {
      // Emit failure event
      LoadingEvents.emit(LoadingEventType.LoadingFailed, {
        source: 'rule-set-switch',
        message: result.errorMessage || 'Unknown error'
      });
      
      alert(`Failed to load rules: ${result.errorMessage}`);
    }
  } catch (err) {
    console.error('Failed to switch rule set:', err);
    
    // Emit failure event
    LoadingEvents.emit(LoadingEventType.LoadingFailed, {
      source: 'rule-set-switch',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
    
    alert('లోపం సంభవించింది (Error occurred)');
  }
}
```

**Key Benefits:**
- **100% separation of concerns** - Business logic emits events only
- **No loader imports in business logic** - Just imports event system
- **Self-managing loader** - Automatically shows/hides based on events
- **Cleaner error handling** - Events emitted for success, failure, completion
- **No async loader management** - No `await loader.hide()` calls
- **Promise-based** - Business logic returns naturally, loader manages timing

### Phase 8: Create 404 Page

**New File:** `Chandam.Wasm/wwwroot/pages/404.html`

```html
<div class="content-page">
  <h2>పేజీ కనుగొనబడలేదు (Page Not Found)</h2>
  <p>క్షమించండి, మీరు వెతుకుతున్న పేజీ కనుగొనబడలేదు.</p>
  <p>Sorry, the page you are looking for could not be found.</p>
  <div style="margin-top: 2rem;">
    <a href="/" style="display: inline-block; padding: 0.5rem 1rem; background: var(--color-header-bg); color: var(--color-header-text); text-decoration: none; border-radius: 4px;">
      ← Go to Home
    </a>
  </div>
</div>
```

**File:** `Chandam.Wasm/Client/src/router.ts`

**Find loadPage function (around line 146-157) and update the 404 handling:**

**Current:**
```typescript
async function loadPage(url: string) {
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

**Replace with:**
```typescript
async function loadPage(url: string) {
  const content = document.getElementById('content');
  if (!content) return;

  try {
    const response = await fetch(url);
    if (response.ok) {
      content.innerHTML = await response.text();
    } else {
      // Load 404 page instead of inline text
      const notFoundResponse = await fetch('pages/404.html');
      if (notFoundResponse.ok) {
        content.innerHTML = await notFoundResponse.text();
      } else {
        content.innerHTML = '<p>Page not found</p>';
      }
    }
  } catch (err) {
    console.error('Failed to load page:', err);
    content.innerHTML = '<p>Error loading page</p>';
  }
}
```

### Phase 9: Improve Suranna Font Spacing

**File:** `Chandam.Wasm/wwwroot/css/chandam.css`

**Current (lines 16-30):**
```css
:root {
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-header-bg: #000000;
  --color-header-text: #ffffff;
  --color-success: #2d6a4f;
  --color-error: #c1121f;
  --color-border: #cccccc;

  /* 4 Font Purposes */
  --font-logo: 'RamaneeyaWin', 'Noto Sans Telugu', sans-serif;  /* 1. Logo/Brand (Ramaneeya - legacy) */
  --font-display: 'Timmana', 'Noto Sans Telugu', sans-serif;    /* 2. Display/Headers (meter names) */
  --font-editor: 'Suranna', 'Noto Sans Telugu', serif;          /* 3. Editor text */
  --font-main: 'Noto Sans Telugu', sans-serif;                  /* 4. Body/Table text */
}
```

**Replace with:**
```css
:root {
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-header-bg: #000000;
  --color-header-text: #ffffff;
  --color-success: #2d6a4f;
  --color-error: #c1121f;
  --color-border: #cccccc;

  /* 4 Font Purposes */
  --font-logo: 'RamaneeyaWin', 'Noto Sans Telugu', sans-serif;  /* 1. Logo/Brand (Ramaneeya - legacy) */
  --font-display: 'Timmana', 'Noto Sans Telugu', sans-serif;    /* 2. Display/Headers (meter names) */
  --font-editor: 'Suranna', 'Noto Sans Telugu', serif;          /* 3. Editor text */
  --font-main: 'Noto Sans Telugu', sans-serif;                  /* 4. Body/Table text */
  
  /* Suranna font styling variables */
  --font-editor-size: 1.1rem;
  --font-editor-letter-spacing: 0.05em;
  --font-editor-line-height: 1.8;
}
```

**Then find the poem-editor styling (around line 95-102) and update:**

**Current:**
```css
#poem-editor {
  width: 100%;
  padding: 12px;
  font-family: var(--font-editor);
  font-size: 1.1rem;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  line-height: 1.8;
}
```

**Replace with:**
```css
#poem-editor {
  width: 100%;
  padding: 12px;
  font-family: var(--font-editor);
  font-size: var(--font-editor-size);
  letter-spacing: var(--font-editor-letter-spacing);
  line-height: var(--font-editor-line-height);
  border: 2px solid var(--color-border);
  border-radius: 4px;
}
```

**Also update any `.poem` or `.poem-text` classes that use Suranna (search for them and add letter-spacing):**

```css
.poem,
.poem-text {
  font-family: var(--font-editor);
  font-size: var(--font-editor-size);
  letter-spacing: var(--font-editor-letter-spacing);
  line-height: var(--font-editor-line-height);
  white-space: pre-wrap;
}
```

## Critical Files to Modify

### New Files (3)
1. **`Chandam.Wasm/Client/src/utils/loading-events.ts`** - Event system (Phase 3)
2. **`Chandam.Wasm/Client/src/utils/loader.ts`** - Event-driven loader module (Phase 3)
3. **`Chandam.Wasm/wwwroot/pages/404.html`** - 404 page (Phase 8)

### Modified Files (7)
4. **`Chandam.Wasm/Chandam.Wasm.csproj`** - Fix build target (Phase 1)
5. **`Chandam.Wasm/wwwroot/images/`** - Add 3 loader GIF files via commit (Phase 2)
6. **`Chandam.Wasm/wwwroot/index.html`** - Add preload + static loader (Phase 4)
7. **`Chandam.Wasm/wwwroot/css/chandam.css`** - Loader styles + Suranna spacing (Phase 5 & 9)
8. **`Chandam.Wasm/Client/src/main.ts`** - Emit events for WASM init (Phase 6)
9. **`Chandam.Wasm/Client/src/ui/rule-set-switcher.ts`** - Emit events for rule loading (Phase 7)
10. **`Chandam.Wasm/Client/src/router.ts`** - Load 404.html (Phase 8)

## Verification Steps

### Test 1: Build Success in CI/CD
```bash
# Verify build doesn't fail
dotnet publish Chandam.Wasm/Chandam.Wasm.csproj -c Release -p:ExcludeYaml=true
```
**Expected:** Build succeeds without MSB3030 error

### Test 2: Initial Page Load Animation
1. Clear browser cache
2. Open DevTools Network tab
3. Navigate to application
4. Verify `chandam-icon-telugu.gif` loads immediately (from preload)
5. Verify loader is perfectly centered vertically and horizontally
6. Verify animated Telugu GIF displays immediately
7. Open Console, verify event logs: `LoadingEvent: loading:completed`
8. Verify loader hides as soon as WASM loads (no artificial delay)
9. Verify smooth 500ms fade-out before content appears

**Expected:**
- GIF loads in < 500ms (small file, preloaded)
- Loader perfectly centered at all viewport sizes
- No flash of unstyled content (FOUC)
- Event-driven hide (no direct function calls)

### Test 3: Dynamic Loading Animation & Event System
1. Navigate to `/compute/frequent/`
2. Open DevTools Console
3. Select "Complete Telugu" from dropdown
4. Verify Console logs:
   - `LoadingEvent: loading:started {source: "rule-set-switch"}`
   - `LoadingEvent: loading:completed {source: "rule-set-switch"}`
5. Verify Telugu GIF loader overlay appears instantly (pre-cached)
6. Verify loader is perfectly centered over existing content
7. Verify loader hides immediately when rules finish loading
8. Verify smooth fade-out and new rules load correctly
9. Test rapid switching: Select "Topella" → "Frequent" quickly
   - Verify each switch triggers events
   - Verify no race conditions or stuck loaders

**Expected:**
- Event logs confirm decoupled architecture
- GIF appears instantly (no network request in DevTools)
- Perfect centering maintained
- No manual show/hide calls in business logic

### Test 4: 404 Page
1. Navigate to invalid URL (e.g., `/invalid-page`)
2. Verify 404.html loads with Telugu and English message
3. Verify "Go to Home" link works
4. Test on both initial route and via navigation

### Test 5: Suranna Font Spacing
1. Navigate to compute page
2. Type Telugu text in poem editor
3. Verify increased letter spacing is visible and readable
4. Check line height and overall text appearance

### Test 6: Fallback Handling
1. Block `/images/chandam-icon-telugu.gif` in DevTools Network tab
2. Reload page
3. Verify fallback text "Loading..." displays
4. Verify application still works

## Edge Cases Handled

1. **GIF fails to load:** Native `onerror` handler shows fallback text
2. **Very fast WASM load (< 1s):** Loader hides immediately with smooth fade-out (good UX)
3. **Very slow network (large rule sets):** Loader continues showing until loading completes
4. **Rapid rule set switching:** Each call creates independent loader instance
5. **404/Invalid routes:** Proper 404.html page loads instead of inline error text

## Architecture: Event-Driven Loading System

### Before (Tightly Coupled)
```
switchRuleSet() 
  ├─ loader.show()              ❌ Direct UI manipulation
  ├─ await WasmBridge.reload()  ✅ Business logic
  └─ await loader.hide()        ❌ Direct UI manipulation
```

**Problems:**
- Business logic knows about loader UI
- Hard to change loader implementation
- Can't add multiple loaders (progress bars, notifications, etc.)

### After (Event-Driven)
```
switchRuleSet()
  ├─ LoadingEvents.emit(LoadingStarted)    ✅ Event emission
  ├─ await WasmBridge.reload()             ✅ Business logic
  └─ LoadingEvents.emit(LoadingCompleted)  ✅ Event emission

LoadingAnimationManager (listener)
  ├─ on(LoadingStarted) → show()           ✅ UI logic
  └─ on(LoadingCompleted) → hide()         ✅ UI logic
```

**Benefits:**
- ✅ Business logic only emits events
- ✅ Loader self-manages based on events
- ✅ Easy to add more listeners (progress bars, analytics, etc.)
- ✅ Loader can be swapped without changing business code

### Event Flow Diagram

```
User visits page
    ↓
[index.html]
    ├─ <link rel="preload" .../chandam-icon-telugu.gif>  ← Browser caches GIF
    └─ <div id="initial-loader"> with static loader       ← Shows immediately
    ↓
[main.ts loads]
    ├─ preloadLoaderImage()                               ← Reinforces cache
    ├─ createInitialLoader()                              ← Sets up event listeners
    └─ window.onWasmReady callback registered
    ↓
[Blazor WASM boots]
    ↓
[Program.cs signals ready]
    ├─ JSInterop.InvokeVoidAsync("onWasmReady")
    ↓
[main.ts: window.onWasmReady fires]
    ├─ LoadingEvents.emit(LoadingCompleted)               ← Event emission
    ↓
[LoadingAnimationManager hears event]
    ├─ hide()
    │   ├─ Add 'fade-out' class                           ← CSS transition starts
    │   ├─ await delay(500ms)                             ← Wait for fade
    │   └─ Clear HTML                                     ← Remove from DOM
    ↓
[Router initializes]
    └─ Application ready


User switches rule set
    ↓
[rule-set-switcher.ts: switchRuleSet() called]
    ├─ LoadingEvents.emit(LoadingStarted)                 ← Event emission
    ↓
[LoadingAnimationManager hears event]
    ├─ show()
    │   └─ Inject loader HTML (GIF already cached!)       ← Instant display
    ↓
[Business logic runs]
    ├─ await WasmBridge.reloadRules()                     ← Async operation
    ↓
[Loading completes]
    ├─ LoadingEvents.emit(LoadingCompleted)               ← Event emission
    ↓
[LoadingAnimationManager hears event]
    └─ hide() → fade-out → remove
```

### Pre-loading Strategy

**1. HTML `<link rel="preload">`** (Phase 4)
```html
<link rel="preload" href="/images/chandam-icon-telugu.gif" as="image" type="image/gif" />
```
- Browser downloads GIF in parallel with page load
- Happens before JavaScript executes
- Highest priority

**2. JavaScript `new Image()`** (Phase 6)
```typescript
const img = new Image();
img.src = '/images/chandam-icon-telugu.gif';
```
- Reinforces browser cache
- Ensures GIF is loaded even if `<link>` fails
- Executes when TypeScript loads

**3. Static HTML in initial-loader** (Phase 4)
```html
<img src="/images/chandam-icon-telugu.gif" ... />
```
- Shows immediately (no JavaScript required)
- Third cache mechanism
- Fallback if JavaScript fails

**Result:** GIF displays instantly when loader shows (already in browser cache)

## Build Process

After making changes:

```bash
# 1. Navigate to TypeScript directory
cd Chandam.Wasm/Client

# 2. Build TypeScript bundle
npm run build

# 3. Output: ../wwwroot/js/chandam-app.js

# 4. Test locally
cd ../..
dotnet run --project Chandam.Wasm

# 5. Test production build
dotnet publish Chandam.Wasm/Chandam.Wasm.csproj -c Release -p:ExcludeYaml=true
```

## Key Improvements from Original Plan

1. **No artificial 26-second delay** - Loader hides immediately when resources load (better UX)
2. **Smaller file size** - Telugu GIF (114 KB) instead of Circles GIF (945 KB) - 88% reduction
3. **Event-driven architecture** - Business logic separated from rendering via CustomEvents
4. **Pre-loaded images** - GIF cached by browser for instant display
5. **Proper 404 page** - HTML page with Telugu + English instead of inline text
6. **Keep existing favicon.svg** - Not using animated GIF for favicon

## Implementation Order

1. ✅ **Phase 1** - Fix build issue (critical blocker)
2. ✅ **Phase 2** - Commit 3 loader GIFs to git
3. ✅ **Phase 3** - Create event system + loader module (event-driven architecture)
   - Create `loading-events.ts` first
   - Create `loader.ts` second (depends on events)
4. ✅ **Phase 5** - Add CSS styles with explicit centering (do before HTML to avoid FOUC)
5. ✅ **Phase 4** - Update index.html (add preload + static loader)
6. ✅ **Phase 6** - Update main.ts (emit events, preload image)
7. ✅ **Phase 7** - Update rule-set-switcher.ts (emit events, no direct loader calls)
8. ✅ **Phase 8** - Create 404.html page and update router
9. ✅ **Phase 9** - Improve Suranna font spacing
10. ✅ Build TypeScript bundle (`npm run build`)
11. ✅ Test all scenarios (6 tests total)

**Dependencies:**
- Phase 3 must complete before Phase 6 & 7 (they import from it)
- Phase 5 must complete before Phase 4 (prevents FOUC)
- Phase 2 must complete before testing (GIFs must exist)
