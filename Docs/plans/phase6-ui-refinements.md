# Plan: Bug Fixes and UI Refinements

## Context

The URL-based routing system was successfully implemented with all 11 phases complete. The application is running and functional, but several issues need to be addressed based on user testing:

**Critical Issues:**
1. **Port configuration mismatch**: README.md references `localhost:5000`, but the application runs on dynamic ports (59849/59850) from launchSettings.json
2. **Match fails on specific rule pages**: On `/compute/complete/taralamu`, an example loads but clicking Match fails, while Match works fine on `/compute/complete/` with dropdown
3. **Missing yati and prasa selectors**: Checkboxes for yati/prasa matching options are missing from compute pages
4. **Example query string not in URL**: When clicking "Try This Example", the URL doesn't show `?example=N`

**UI Refinements:**
5. **Rule dropdown shows frequency**: Dropdown displays `${ruleName} (${frequency})`, but user wants just the short name
6. **Rule dropdown grouping**: Currently groups all rules by padyamType, but user wants Vruttams grouped by chandamName (త్రిష్టుప్పు, జగతి, etc.)
7. **Clear icon not intuitive**: X symbol is not typical for clear, prefer sweeping brush icon 🧹
8. **Double icons on links**: "Go to Compute", "Browse all rules" showing emoji twice (in text and CSS)
9. **Show -1 chars/matras**: On learn pages, don't display charLength or matraLength if value is -1
10. **Frequency on rule cards**: Learn index page rule cards shouldn't show frequency
11. **Unknown chandam-group**: On `/learn/complete/`, some rules show "Unknown" as chandamName
12. **Match button and dropdown separated**: They should be adjacent in the UI layout
13. **No auto-select after Determine**: When Determine finds best match, dropdown should auto-select that rule
14. **No tabbed behavior**: Want tabs to switch between Match mode and Determine mode

These are refinements to the working implementation, not a complete rewrite.

---

## Issue Analysis

### 1. Port Configuration

**Current state:**
- `Chandam.Wasm/Properties/launchSettings.json` specifies:
  ```json
  "applicationUrl": "https://localhost:59849;http://localhost:59850"
  ```
- README.md instructs users to open `http://localhost:5000`

**Impact:** Documentation mismatch causes confusion when users follow README instructions.

---

### 2. Match Failure on Rule Pages

**Current state:**
- `rule-page.ts` (lines 164-184) has inline Match handler that directly calls `WasmBridge.tryMatch(poemText, ruleId, true, true)`
- `rule-set-page.ts` (line 91) uses shared `handleMatch` from `actions.ts` which gets ruleId from dropdown
- Rule page Match handler looks correct, so failure could be:
  - **Case sensitivity**: URL has `taralamu` (lowercase) but rule identifier might be `Taralamu` (PascalCase)
  - **Rule not loaded**: Rule set might not be loaded properly
  - **WASM call error**: tryMatch might be failing silently

**Investigation needed:**
- Check browser console for JavaScript errors when Match is clicked
- Verify that ruleId parameter matches what's in the loaded rules
- Check if error handling is swallowing useful error messages

---

### 3. Rule Dropdown Display

**Current state:**
- `rule-picker.ts` line 27:
  ```typescript
  option.textContent = `${rule.name} (${rule.frequency})`;
  ```
- Displays: "ఉత్పలమాల (Frequent)"

**User wants:**
- Display short name only: "ఉత్పలమాల"
- Use `rule.shortName` if available, else `rule.name`

**Blockers:**
- Current code uses `RuleSummary[]` from `getAllRules()` which doesn't have `shortName`
- Need to switch to `RuleSummaryDetailed[]` from `getAllRulesDetailed()` which has `shortName`

---

### 4. Rule Dropdown Grouping

**Current state:**
- `rule-picker.ts` lines 8-13: Groups by `rule.padyamType` (Vruttam, Jati, SubJati, Ragada)
- All Vruttams are in one giant optgroup regardless of meter family

**User wants:**
- Vruttams grouped by `chandamName` (త్రిష్టుప్పు, జగతి, అత్యష్టి, etc.)
- **Just chandamName, no "(Vruttam)" suffix** - e.g., "త్రిష్టుప్పు", not "త్రిష్టుప్పు (Vruttam)"
- Other types (Jati, SubJati, Ragada) remain grouped by padyamType
- **Consistent grouping logic** across dropdown and learn index page

**Example structure:**
```
<optgroup label="త్రిష్టుప్పు">
  <option>ఇంద్రవజ్రము</option>
  <option>ఉత్పలమాల</option>
  ...
</optgroup>
<optgroup label="జగతి">
  <option>వంశస్థము</option>
  ...
</optgroup>
<optgroup label="Jati">
  <option>ఆట వేలది</option>
  ...
</optgroup>
```

**Implementation requirements:**
- Switch to `RuleSummaryDetailed[]` to get `chandamName`
- Group Vruttams by `chandamName` (no suffix), others by `padyamType`
- **Create shared grouping utility** to ensure consistency
- Sort chandamName groups alphabetically

---

### 5. Missing Yati and Prasa Selectors

**Current state:**
- Old `/analyze` page had checkboxes for yati and prasa options
- New compute pages don't have these checkboxes
- Both rule-page.ts and rule-set-page.ts hardcode `yati: true, prasa: true` in WASM calls

**User wants:**
- Checkboxes to toggle yati and prasa matching
- Default: both checked
- Should apply to both Determine and Match operations

**Fix:**
- Add checkboxes to compute page HTML
- Update event handlers to read checkbox state instead of hardcoding true

---

### 6. Example Query String Not in URL

