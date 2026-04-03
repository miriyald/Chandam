# WASM Results Area Redesign Plan

## Context

The current WASM results display uses basic styling that doesn't match the polished editor interface. The legacy Web2 app has well-established visual patterns using specific Telugu fonts and color-coding, but the new WASM implementation uses generic styling with 'Noto Sans Telugu' for all text.

**Current Issues:**
1. Results cards lack visual hierarchy and polish
2. Meter names (rule.name) use the same font as body text (should be distinctive)
3. Error details only show "Line X: description" - many fields unused (MismatchType, Expected, Actual, Position, Remarks)
4. Rule descriptions clutter the results (user requested removal)
5. Score always shown even at 100% (unnecessary when perfect match)
6. Legacy CSS classes (.tab, .stamper, .gOk, .gErr, .yati, etc.) have no styling in WASM
7. Results don't visually match the editor's modern card design

**What We Can/Cannot Change:**
- ✅ Can change: CSS styling, TypeScript rendering logic, results.ts
- ✅ Can change: Font loading, CSS classes in chandam.css
- ❌ Cannot change: Core HTML generation (Padyam.cs in READ-ONLY Chandam.Core)
- ❌ Cannot change: Match data structure or API responses

**Data Available:**
- `ChandamMatch` has: rule, score, total, matchPercentage, isMatched, errors[], renderedHtml
- `MatchError` has: line, position, mismatchType, mismatchDescription, expected, actual, remarks
- HTML table uses classes: `.tab`, `.stamper`, `.ga`, `.up`, `.dw`, `.X`, `.X3`, `.gOk`, `.gErr`, `.yati`, `.y1`

## Design Options

### Option 1: **Minimal Modern** (Recommended)

Clean, focused results that emphasize the analysis table and provide detailed error information when needed.

**Structure:**
```
┌─────────────────────────────────────────────────┐
│ [✓] తోటకము (97%)                  [success bar] │
├─────────────────────────────────────────────────┤
│                                                 │
│         [Rendered HTML Table]                   │
│                                                 │
├─────────────────────────────────────────────────┤
│ ⚠ Mismatches (1):                               │
│                                                 │
│ Line 2, Position 9 • యతి                        │
│ ├─ Type: యతి                                    │
│ ├─ Expected: గ                                  │
│ ├─ Actual: ఫ                                    │
│ └─ Remarks: (if available)                      │
└─────────────────────────────────────────────────┘
```

**Visual Treatment:**
- Meter name in **Telugu display font** (Timmana or similar) - 1.5rem, bold
- Score badge beside name (hidden if 100%)
  - 95-100%: Subtle green
  - 85-94%: Orange
  - <85%: Red
- NO rule description shown
- Table gets modern styling overlay on legacy classes
- Errors in expandable/collapsible section with full details
- Color-coded border: green (success) or red (failure)

### Option 2: **Adaptive Split View** (Recommended)

Flexible layout that adapts to content size - side-by-side when table is compact, stacks when table is tall.

```
Desktop - Compact Table (both fit side-by-side):
┌─────────────────────────────────────────────────────────────┐
│ [✓] తోటకము (97%)              [View Rule Details →]         │
├──────────────────────┬──────────────────────────────────────┤
│                      │  ⚠ Mismatches (1)                    │
│  [HTML Table]        │  ┌─────────────────────────────────┐│
│  (4-6 lines)         │  │ Line│Pos│Type│Expected│Actual   ││
│                      │  ├─────┼───┼────┼────────┼─────────┤│
│                      │  │  2  │ 9 │యతి │   గ    │   ఫ     ││
└──────────────────────┴──────────────────────────────────────┘

Desktop - Tall Table (errors wrap below):
┌─────────────────────────────────────────────────────────────┐
│ [✓] తోటకము (97%)              [View Rule Details →]         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [HTML Table - full width]                                 │
│  (8+ lines, takes vertical space)                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ⚠ Mismatches (1)                                            │
│  [Errors Table - full width below]                         │
└─────────────────────────────────────────────────────────────┘

Mobile (<768px):
┌─────────────────────────────────────────────────┐
│ [✓] తోటకము (97%)    [View Rule Details →]       │
├─────────────────────────────────────────────────┤
│         [HTML Table - full width]               │
├─────────────────────────────────────────────────┤
│ ⚠ Mismatches (1)                                │
│  [Errors Table - full width]                    │
└─────────────────────────────────────────────────┘
```