**Current state:**
- `learn-detail-page.ts` generates links: `<a href="/compute/${ruleSetId}/${ruleId}?example=${exampleNumber}">`
- User reports: clicking "Try This Example" doesn't show query string in URL

**Possible causes:**
- Router might be stripping query params
- Link navigation might not be preserving query params
- Browser history manipulation might be cleaning URL

**Investigation needed:**
- Test clicking "Try This Example" and check if query param appears
- Check router's `navigate()` method to see if it handles query params correctly

---

### 7. Clear Icon Not Intuitive

**Current state:**
- Using `✕` (multiplication sign) for Clear button
- User finds it confusing (not typical for clear action)

**User wants:**
- Sweeping brush icon: 🧹

**Fix:** Simple one-character change in HTML templates

---

### 8. Double Icons on Links

**Current state:**
- Links like "📖 Learn More" and "✏️ Go to Compute" have emoji in text
- CSS also adds emoji with `::before { content: "📖 " }`
- Result: Double emoji rendering

**Fix:**
- Remove emoji from link text in HTML
- Keep emoji in CSS only (or vice versa)

---

### 9. Use Char/Matra Ranges Instead of Single Values

**Current state:**
- Learn index page displays: "11 chars | 18 matras | Frequent"
- Uses single charLength and matraLength values
- Some rules have charLength or matraLength of -1 (meaning not applicable)
- Displaying "-1 chars" or "-1 matras" is confusing

**User wants:**
- Display char/matra **ranges** instead of single values
- Format: "11-15 chars" or "18-22 matras"
- Skip displaying if min/max not available (or -1)

**Implementation:**
- Add `Min` (MinCharLength) and `Max` (MaxCharLength) to `GetAllRulesDetailed` C# DTO
- Update TypeScript `RuleSummaryDetailed` interface to include `min?: number` and `max?: number`
- Update display logic in `learn-index-page.ts`:
  - If min === max: show "11 chars" (single value)
  - If min !== max: show "11-15 chars" (range)
  - If min or max is -1 or undefined: skip displaying

---

### 10. Frequency on Rule Cards

**Current state:**
- Learn index page rule cards show: "11 chars | 18 matras | Frequent"

**User wants:**
- Remove "Frequent" / "Common" / "Rare" from rule cards
- Keep only: "11 chars | 18 matras"

**Fix:** Remove frequency from metadata string in `learn-index-page.ts`

---

### 11. Unknown Chandam-Group

**Current state:**
- On `/learn/complete/`, some rules have no `chandamName` value
- Code shows them as "Unknown" group

**User wants:**
- Better handling of rules without chandamName
- Could group by padyamType instead, or use a more descriptive label

**Fix:** Update grouping logic in `learn-index-page.ts` to handle missing chandamName

---

### 12. Match Button and Dropdown Separated

**Current state:**
- Rule dropdown and Match button are in separate sections with spacing

**User wants:**
- They should be adjacent (side by side or stacked close together)

**Fix:** Update CSS and HTML layout in `rule-set-page.ts`

---

### 13. No Auto-Select After Determine

**Current state:**
- User clicks Determine
- Best match is shown in results
- Dropdown still shows default "-- Select a rule --"

**User wants:**
- After Determine, dropdown should automatically select the best matching rule
- This allows quick follow-up actions (e.g., edit poem and click Match without re-selecting)

**Fix:** 
- Update `handleDetermine` in `actions.ts` to set dropdown value
- `document.getElementById('rule-select').value = response.matches[0].rule.identifier`

---

### 14. Tabbed Behavior for Match and Determine

**Current state:**
- Both "Determine" and "Match" buttons are always visible
- Both actions available simultaneously

**User wants:**
- Tabs to switch between two modes:
  - **Determine mode**: No dropdown, only Determine button
  - **Match mode**: Dropdown + Match button
- This simplifies the UI and makes the workflow clearer

**Design options:**
- Option A: Two tabs at top, content changes based on selected tab
- Option B: Radio buttons to switch modes
- Option C: Keep both buttons, add visual grouping

**Recommended:** Option A (tabs) for clearer mode separation

---

## Summary of Key User Refinements

Based on latest feedback, the following changes are required:

1. **Use "Compute" terminology** - No "Analyzer" anywhere, use "Compute" consistently
2. **Keep both .json and .br files** - Both are needed (.br for compression)
3. **Group labels without suffix** - Show "త్రిష్టుప్పు" NOT "త్రిష్టుప్పు (Vruttam)"
4. **Char/matra ranges** - Show "11-15 chars" using min/max, not single charLength value
5. **Consistent grouping** - Same grouping logic across dropdown and learn pages
6. **Shared grouping utility** - Create `utils/rule-grouping.ts` for DRY code

---

## Critical Files

### To Create

1. **Chandam.Wasm/Client/src/utils/rule-grouping.ts** (NEW)
   - Shared grouping function: `groupRulesByCategory()`
   - Sorting function: `getSortedGroupKeys()`
   - Used by both rule-picker.ts and learn-index-page.ts

### To Modify

1. **Chandam.Wasm/Properties/launchSettings.json**
   - Change applicationUrl to `"https://localhost:5001;http://localhost:5000"`

2. **Chandam.Wasm/JsBridge.cs**
   - Add `r.Min` and `r.Max` properties to `GetAllRulesDetailed` method

3. **Chandam.Wasm/Client/src/types.ts**
   - Add `min?: number` and `max?: number` to `RuleSummaryDetailed` interface

4. **Chandam.Wasm/Client/src/ui/rule-picker.ts**
   - Import shared grouping utility
   - Use `groupRulesByCategory()` instead of local grouping logic
   - Update display: use `rule.shortName || rule.name` (no frequency)
   - Group labels: just chandamName, no "(Vruttam)" suffix

5. **Chandam.Wasm/Client/src/ui/rule-set-page.ts**
   - Change `getAllRules()` to `getAllRulesDetailed()` (line 19)
   - Update type import: `RuleSummaryDetailed` instead of `RuleSummary`
   - Add yati/prasa checkboxes to HTML
   - Implement tabbed interface (Determine mode vs Match mode)
   - Update layout to keep dropdown and Match button together
   - Change Clear icon from ✕ to 🧹

6. **Chandam.Wasm/Client/src/ui/rule-page.ts**
   - Add error logging to diagnose Match failure
   - Add yati/prasa checkboxes
   - Update Match handler to read checkbox state
   - Change Clear icon from ✕ to 🧹

7. **Chandam.Wasm/Client/src/ui/actions.ts**
   - Update `handleDetermine` to auto-select best match in dropdown
   - After Determine, switch to Match tab automatically
   - Update `handleMatch` to read yati/prasa checkbox state (instead of hardcoding true)

8. **Chandam.Wasm/Client/src/ui/learn-index-page.ts**
   - Import shared grouping utility
   - Use `groupRulesByCategory()` for consistent grouping
   - Display char ranges using min/max: "11-15 chars" or just "11 chars" if min===max
   - Skip displaying if min/max is -1 or undefined
   - Remove frequency from rule card metadata
   - Group labels: just chandamName, no "(Vruttam)" suffix

9. **Chandam.Wasm/Client/src/ui/learn-detail-page.ts**
   - Remove emoji from link text (CSS already adds it)
   - Verify "Try This Example" links generate correct query params

10. **Chandam.Wasm/Client/src/router.ts** (if needed)
    - Verify query params are preserved during navigation

11. **Chandam.Wasm/wwwroot/css/chandam.css**
    - Update .page-links to not double-render emoji
    - Update layout for Match button + dropdown adjacency
    - Add styles for tabbed interface
    - Add styles for match-options (checkboxes)

---

## Implementation Steps

### Phase 1: Quick Fixes (Cosmetic)

These are simple, low-risk changes that can be done immediately.

#### Step 1.1: Fix Port Configuration

**File:** `Chandam.Wasm/Properties/launchSettings.json`

Change line 9:
```json
"applicationUrl": "https://localhost:5001;http://localhost:5000"
```

**Rationale:** Aligns with README documentation and user expectations.

#### Step 1.2: Fix Clear Icon

**Files:** 
- `Chandam.Wasm/Client/src/ui/rule-set-page.ts`
- `Chandam.Wasm/Client/src/ui/rule-page.ts`

Change Clear button from `✕` to `🧹`:

```typescript
// In renderRuleSetPageHtml and renderRulePageHtml
<button id="btn-clear" title="Clear">🧹</button>
```

#### Step 1.3: Fix Double Icons on Links

**File:** `Chandam.Wasm/Client/src/ui/learn-detail-page.ts`

Remove emoji from link text (CSS already adds it):

```typescript
// Change from:
<a href="/compute/${ruleSet}/${ruleId}" class="compute-link">✏️ Try in Compute</a>

// To:
<a href="/compute/${ruleSet}/${ruleId}" class="compute-link">Try in Compute</a>
```

Also check all other page files for similar double-emoji issues.

**File:** `Chandam.Wasm/wwwroot/css/chandam.css`

Ensure CSS adds emoji via ::before:
```css
.compute-link::before { content: "✏️ "; }
.learn-link::before { content: "📖 "; }
.browse-link::before { content: "📚 "; }
```

---

### Phase 2: Learn Page Refinements

#### Step 2.1: Add Min/Max to C# DTO

**File:** `Chandam.Wasm/JsBridge.cs`

Update `GetAllRulesDetailed` method to include Min and Max:

```csharp
[JSInvokable]
public static string GetAllRulesDetailed(string language = "te")
{
    var ruleLoader = ServiceAccessor.Services!.GetRequiredService<RuleLoaderService>();
    var langEnum = LanguageCodeMapper.ParseLanguage(language) ?? RuleLanguage.Telugu;
    var rules = ruleLoader.GetAllRules(langEnum);
    var detailed = rules.Select(r => new {
        r.Identifier,
        r.Name,
        PadyamType = r.PadyamType.ToString(),
        PadyamSubType = r.PadyamSubType.ToString(),
        Frequency = r.Frequency.ToString(),
        r.Lines,
        r.ChandamName,
        r.CharLength,
        r.MatraLength,
        r.Min,           // NEW: MinCharLength
        r.Max,           // NEW: MaxCharLength
        r.Sequence,
        r.ShortName,
        r.Alias
    });
    return JsonSerializer.Serialize(detailed, JsonOptions);
}
```

#### Step 2.2: Update TypeScript Interface

**File:** `Chandam.Wasm/Client/src/types.ts`

Update `RuleSummaryDetailed` interface:

```typescript
export interface RuleSummaryDetailed extends RuleSummary {
  chandamName?: string;
  charLength?: number;
  matraLength?: number;
  min?: number;        // NEW: MinCharLength
  max?: number;        // NEW: MaxCharLength
  sequence?: string;
  shortName?: string;
  alias?: string;
}
```

#### Step 2.3: Update Learn Index Display with Ranges

**File:** `Chandam.Wasm/Client/src/ui/learn-index-page.ts`

Update `renderRuleListItem` function:

```typescript
function renderRuleListItem(rule: RuleSummaryDetailed, ruleSetId: string): string {
  const metadata = [];
  
  // Show char length range (if available and not -1)
  if (rule.min && rule.max && rule.min !== -1 && rule.max !== -1) {
    if (rule.min === rule.max) {
      metadata.push(`${rule.min} chars`);
    } else {
      metadata.push(`${rule.min}-${rule.max} chars`);
    }
  } else if (rule.charLength && rule.charLength !== -1) {
    // Fallback to single charLength if min/max not available
    metadata.push(`${rule.charLength} chars`);
  }
  
  // Show matra length (if available and not -1)
  if (rule.matraLength && rule.matraLength !== -1) {
    metadata.push(`${rule.matraLength} matras`);
  }
  
  // Don't show frequency (removed per user request)

  return `
    <div class="rule-list-item">
      <div class="rule-name">${rule.name}</div>
      <div class="rule-meta">${metadata.join(' | ')}</div>
      <div class="rule-links">
        <a href="/learn/${ruleSetId}/${rule.identifier}" class="learn-more-link">Learn</a>
        <a href="/compute/${ruleSetId}/${rule.identifier}" class="try-link">Try</a>
      </div>
    </div>
  `;
}
```

#### Step 2.2: Handle Unknown Chandam-Group

**File:** `Chandam.Wasm/Client/src/ui/learn-index-page.ts`

Update `groupRules` function to handle missing chandamName:

```typescript
function groupRules(rules: RuleSummaryDetailed[]): Map<string, Map<string, RuleSummaryDetailed[]>> {
  const grouped = new Map<string, Map<string, RuleSummaryDetailed[]>>();

  rules.forEach(rule => {
    // Use chandamName if available, else use padyamType, else "Other"
    const chandamName = rule.chandamName || rule.padyamType || 'Other';
    const padyamType = rule.padyamType;

    if (!grouped.has(chandamName)) {
      grouped.set(chandamName, new Map());
    }

    const chandamGroup = grouped.get(chandamName)!;
    if (!chandamGroup.has(padyamType)) {
      chandamGroup.set(padyamType, []);
    }

    chandamGroup.get(padyamType)!.push(rule);
  });

  return grouped;
}
```

---

### Phase 3: Rule Picker Improvements

#### Step 3.1: Switch to Detailed Rules

**File:** `Chandam.Wasm/Client/src/ui/rule-page.ts`

Before fixing, add diagnostic logging to the Match handler (lines 164-184):

```typescript
document.getElementById('btn-match')?.addEventListener('click', async () => {
  const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
  const poemText = editor?.value || '';
  
  console.log('[DEBUG] Match clicked - ruleId:', ruleId, 'poemText length:', poemText.length);

  if (!poemText.trim()) {
    alert('దయచేసి పద్యం టెక్స్ట్ ఇవ్వండి (Please enter poem text)');
    return;
  }

  try {
    console.log('[DEBUG] Calling WasmBridge.tryMatch with:', { ruleId, yati: true, prasa: true });
    const response = await WasmBridge.tryMatch(poemText, ruleId, true, true);
    console.log('[DEBUG] tryMatch response:', response);
    
    if (response.success) {
      renderFirstMatch(response.match, 'results-container');
    } else {
      console.error('[DEBUG] Match failed:', response.errorMessage);
      alert(response.errorMessage || 'సరిపోలలేదు (No match)');
    }
  } catch (err) {
    console.error('[DEBUG] Match exception:', err);
    alert('లోపం సంభవించింది (Error occurred): ' + (err as Error).message);
  }
});
```

**User to test:**
1. Open `/compute/complete/taralamu`
2. Click Match
3. Open browser console (F12)
4. Report what diagnostic messages appear

**Expected diagnostics:**
- If ruleId is wrong: Will show mismatched identifier
- If WASM call fails: Will show exception details
- If response.success is false: Will show errorMessage

---

#### Step 3.1: Switch to Detailed Rules

**File:** `Chandam.Wasm/Client/src/ui/rule-set-page.ts`

**Changes:**

1. Update import (line 5):
```typescript
import type { RuleSummaryDetailed } from '../types';
```

2. Change API call (line 19):
```typescript
const rules = await WasmBridge.getAllRulesDetailed();
```

3. Update renderRulePicker call (line 25) - no signature change needed since RuleSummaryDetailed extends RuleSummary

---

#### Step 3.2: Update Rule Picker Display and Grouping

**File:** `Chandam.Wasm/Client/src/ui/rule-picker.ts`

**Complete rewrite of renderRulePicker function:**

```typescript
import type { RuleSummaryDetailed } from '../types';

export function renderRulePicker(rules: RuleSummaryDetailed[], containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Group rules by category
  const grouped = groupRules(rules);

  // Build select dropdown
  const select = document.createElement('select');
  select.id = 'rule-select';
  select.className = 'rule-picker';

  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Select a rule --';
  select.appendChild(defaultOption);

  // Sort group keys and render
  const sortedGroups = Array.from(grouped.keys()).sort();
  sortedGroups.forEach(groupKey => {
    const groupRules = grouped.get(groupKey)!;
    
    const optgroup = document.createElement('optgroup');
    optgroup.label = groupKey;

    groupRules.forEach(rule => {
      const option = document.createElement('option');
      option.value = rule.identifier;
      // Use shortName if available, else name (no frequency)
      option.textContent = rule.shortName || rule.name;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });

  container.innerHTML = '';
  container.appendChild(select);
}

// Helper: Group rules by category
// - Vruttams: grouped by chandamName (త్రిష్టుప్పు, జగతి, etc.)
// - Others (Jati, SubJati, Ragada): grouped by padyamType
function groupRules(rules: RuleSummaryDetailed[]): Map<string, RuleSummaryDetailed[]> {
  const grouped = new Map<string, RuleSummaryDetailed[]>();

  rules.forEach(rule => {
    let groupKey: string;

    if (rule.padyamType === 'Vruttam' && rule.chandamName) {
      // Vruttams: group by chandamName
      groupKey = `${rule.chandamName} (Vruttam)`;
    } else {
      // Others: group by padyamType
      groupKey = rule.padyamType;
    }

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }

    grouped.get(groupKey)!.push(rule);
  });

  return grouped;
}

export function getSelectedRule(): string {
  const select = document.getElementById('rule-select') as HTMLSelectElement;
  return select?.value || '';
}
```