**Implementation:**
- Uses `flexbox` with `flex-wrap: wrap` instead of fixed grid
- Table container: `flex: 1 1 55%; min-width: 400px`
- Errors container: `flex: 1 1 40%; min-width: 350px`
- When total width needed exceeds viewport, errors automatically wrap below
- Content-aware: adapts to actual table size, not just screen width

**Pros:**
- ✅ Adaptive: side-by-side for compact tables, stacks for tall tables
- ✅ Prevents cramped side-by-side when table needs vertical space
- ✅ Errors table format - easy to scan
- ✅ Responsive - stacks on mobile
- ✅ Link to full rule details and examples
- ✅ No JavaScript needed - pure CSS flexbox magic

### Option 3: **Accordion Style**

Everything collapsible for dense information.

```
▼ [✓] తోటకము (97%)
  ▶ View Analysis Table
  ▼ Mismatches (1)
    • Line 2...
```

**Pros/Cons:**
- ✅ Very compact
- ❌ Requires extra clicks to see analysis
- ❌ Hides the primary value (the table)

## Recommended Approach: Option 2 (Split View)

### Implementation Plan

#### Phase 1: Font Strategy (Global Change)

**Goal:** Establish Telugu display font for meter names across all pages

**Files to modify:**
1. `Chandam.Wasm/wwwroot/index.html` - Add Google Fonts import for Telugu display font
2. `Chandam.Wasm/wwwroot/css/chandam.css` - Define CSS variables and classes

**Changes:**
```css
:root {
  --font-main: 'Noto Sans Telugu', sans-serif;          /* Body text */
  --font-display: 'Timmana', 'Noto Sans Telugu', sans-serif;  /* Meter names */
}

.meter-name {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
}
```

**Font Options (all available on Google Fonts):**
- **Timmana** - Clean, modern, good for headings
- **Mandali** - Balanced, professional
- **Ramabhadra** - Traditional feel
- **Peddana** - Decorative but readable

**Apply `.meter-name` class to:**
- Results card header (`results.ts`)
- Rule detail page title (`learn-detail-page.ts`)
- Rule list items (`learn-index-page.ts`)
- Home page cards (`home-page.ts`)

#### Phase 2: Legacy CSS Classes Styling

**Goal:** Style the Core-generated HTML table with modern aesthetics

**File to modify:** `Chandam.Wasm/wwwroot/css/chandam.css`

**Add styles for legacy classes:**

```css
/* Results table - Core-generated HTML */
.tab {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.stamper {
  background: #f5f5f5;
  color: #666;
  width: 40px;
  text-align: center;
  border-right: 2px solid #e0e0e0;
  font-size: 1.2rem;
  padding: 0.5rem 0.25rem;
}

/* Gana row (pattern names) */
.ga {
  background: #f9f9f9;
  font-size: 0.95rem;
  font-weight: 500;
  color: #2d6a4f;
}

/* Matra pattern row */
.up {
  background: #fef9f9;
  font-size: 0.9rem;
  color: #c1121f;
  font-family: 'Courier New', monospace;
}

/* Text row */
.dw {
  background: #ffffff;
  font-size: 1.05rem;
  font-family: var(--font-main);
  font-weight: 500;
  padding: 0.5rem 0.75rem;
}

/* Table cells */
.X, .X3 {
  border: 1px solid #e8e8e8;
  padding: 0.4rem 0.6rem;
  text-align: center;
  transition: background-color 0.2s;
}

.X3 {
  border-bottom: 2px solid #ddd;
}

/* Match status */
.gOk {
  background-color: rgba(45, 106, 79, 0.05);
}

.gErr {
  background-color: rgba(193, 18, 31, 0.08);
  color: #c1121f;
  font-weight: 600;
}

.X.gErr {
  border-color: #c1121f;
  box-shadow: inset 0 0 0 1px rgba(193, 18, 31, 0.2);
}

/* Yati marker */
.yati {
  color: #ff8000;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: rgba(255, 128, 0, 0.4);
  text-underline-offset: 2px;
}

/* Prasa marks */
.y1 u {
  color: #6a4c93;
  text-decoration: underline;
  text-decoration-style: double;
}
```