**Key changes:**
1. Function signature accepts `RuleSummaryDetailed[]` (has chandamName, shortName)
2. New `groupRules()` helper:
   - Vruttams grouped by `chandamName` with label format: "త్రిష్టుప్పు (Vruttam)"
   - Other types grouped by `padyamType`: "Jati", "SubJati", "Ragada"
3. Display uses `rule.shortName || rule.name` (no frequency)
4. Added default "-- Select a rule --" option for better UX

---

### Phase 4: Add Yati and Prasa Selectors

#### Step 4.1: Add Checkboxes to Rule Set Page

**File:** `Chandam.Wasm/Client/src/ui/rule-set-page.ts`

Add checkboxes after editor section in `renderRuleSetPageHtml`:

```typescript
<div class="editor-section">
  <label for="poem-editor">Enter Telugu poem:</label>
  <textarea id="poem-editor" rows="8" placeholder="పద్యం ఇక్కడ టైప్ చేయండి..."></textarea>
</div>

<div class="match-options">
  <label><input type="checkbox" id="match-yati" checked> Yati (యతి)</label>
  <label><input type="checkbox" id="match-prasa" checked> Prasa (ప్రాస)</label>
</div>
```

#### Step 4.2: Add Checkboxes to Rule Page

**File:** `Chandam.Wasm/Client/src/ui/rule-page.ts`

Add same checkboxes to `renderRulePageHtml` (after editor section).

#### Step 4.3: Update Match Handler to Read Checkboxes

**File:** `Chandam.Wasm/Client/src/ui/rule-page.ts`

Update inline Match handler (lines 164-184):

```typescript
document.getElementById('btn-match')?.addEventListener('click', async () => {
  const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
  const poemText = editor?.value || '';
  
  if (!poemText.trim()) {
    alert('దయచేసి పద్యం టెక్స్ట్ ఇవ్వండి (Please enter poem text)');
    return;
  }

  // Read checkbox state instead of hardcoding true
  const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
  const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;

  try {
    const response = await WasmBridge.tryMatch(poemText, ruleId, yati, prasa);
    if (response.success) {
      renderFirstMatch(response.match, 'results-container');
    } else {
      alert(response.errorMessage || 'సరిపోలలేదు (No match)');
    }
  } catch (err) {
    console.error('Match failed:', err);
    alert('లోపం సంభవించింది (Error occurred)');
  }
});
```

**Note:** `handleDetermine` and `handleMatch` in `actions.ts` already read checkboxes, so no change needed there.

---

### Phase 5: Tabbed Interface (Match vs Determine Mode)

#### Step 5.1: Add Tab HTML to Rule Set Page

**File:** `Chandam.Wasm/Client/src/ui/rule-set-page.ts`

Update `renderRuleSetPageHtml` to include tabs:

```typescript
<div class="compute-rule-set-page">
  <div class="rule-set-info">
    <span class="label">Rule Set:</span>
    <span class="name">${ruleSetName}</span>
    <span class="count">[${ruleCount} Rules]</span>
  </div>

  <div class="page-links">
    <a href="/learn/${ruleSetId}/" class="learn-link">Browse Rules</a>
  </div>

  <div class="quick-actions">
    <button id="btn-random" title="Random example">🎲</button>
    <button id="btn-clear" title="Clear">🧹</button>
  </div>

  <div class="editor-section">
    <label for="poem-editor">Enter Telugu poem:</label>
    <textarea id="poem-editor" rows="8" placeholder="పద్యం ఇక్కడ టైప్ చేయండి..."></textarea>
  </div>

  <div class="match-options">
    <label><input type="checkbox" id="match-yati" checked> Yati (యతి)</label>
    <label><input type="checkbox" id="match-prasa" checked> Prasa (ప్రాస)</label>
  </div>

  <!-- NEW: Tabbed interface -->
  <div class="mode-tabs">
    <button id="tab-determine" class="mode-tab active">Determine</button>
    <button id="tab-match" class="mode-tab">Match</button>
  </div>

  <!-- Determine mode content -->
  <div id="determine-mode" class="mode-content active">
    <div class="main-actions">
      <button id="btn-determine">Determine</button>
    </div>
  </div>

  <!-- Match mode content -->
  <div id="match-mode" class="mode-content">
    <div class="match-section">
      <div class="rule-selection">
        <label for="rule-select">Select Rule:</label>
        <div id="rule-picker-container"></div>
      </div>
      <div class="main-actions">
        <button id="btn-match">Match</button>
      </div>
    </div>
  </div>

  <div id="results-section" style="display: none;">
    <h3>Results</h3>
    <div id="results-container"></div>
  </div>
</div>
```

#### Step 5.2: Add Tab Switching Logic

**File:** `Chandam.Wasm/Client/src/ui/rule-set-page.ts`

Update `attachEventHandlers` to handle tab switching:

```typescript
function attachEventHandlers(ruleSet: string) {
  // Tab switching
  document.getElementById('tab-determine')?.addEventListener('click', () => {
    switchToTab('determine');
  });
  
  document.getElementById('tab-match')?.addEventListener('click', () => {
    switchToTab('match');
  });

  // Existing handlers
  document.getElementById('btn-determine')?.addEventListener('click', handleDetermine);
  document.getElementById('btn-match')?.addEventListener('click', handleMatch);
  document.getElementById('btn-clear')?.addEventListener('click', handleClear);

  document.getElementById('btn-random')?.addEventListener('click', async () => {
    try {
      const poem = await WasmBridge.getRandomPoemFromRuleSet();
      if (poem) {
        const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
        if (editor) editor.value = poem;
      } else {
        alert('ఉదాహరణలు అందుబాటులో లేవు (No examples available)');
      }
    } catch (err) {
      console.error('Random poem failed:', err);
    }
  });
}

// Helper: Switch between tabs
function switchToTab(mode: 'determine' | 'match') {
  // Update tab buttons
  const determineTab = document.getElementById('tab-determine');
  const matchTab = document.getElementById('tab-match');
  
  if (mode === 'determine') {
    determineTab?.classList.add('active');
    matchTab?.classList.remove('active');
  } else {
    determineTab?.classList.remove('active');
    matchTab?.classList.add('active');
  }
  
  // Update content visibility
  const determineMode = document.getElementById('determine-mode');
  const matchMode = document.getElementById('match-mode');
  
  if (mode === 'determine') {
    determineMode?.classList.add('active');
    matchMode?.classList.remove('active');
  } else {
    determineMode?.classList.remove('active');
    matchMode?.classList.add('active');
  }
}
```

#### Step 5.3: Add Tab CSS

**File:** `Chandam.Wasm/wwwroot/css/chandam.css`

```css
/* Mode tabs */
.mode-tabs {
  display: flex;
  gap: 0;
  margin: 1.5rem 0 0 0;
  border-bottom: 2px solid #e0e0e0;
}

.mode-tab {
  padding: 0.75rem 2rem;
  font-family: var(--font-main);
  font-size: 1rem;
  font-weight: bold;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-tab:hover {
  background: #e8e8e8;
}

.mode-tab.active {
  background: white;
  color: var(--color-header-bg);
  border-bottom-color: var(--color-header-bg);
}

/* Mode content */
.mode-content {
  display: none;
  padding: 1.5rem 0;
}

.mode-content.active {
  display: block;
}

/* Match section - keep dropdown and button together */
.match-section {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.match-section .rule-selection {
  flex: 1;
  min-width: 300px;
}

.match-section .main-actions {
  margin: 0;
}

/* Match options */
.match-options {
  display: flex;
  gap: 2rem;
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.match-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.match-options input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
```

---

### Phase 6: Auto-Select and Diagnostics

#### Step 6.1: Auto-Select Best Match After Determine

**File:** `Chandam.Wasm/Client/src/ui/actions.ts`

Update `handleDetermine` function:

```typescript
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
      // Show only the first (best) match
      renderFirstMatch(response.matches[0], 'results-container');
      
      // NEW: Auto-select best match in dropdown
      const ruleSelect = document.getElementById('rule-select') as HTMLSelectElement;
      if (ruleSelect) {
        ruleSelect.value = response.matches[0].rule.identifier;
      }
      
      // NEW: Switch to Match tab so user can see the selection
      const matchTab = document.getElementById('tab-match');
      if (matchTab) {
        matchTab.click();
      }
    } else {
      alert(response.errorMessage || 'సరిపోలికలు దొరకలేదు (No matches found)');
    }
  } catch (err) {
    console.error('Determine failed:', err);
    alert('లోపం సంభవించింది (Error occurred)');
  }
}
```

#### Step 6.2: Add Diagnostic Logging for Match Failure

**File:** `Chandam.Wasm/Client/src/ui/rule-page.ts`

Add diagnostic logging to Match handler (already covered in Step 4.3, but enhance it):

```typescript
console.log('[DEBUG] Match clicked - ruleId:', ruleId, 'poemText length:', poemText.length);
console.log('[DEBUG] Calling WasmBridge.tryMatch with:', { ruleId, yati, prasa });
const response = await WasmBridge.tryMatch(poemText, ruleId, yati, prasa);
console.log('[DEBUG] tryMatch response:', response);
```

---

## Key Implementation Details

### Shared Grouping Utility (`utils/rule-grouping.ts`)

Create a new shared utility file that both `rule-picker.ts` and `learn-index-page.ts` will use:

```typescript
import type { RuleSummaryDetailed } from '../types';

/**
 * Group rules by category for consistent organization
 * - Vruttams: grouped by chandamName (e.g., "త్రిష్టుప్పు")
 * - Others: grouped by padyamType or chandamName if available
 * - Fallback: "Other" for rules with no grouping info
 */
export function groupRulesByCategory(rules: RuleSummaryDetailed[]): Map<string, RuleSummaryDetailed[]> {
  const grouped = new Map<string, RuleSummaryDetailed[]>();

  rules.forEach(rule => {
    let groupKey: string;

    if (rule.padyamType === 'Vruttam' && rule.chandamName) {
      // Vruttams: use chandamName only (NO "(Vruttam)" suffix)
      groupKey = rule.chandamName;
    } else if (rule.chandamName) {
      // Has chandamName but not Vruttam: use chandamName
      groupKey = rule.chandamName;
    } else {
      // No chandamName: use padyamType or "Other"
      groupKey = rule.padyamType || 'Other';
    }

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }

    grouped.get(groupKey)!.push(rule);
  });

  return grouped;
}

/**
 * Sort group keys alphabetically (Telugu script aware)
 */
export function getSortedGroupKeys(grouped: Map<string, RuleSummaryDetailed[]>): string[] {
  return Array.from(grouped.keys()).sort((a, b) => {
    // Telugu unicode sorting
    return a.localeCompare(b, 'te');
  });
}
```

### Usage in Rule Picker

```typescript
import { groupRulesByCategory, getSortedGroupKeys } from '../utils/rule-grouping';

export function renderRulePicker(rules: RuleSummaryDetailed[], containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const grouped = groupRulesByCategory(rules);
  const sortedKeys = getSortedGroupKeys(grouped);

  const select = document.createElement('select');
  select.id = 'rule-select';
  
  // Default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Select a rule --';
  select.appendChild(defaultOption);

  sortedKeys.forEach(groupKey => {
    const groupRules = grouped.get(groupKey)!;
    
    const optgroup = document.createElement('optgroup');
    optgroup.label = groupKey; // Just chandamName, no suffix

    groupRules.forEach(rule => {
      const option = document.createElement('option');
      option.value = rule.identifier;
      option.textContent = rule.shortName || rule.name; // No frequency
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });

  container.innerHTML = '';
  container.appendChild(select);
}
```

### Usage in Learn Index Page

```typescript
import { groupRulesByCategory, getSortedGroupKeys } from '../utils/rule-grouping';

function renderLearnIndexPageHtml(...) {
  const grouped = groupRulesByCategory(rules);
  const sortedKeys = getSortedGroupKeys(grouped);

  const groupsHtml = sortedKeys.map(groupKey => {
    const groupRules = grouped.get(groupKey)!;
    return `
      <div class="chandam-group">
        <h2>${groupKey}</h2>
        ${groupRules.map(rule => renderRuleListItem(rule, ruleSetId)).join('')}
      </div>
    `;
  }).join('');

  // ... rest of HTML
}

function renderRuleListItem(rule: RuleSummaryDetailed, ruleSetId: string): string {
  const metadata = [];
  
  // Char range
  if (rule.min && rule.max && rule.min !== -1 && rule.max !== -1) {
    if (rule.min === rule.max) {
      metadata.push(`${rule.min} chars`);
    } else {
      metadata.push(`${rule.min}-${rule.max} chars`);
    }
  }
  
  // Matra length
  if (rule.matraLength && rule.matraLength !== -1) {
    metadata.push(`${rule.matraLength} matras`);
  }
  
  // NO frequency display

  return `
    <div class="rule-list-item">
      <div class="rule-name">${rule.name}</div>
      <div class="rule-meta">${metadata.join(' | ')}</div>
      <div class="rule-links">
        <a href="/learn/${ruleSetId}/${rule.identifier}">Learn</a>
        <a href="/compute/${ruleSetId}/${rule.identifier}">Try</a>
      </div>
    </div>
  `;
}
```

---

## Verification Steps

### 1. Port Configuration
```bash
cd Chandam.Wasm
dotnet run
```
- Should start on `http://localhost:5000` and `https://localhost:5001`
- Verify README instructions work: open http://localhost:5000

### 2. Cosmetic Fixes
- ✅ Clear button shows 🧹 (sweeping brush) instead of ✕
- ✅ Page links show single emoji (not double)
  - Check "Go to Compute", "Browse Rules", "Learn More", "Try in Compute"

### 3. Learn Page Refinements
- Navigate to `/learn/frequent/`
- ✅ Rule cards don't show frequency labels
- ✅ Rule cards show char RANGES: "11-15 chars" (using min-max)
- ✅ If min === max, show single value: "11 chars"
- ✅ Rule cards don't show "-1 chars" or "-1 matras"
- ✅ Matra length shows if valid: "18 matras"
- ✅ Group labels just show chandamName: "త్రిష్టుప్పు" (NO "(Vruttam)" suffix)

- Navigate to `/learn/complete/`
- ✅ No "Unknown" chandam groups (should show "Other" or fallback to padyamType)
- ✅ All rules are organized properly
- ✅ Grouping matches dropdown grouping (consistent categories)

### 3a. Grouping Consistency Check
- Compare `/compute/complete/` dropdown groups with `/learn/complete/` page groups
- ✅ Same group names appear in both places
- ✅ Same rules appear in same groups
- ✅ Both sorted alphabetically in Telugu locale

### 3b. Build and Deploy Check
- After build, check `wwwroot/data/` folder
- ✅ Contains 4 `.min.json` files
- ✅ Contains 4 `.min.json.br` files (for compression)
- ✅ Total of 8 files properly deployed

### 4. Rule Dropdown Improvements
- Navigate to `/compute/frequent/` → Switch to Match tab
- ✅ Dropdown shows clean names (e.g., "ఉత్పలమాల", not "ఉత్పలమాల (Frequent)")
- ✅ ShortName is used when available

- Navigate to `/compute/complete/` → Switch to Match tab
- ✅ Vruttams grouped by chandamName: "త్రిష్టుప్పు", "జగతి" (NO "(Vruttam)" suffix)
- ✅ Other types grouped separately: "Jati", "SubJati", "Ragada", or chandamName if available
- ✅ Groups are sorted alphabetically (Telugu locale aware)
- ✅ "Other" group for rules with no chandamName or padyamType

### 5. Yati and Prasa Selectors
- Navigate to `/compute/frequent/`
- ✅ Checkboxes visible for Yati and Prasa
- ✅ Both checked by default
- Test Determine with both checked → should work
- Uncheck Yati → Determine → verify results respect yati=false
- Test Match on rule page → verify checkboxes work there too

### 6. Tabbed Interface
- Navigate to `/compute/frequent/`
- ✅ Two tabs visible: "Determine" and "Match"
- ✅ Default tab: "Determine" (active)
- ✅ Determine tab: Only "Determine" button visible (no dropdown)
- ✅ Match tab: Dropdown + "Match" button visible side-by-side
- ✅ Clicking tabs switches content correctly