**Why these choices:**
- Subtle colors maintain readability
- Green/red color scheme consistent with success/error theme
- Modern borders and shadows match editor styling
- Monospace font for matra patterns improves alignment
- Responsive padding works on mobile

#### Phase 3: Results Card HTML Structure

**Goal:** Redesign results rendering with split-view layout, errors table, and rule reference link

**Files to modify:** 
- `Chandam.Wasm/Client/src/ui/results.ts` - Update rendering functions
- `Chandam.Wasm/Client/src/ui/rule-set-page.ts` - Pass ruleSet to render functions

**New rendering logic:**

```typescript
// Update function signature to accept ruleSet parameter
export function renderFirstMatch(match: ChandamMatch, containerId: string, ruleSet?: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Determine status styling
  const statusClass = match.isMatched ? 'match-success' : 'match-failure';
  const statusIcon = match.isMatched ? '✓' : '✗';
  
  // Only show score if < 100%
  const scoreHtml = match.matchPercentage < 100 
    ? `<span class="match-score match-score-${getScoreLevel(match.matchPercentage)}">${match.matchPercentage}%</span>`
    : '';

  // Generate rule details link (opens in new tab)
  const ruleLink = ruleSet && match.rule.identifier
    ? `<a href="/learn/${ruleSet}/${match.rule.identifier}/" class="rule-details-link" target="_blank" rel="noopener noreferrer">View Rule Details ↗</a>`
    : '';

  // Enhanced error display (table format)
  const errorsHtml = (match.errors && match.errors.length > 0) 
    ? renderErrorsTable(match.errors)
    : '';

  // Split view: table on left, errors on right (desktop), stacked (mobile)
  const hasErrors = match.errors && match.errors.length > 0;
  const layoutClass = hasErrors ? 'match-body-split' : 'match-body-full';

  container.innerHTML = `
    <div class="match-card ${statusClass}">
      <div class="match-header">
        <div class="match-title-group">
          <span class="match-icon">${statusIcon}</span>
          <h3 class="meter-name">${match.rule.name}</h3>
          ${scoreHtml}
        </div>
        ${ruleLink}
      </div>
      
      <div class="${layoutClass}">
        <div class="match-table-container">
          ${match.renderedHtml || ''}
        </div>
        
        ${hasErrors ? `<div class="match-errors-container">${errorsHtml}</div>` : ''}
      </div>
    </div>
  `;

  // Show results section
  const resultsSection = document.getElementById('results-section');
  if (resultsSection) {
    resultsSection.style.display = 'block';
  }
}

function getScoreLevel(percentage: number): string {
  if (percentage >= 95) return 'high';
  if (percentage >= 85) return 'medium';
  return 'low';
}

// New function: Render errors as a table
function renderErrorsTable(errors: MatchError[]): string {
  const errorCount = errors.length;
  const errorLabel = errorCount === 1 ? 'Mismatch' : 'Mismatches';
  
  const errorRows = errors.map(err => `
    <tr>
      <td class="error-line">${err.line}</td>
      <td class="error-position">${err.position}</td>
      <td class="error-type">${err.mismatchType}</td>
      <td class="error-expected">${err.expected}</td>
      <td class="error-actual">${err.actual}</td>
      <td class="error-description">${err.mismatchDescription}${err.remarks ? `<br><em>${err.remarks}</em>` : ''}</td>
    </tr>
  `).join('');

  return `
    <div class="errors-section">
      <h4 class="errors-header">⚠ ${errorLabel} (${errorCount})</h4>
      <div class="errors-table-wrapper">
        <table class="errors-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>Pos</th>
              <th>Type</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${errorRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
```

**Update rule-set-page.ts to pass ruleSet:**

In `rule-set-page.ts`, update the analyze handlers to pass ruleSet:

```typescript
// In determine handler:
renderFirstMatch(response.matches[0], 'results-container', ruleSet);

// In match handler:
renderFirstMatch(response.match, 'results-container', ruleSet);
```

**Security Note:**
The link uses `rel="noopener noreferrer"` to prevent:
- `window.opener` access (security risk with `target="_blank"`)
- Referrer leakage to external pages
This is a best practice for all `target="_blank"` links.

#### Phase 4: Results Card CSS Styling

**File to modify:** `Chandam.Wasm/wwwroot/css/chandam.css`

**Add new result card styles:**

```css
/* Results Card */
.match-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 2px solid transparent;
  transition: all 0.3s;
}