### 7. Auto-Select After Determine
- Navigate to `/compute/frequent/`
- Determine tab: Enter poem → Click Determine
- ✅ Results show best match
- ✅ Tab automatically switches to "Match"
- ✅ Dropdown automatically selects the best matching rule
- ✅ User can now edit poem and click Match without re-selecting

### 8. Match Functionality (Diagnostic Phase)
- Navigate to `/compute/complete/taralamu`
- ✅ Example loads in editor
- ✅ Yati/Prasa checkboxes visible
- Open browser console (F12)
- Click Match button
- Review diagnostic logs:
  - ruleId value
  - yati/prasa checkbox states
  - Response from tryMatch
  - Any errors or exceptions
- Report findings to determine if additional fix is needed

### 9. Example Query String
- Navigate to `/learn/frequent/Utpalamala`
- Click "Try This Example" button on first example
- ✅ URL changes to `/compute/frequent/Utpalamala?example=1`
- ✅ Query string is visible in browser address bar
- ✅ Example pre-fills in editor

### 10. Layout and Spacing
- Navigate to `/compute/frequent/` → Match tab
- ✅ Dropdown and Match button are adjacent (side by side)
- ✅ Proper spacing and alignment
- ✅ Mobile responsive (test at 360px width)

### 11. End-to-End Testing
- Test workflow: Home → Analyze Frequent → Determine → Auto-select → Match
- Test workflow: Home → Analyze Complete → Switch to Match tab → Select rule → Match
- Test workflow: Home → Learn Frequent → Click rule → Try This Example → Match
- Test workflow: Specific rule page `/compute/frequent/Utpalamala` → Random → Match
- Verify browser back/forward still works
- Verify all navigation links work correctly

---

## Expected Outcome

After these fixes:

**Critical Issues Resolved:**
1. ✅ Application runs on port 5000 (matches README)
2. ✅ Yati and Prasa checkboxes added to all compute pages
3. ⏳ Match failure diagnosed with detailed logging
4. ✅ Example query strings visible in URLs (`?example=1`)

**UI Refinements Implemented:**
5. ✅ Rule dropdown shows clean short names (no frequency)
6. ✅ Vruttams organized by chandamName (త్రిష్టుప్పు, జగతి, etc.)
7. ✅ Clear icon changed to 🧹 (more intuitive)
8. ✅ Single emoji on links (no double rendering)
9. ✅ Learn pages hide -1 chars/matras values
10. ✅ Learn pages don't show frequency labels
11. ✅ Unknown chandam groups handled gracefully
12. ✅ Match button and dropdown adjacent in layout
13. ✅ Determine auto-selects best match in dropdown
14. ✅ Tabbed interface (Determine mode vs Match mode)

**User Experience Improvements:**
- Cleaner, more intuitive UI
- Faster workflow: Determine → auto-select → Match
- Better rule organization (grouped by meter family)
- Consistent icon usage
- Clear mode separation (tabs)

**Grouping Improvements:**
15. ✅ Shared grouping utility created (DRY principle)
16. ✅ Group labels simplified (no "(Vruttam)" suffix)
17. ✅ Consistent grouping across dropdown and learn pages
18. ✅ Char ranges displayed using min/max (e.g., "11-15 chars")

**Terminology Consistency:**
19. ✅ All "Analyzer" references changed to "Compute"

**Total files created:** 1 file
- `utils/rule-grouping.ts` (shared utility)

**Total files modified:** 11 files
- 1 configuration file (launchSettings.json)
- 1 C# file (JsBridge.cs)
- 7 TypeScript files (types, rule-picker, rule-set-page, rule-page, actions, learn-index-page, learn-detail-page)
- 1 CSS file
- 1 router file (minor, if query param issue found)

**Estimated implementation time:** 3-4 hours
**Testing time:** 45-60 minutes

---

## Rollback Strategy

If issues arise:
- Git stash changes and test original implementation
- Port change is isolated to launchSettings.json
- Rule picker changes are isolated to rule-picker.ts and rule-set-page.ts
- Original getAllRules() still works if we revert

---

## Notes

### Match Failure Diagnostics
- The Match failure issue may require user's diagnostic feedback before implementing fix
- If ruleId casing is the issue (taralamu vs Taralamu), may need to add case-insensitive lookup
- If rule loading is the issue, may need to add explicit validation that ruleId exists in loaded rules
- Diagnostic logging will help identify root cause

### Tabbed Interface Design Decisions
- Default to Determine tab (most common workflow)
- After Determine succeeds, auto-switch to Match tab (shows the selected rule)
- Match tab keeps dropdown + button together (user feedback)
- Users can manually switch tabs at any time

### Query String Handling
- Router must preserve query params during navigation
- Check if `router.navigate()` strips query strings
- May need to update router to explicitly handle query params
- Test: clicking links with `href="/compute/x/y?example=1"` should preserve `?example=1`

### Graceful Degradation
- If shortName is not available, fall back to name
- If chandamName is not available, fall back to padyamType or "Other"
- If charLength or matraLength is -1 or undefined, don't display them
- Checkboxes default to checked (safest behavior)

### CSS Considerations
- Tab switching should be instant (no animation for first version)
- Match section should use flexbox for responsive layout
- Mobile: dropdown and button may stack vertically on small screens
- Maintain consistent spacing throughout

### Future Enhancements (Not in This Plan)
- Remember user's tab preference (localStorage)
- Keyboard shortcuts (Enter = Determine/Match, Tab = switch tabs)
- Show match score/percentage in dropdown after Determine
- Highlight the auto-selected rule in dropdown
- Allow multiple result cards with expand/collapse