.match-card.match-success {
  border-color: #2d6a4f;
  background: linear-gradient(to bottom, rgba(45, 106, 79, 0.02), white);
}

.match-card.match-failure {
  border-color: #c1121f;
  background: linear-gradient(to bottom, rgba(193, 18, 31, 0.02), white);
}

/* Match Header */
.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e8e8e8;
}

.match-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.match-icon {
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.match-success .match-icon {
  background: #d8f3dc;
  color: #2d6a4f;
}

.match-failure .match-icon {
  background: #ffe5e5;
  color: #c1121f;
}

.match-title-group .meter-name {
  margin: 0;
  font-size: 1.5rem;
}

/* Rule Details Link (opens in new tab) */
.rule-details-link {
  color: var(--color-header-bg);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  padding: 0.5rem 1rem;
  border: 1px solid currentColor;
  border-radius: 6px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.rule-details-link:hover {
  background: var(--color-header-bg);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Score Badge */
.match-score {
  font-size: 1.25rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-family: 'Segoe UI', system-ui, sans-serif;
  flex-shrink: 0;
}

.match-score-high {
  background: #d8f3dc;
  color: #2d6a4f;
}

.match-score-medium {
  background: #ffe5cc;
  color: #d97706;
}

.match-score-low {
  background: #ffe5e5;
  color: #c1121f;
}

/* Split View Layout */
.match-body-split {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin: 1rem 0;
  align-items: flex-start;
}

.match-body-full {
  margin: 1rem 0;
}

.match-table-container {
  flex: 1 1 55%;
  min-width: 400px;
  overflow-x: auto;
  border-radius: 8px;
}

.match-errors-container {
  flex: 1 1 40%;
  min-width: 350px;
}

/* If table container is too tall or takes too much space, 
   errors will naturally wrap below due to flex-wrap */

/* Errors Section */
.errors-section {
  padding: 1rem;
  background: #fff9f0;
  border: 1px solid #ffe5cc;
  border-left: 4px solid #ff8000;
  border-radius: 8px;
  height: fit-content;
}

.errors-header {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Errors Table */
.errors-table-wrapper {
  overflow-x: auto;
  border-radius: 6px;
}

.errors-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  background: white;
}

.errors-table thead {
  background: #f5f5f5;
  font-weight: 600;
  color: #555;
}

.errors-table th {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 2px solid #e0e0e0;
  font-size: 0.85rem;
  white-space: nowrap;
}

.errors-table td {
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
}

.errors-table tbody tr:hover {
  background: #fef9f0;
}

.errors-table tbody tr:last-child td {
  border-bottom: none;
}

/* Error Table Columns */
.error-line,
.error-position {
  text-align: center;
  font-weight: 600;
  color: #666;
  font-family: monospace;
  width: 50px;
}

.error-type {
  font-weight: 600;
  color: #d97706;
  font-family: var(--font-main);
  white-space: nowrap;
  min-width: 80px;
}

.error-expected {
  background: #d8f3dc;
  color: #2d6a4f;
  font-weight: 600;
  font-family: var(--font-main);
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  text-align: center;
  min-width: 60px;
}

.error-actual {
  background: #ffe5e5;
  color: #c1121f;
  font-weight: 700;
  font-family: var(--font-main);
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  text-align: center;
  min-width: 60px;
}

.error-description {
  color: #555;
  line-height: 1.5;
}

.error-description em {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.85rem;
}


/* Mobile Responsive */
@media (max-width: 768px) {
  /* Force stacking on mobile by reducing min-widths */
  .match-table-container {
    min-width: 100%;
    flex: 1 1 100%;
  }
  
  .match-errors-container {
    min-width: 100%;
    flex: 1 1 100%;
  }
  
  .match-body-split {
    gap: 1rem;
  }
  
  .match-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .match-title-group {
    width: 100%;
  }
  
  .match-title-group .meter-name {
    font-size: 1.25rem;
  }
  
  .match-score {
    font-size: 1rem;
  }
  
  .rule-details-link {
    width: 100%;
    text-align: center;
  }
  
  /* Make errors table scrollable on mobile */
  .errors-table {
    font-size: 0.85rem;
  }
  
  .errors-table th,
  .errors-table td {
    padding: 0.375rem 0.25rem;
  }
  
  /* Hide less critical columns on very small screens */
  @media (max-width: 480px) {
    .error-position {
      display: none;
    }
  }
}
```

#### Phase 5: Apply Font Consistently Across Pages

**Files to modify:**
1. `Chandam.Wasm/Client/src/ui/home-page.ts` - Apply `.meter-name` to card titles
2. `Chandam.Wasm/Client/src/ui/learn-index-page.ts` - Apply `.meter-name` to rule names
3. `Chandam.Wasm/Client/src/ui/learn-detail-page.ts` - Apply `.meter-name` to page title
4. `Chandam.Wasm/Client/src/ui/rule-page.ts` - Apply `.meter-name` to rule display
5. `Chandam.Wasm/Client/src/ui/rule-set-page.ts` - Any rule name displays

**Pattern:**
```typescript
// Before:
`<h2>${ruleName}</h2>`

// After:
`<h2 class="meter-name">${ruleName}</h2>`
```

## Verification

After implementation, verify:

1. **Visual Consistency:**
   - [ ] Meter names use Telugu display font across all pages
   - [ ] Results cards match editor card styling (borders, shadows, padding)
   - [ ] Color scheme consistent (green=success, red=error, orange=warning)

2. **Results Display:**
   - [ ] Rule description NOT shown in results
   - [ ] "View Rule Details ↗" link visible with correct arrow icon
   - [ ] Link opens in new tab (target="_blank")
   - [ ] Link navigates to correct learn page: `/learn/{ruleSet}/{identifier}/`
   - [ ] Clicking link preserves current analysis page (doesn't navigate away)
   - [ ] Score hidden when 100%, visible with appropriate color when < 100%
   - [ ] Legacy table classes (.tab, .stamper, etc.) properly styled
   - [ ] Yati markers (orange) and prasa marks visible in table

3. **Adaptive Split-View Layout:**
   - [ ] Desktop with compact table (≤6 lines): Table and errors side-by-side
   - [ ] Desktop with tall table (>8 lines): Errors wrap below table (full width)
   - [ ] Table container takes ~55%, errors ~40% when side-by-side
   - [ ] Proper gap (1.5rem) between sections
   - [ ] No forced cramping - layout adapts to content size
   - [ ] Flexbox wrap behavior works smoothly (no JavaScript needed)

4. **Error Details (Table Format):**
   - [ ] Errors displayed as a table with headers: Line, Pos, Type, Expected, Actual, Description
   - [ ] All error fields populated correctly
   - [ ] Expected values have green background
   - [ ] Actual values have red background and bold
   - [ ] Remarks appear inline in Description column (when available)
   - [ ] Multiple errors cleanly separated by table rows
   - [ ] Table is scrollable horizontally if needed

5. **Responsiveness:**
   - [ ] Mobile (<768px): Split-view stacks vertically (table on top, errors below)
   - [ ] Very small screens (<480px): Position column hidden in errors table
   - [ ] Analysis table scrolls horizontally if needed
   - [ ] Error table scrolls horizontally if needed
   - [ ] Font sizes and padding appropriate for mobile
   - [ ] "View Rule Details" link full-width on mobile

5. **Testing:**
   - [ ] Test with 100% match (score should be hidden)
   - [ ] Test with 97% match (score badge visible)
   - [ ] Test with multiple errors (all display correctly in table)
   - [ ] Test with short poem (4 lines) - should show side-by-side layout
   - [ ] Test with long poem (12+ lines) - errors should wrap below
   - [ ] Test with Telugu text (fonts render properly)
   - [ ] Test rule details link navigation (goes to correct learn page)
   - [ ] Resize browser window to verify flex-wrap behavior
   - [ ] Test on Chrome, Firefox, Safari, Mobile

## Files to Modify (Summary)

1. `Chandam.Wasm/wwwroot/index.html` - Add Google Fonts link for Telugu display font
2. `Chandam.Wasm/wwwroot/css/chandam.css` - Add all new CSS:
   - Font variables and .meter-name class
   - Legacy table classes (.tab, .stamper, .gOk, .gErr, .yati, etc.)
   - Split-view layout (.match-body-split, containers)
   - Result card styles (header, title-group, rule link)
   - Errors table styles (.errors-table, columns)
   - Mobile responsive breakpoints
3. `Chandam.Wasm/Client/src/ui/results.ts` - Major rewrite:
   - Update `renderFirstMatch()` signature to accept `ruleSet` parameter
   - Implement split-view layout
   - Add rule details link generation
   - Replace `renderDetailedErrors()` with `renderErrorsTable()`
4. `Chandam.Wasm/Client/src/ui/rule-set-page.ts` - Pass ruleSet to renderFirstMatch in both handlers
5. `Chandam.Wasm/Client/src/ui/home-page.ts` - Apply .meter-name class to card titles
6. `Chandam.Wasm/Client/src/ui/learn-index-page.ts` - Apply .meter-name class to rule names
7. `Chandam.Wasm/Client/src/ui/learn-detail-page.ts` - Apply .meter-name class to page title
8. `Chandam.Wasm/Client/src/ui/rule-page.ts` - Apply .meter-name class to rule display (if applicable)

## Design Decisions Rationale

**Why Option 2 (Adaptive Split View)?**
- **Content-aware layout**: Side-by-side when table is compact, stacks when table is tall
- Prevents cramped display: Won't force side-by-side if table needs vertical space
- Keeps both analysis and errors visible simultaneously when both are compact
- Side-by-side comparison makes it easier to correlate errors with the analysis table
- Responsive: automatically stacks on mobile (<768px) OR when content is too large
- Errors table format makes scanning multiple mismatches very fast
- Better for power users analyzing complex patterns
- Pure CSS solution (flexbox) - no JavaScript layout calculations needed

**Why Timmana font?**
- Modern, clean, professional
- Excellent readability at display sizes
- Good Unicode Telugu support
- Freely available on Google Fonts
- Distinct from body text but not jarring

**Why hide score at 100%?**
- Perfect match is visually indicated by green border + checkmark
- Reduces visual clutter
- Score is noise when there's nothing to improve
- User specifically requested this consideration

**Why errors as a table?**
- User specifically requested table format for errors
- Tabular format best for structured data with multiple fields
- Easy to scan multiple errors at once
- Clear column headers make data interpretation obvious
- Color-coded Expected (green) vs Actual (red) cells make problems jump out
- Compact representation - can see many errors without scrolling
- Sortable/filterable in future if needed

**Why display all error fields?**
- User requested "more details in errors section"
- Currently only show description, but API provides much more
- Line + Position: precise location of error
- Type: categorizes the problem (యతి, గణం, ప్రాస)
- Expected vs Actual: core mismatch comparison
- Description: human-readable explanation
- Remarks: additional context when available

**Why remove rule description but add reference link?**
- User explicitly requested not showing rule details in results (avoids clutter)
- But user wants "a way to access the rules and examples" (navigation needed)
- Solution: Remove inline description, add link to full rule page
- Link goes to `/learn/{ruleSet}/{identifier}/` - comprehensive rule information
- Opens in new tab (`target="_blank"`) so users don't lose their analysis work
- ↗ icon indicates external/new-tab behavior (standard UX pattern)
- Keeps results focused on analysis, not documentation

**Why link to learn page instead of embedding?**
- Learn page already has full rule details, examples, metadata
- No duplication of content
- Users who know the meter can focus on analysis results
- Users who want to learn more get comprehensive information in one click
- Cleaner separation of concerns: results = analysis, learn = education

**Why new tab instead of modal (for now)?**
- Simpler implementation - no modal component needed yet
- New tab preserves analysis context (user can switch back easily)
- User explicitly requested new tab for initial implementation
- Future enhancement: Modal overlay showing rule details and examples
  - Would keep user in same context
  - Faster than page load
  - Can be added in Phase 6+ without changing link structure

**Why keep legacy CSS classes?**
- Cannot modify Core HTML generation (READ-ONLY)
- Easier to add CSS than parse/rebuild HTML in TypeScript
- Maintains backward compatibility
- Legacy classes have semantic meaning (gOk, gErr, yati)
