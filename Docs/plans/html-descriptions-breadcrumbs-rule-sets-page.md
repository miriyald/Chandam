# Implementation Plan: HTML Descriptions, Breadcrumbs, and Rule Sets Page

## Context

The Chandam WASM application currently has three UX issues that need to be addressed:

1. **Markdown Rendering Issue**: Rule descriptions on the learn detail page (`/learn/:ruleSet/:ruleId`) are being rendered as plain text, showing literal markdown syntax (headers with `#`, lists with `-`, etc.) instead of formatted HTML. The backend `DescriptionBuilder.cs` generates markdown-formatted descriptions, but the frontend simply interpolates them into a `<p>` tag without processing.

2. **Missing Breadcrumb Navigation**: Users have no visual indication of their current location in the site hierarchy and no quick way to navigate back to parent pages. The application relies solely on contextual links scattered throughout pages.

3. **Rule Sets on Home Page**: The home page currently serves double duty as both a landing page and a rule sets browser, showing three rule set cards. This should be separated into a proper landing page and a dedicated `/rule-sets` page.

These changes will improve user experience by providing proper content formatting, clearer navigation hierarchy, and better information architecture.

### Important: Why Both Markdown and HTML Formats Are Needed

The Chandam API serves **two distinct consumers**:

1. **MCP Servers** (Chandam.MCP.Stdio, Chandam.MCP.Http): These provide Chandam tools to Claude Desktop and other MCP clients. Claude Desktop can render markdown natively, so descriptions should remain in **markdown format** for optimal display in AI chat interfaces.

2. **WASM Frontend** (Chandam.Wasm): The browser-based web application that needs **HTML format** for rendering descriptions with proper semantic structure and styling.

**Solution**: Use `RenderFormat` enum to control description format:
- `DescriptionFormat = RenderFormat.Markdown` → `Description` contains markdown (for MCP servers)
- `DescriptionFormat = RenderFormat.Html` → `Description` contains HTML (for WASM frontend)

This single-field approach ensures:
- **Token efficiency**: Only one format generated and sent
- No breaking changes for existing consumers (defaults to Markdown)
- Optimal rendering for both AI and human interfaces
- No client-side conversion overhead

## Implementation Approach

### Phase 1: HTML Description Rendering (Priority: High)

**Approach**: Add HTML description generation alongside the existing markdown format. Both formats will be available in the API response, allowing MCP servers to use markdown (for Claude Desktop) and the WASM frontend to use HTML (for browser rendering).

**Why Both Formats:**
- **Markdown** needed for MCP servers (Claude Desktop can render markdown)
- **HTML** needed for WASM frontend (browser rendering)
- No breaking changes - existing API consumers continue to work
- No frontend dependencies or bundle size increase
- Server-side rendering is more secure and efficient

**Implementation Steps:**

1. **Extend DescriptionBuilder** (`Chandam.API/Services/DescriptionBuilder.cs`):
   - Add new method: `public static string BuildDescriptionHtml(Rule rule)`
   - Mirror the structure of `BuildDescription()` but generate HTML instead of markdown
   - Key transformations:
     - Replace `# {title}` → `<h2>{title}</h2>`
     - Group consecutive `- List item` → `<ul><li>List item</li></ul>`
     - Plain text lines → `<p>Text</p>`
     - Code-like content (sequences, patterns) → `<code>{content}</code>`
   - HTML Structure:
     ```html
     <div class="rule-description">
       <h2>Title</h2>
       <ul>
         <li>Item 1</li>
         <li>Item 2</li>
       </ul>
       <p>Additional text</p>
     </div>
     ```
   - Implementation considerations:
     - Use `StringBuilder` with `AppendLine()` for performance
     - HTML encoding is automatic in C# string interpolation (no XSS risk)
     - Group list items together (don't create multiple `<ul>` elements)
     - Keep Telugu text intact (Unicode safe)
   - **Keep the existing `BuildDescription()` method** - used by MCP servers

2. **Add DescriptionFormat parameter to GetRuleInfoRequest** (`Chandam.API/Models/GetRuleInfoRequest.cs`):
   - Add new property: `public RenderFormat DescriptionFormat { get; set; } = RenderFormat.Markdown;`
   - Defaults to Markdown for backward compatibility with MCP servers

3. **Update ChandamService** (`Chandam.API/Services/ChandamService.cs`):
   - Update `BuildRuleInfo()` signature to accept `RenderFormat descriptionFormat` parameter
   - Update call in `GetRuleInfo()` to pass `request.DescriptionFormat`
   - Use conditional logic to generate HTML or Markdown:
     ```csharp
     Description = descriptionFormat == RenderFormat.Html
         ? DescriptionBuilder.BuildDescriptionHtml(rule)
         : DescriptionBuilder.BuildDescription(rule),
     ```
   - **Token Efficiency**: Only one format generated and sent, not both!

4. **Update WASM JsBridge** (`Chandam.Wasm/JsBridge.cs`):
   - Set `DescriptionFormat = RenderFormat.Html` in GetRuleInfo call:
     ```csharp
     var request = new GetRuleInfoRequest {
         RuleIdentifier = ruleId,
         IncludeExamples = true,
         DescriptionFormat = RenderFormat.Html  // WASM needs HTML
     };
     ```

5. **Update Frontend TypeScript types** (`Chandam.Wasm/Client/src/types.ts`):
   - Add comment to clarify: `description?: string; // Contains HTML when DescriptionFormat.Html is used`

6. **Update Frontend rendering** (`Chandam.Wasm/Client/src/ui/learn-detail-page.ts`):
   - Use `description` field (which now contains HTML from backend):
     ```typescript
     <div class="description-content">
       ${ruleInfo.description || '<p>No description available</p>'}
     </div>
     ```
   - The HTML from backend is already safe and formatted

6. **Add HTML Description CSS styles** (`Chandam.Wasm/wwwroot/css/chandam.css`):
   - Style `.description-content` container and child elements
   - Proper spacing for headers, lists, paragraphs
   - Consistent typography using existing CSS variables
   - Match the visual style of other content sections

### Phase 2: Breadcrumb Navigation (Priority: High)

**Component Architecture:**

Create a breadcrumb module at `src/ui/breadcrumbs.ts` with:

**Core Interface:**
```typescript
interface BreadcrumbItem {
  label: string;
  url?: string;  // undefined for current page
}
```

**Exported Functions:**
- `renderBreadcrumbs(items: BreadcrumbItem[]): string` - Renders HTML for breadcrumbs
- `buildRuleSetBreadcrumbs(ruleSetId, mode)` - Builds breadcrumbs for rule set pages
- `buildRuleBreadcrumbs(ruleSetId, ruleId, ruleName, mode)` - Builds breadcrumbs for rule pages
- `buildStaticPageBreadcrumbs(pageName)` - Builds breadcrumbs for About/Contact/Credits

**Breadcrumb Patterns:**
- Home: `Home`
- Rule Sets: `Home › Rule Sets`
- Learn/Compute Rule Set: `Home › Rule Sets › {Rule Set Name}`
- Learn/Compute Rule: `Home › Rule Sets › {Rule Set Name} › {Rule Name}`
- Static Pages: `Home › {Page Name}`

**Integration Points:**
- `learn-detail-page.ts` - Add breadcrumbs at top of page (after line 45)
- `learn-index-page.ts` - Add breadcrumbs for rule set browse page
- `rule-set-page.ts` - Add breadcrumbs for compute rule set page
- `rule-page.ts` - Add breadcrumbs for compute rule page
- `rule-sets-page.ts` (new) - Add breadcrumbs for rule sets listing

**CSS Styling:**
- Add `.breadcrumbs` navigation styles to `chandam.css`
- Use `›` separator with subtle gray color
- Current page in bold with primary color
- Links with hover effects
- Mobile responsive (smaller font, tighter spacing)

### Phase 3: Dedicated Rule Sets Page (Priority: Medium)

**Create New Page:**

1. **New component** (`src/ui/rule-sets-page.ts`):
   - Export `renderRuleSetsPage()` function
   - Move rule set card rendering logic from `home-page.ts`
   - Add breadcrumbs: `Home › Rule Sets`
   - Title: "Telugu Poetry Meter Rule Sets"
   - Subtitle: "Choose a rule set to analyze poetry or learn about meters"

2. **Rewrite home page** (`src/ui/home-page.ts`):
   - Convert to landing page layout
   - Hero section with:
     - Large title: "ఛందం"
     - Subtitle: "Telugu Poetry Meter Analysis"
     - Description paragraph
     - Primary CTA button: "Browse Rule Sets" → `/rule-sets`
   - Quick links grid with cards for:
     - Rule Sets (→ `/rule-sets`)
     - About (→ `/about`)
     - Credits (→ `/credits`)
     - Contact (→ `/contact`)
   - Center-aligned, max-width 900px
   - Use icons (emoji) for visual appeal

3. **Register route** (`src/main.ts`):
   - Add import: `import { renderRuleSetsPage } from './ui/rule-sets-page'`
   - Register route after home: `router.register('/rule-sets', () => renderRuleSetsPage())`

4. **Update navigation header** (`wwwroot/index.html`):
   - Add "Rule Sets" link between Home and About (line 20)
   - HTML: `<a href="/rule-sets">Rule Sets</a>`

5. **Add CSS styles** (`wwwroot/css/chandam.css`):
   - Home page landing styles (hero, quick links grid)
   - Rule sets page styles (reuse existing `.rule-set-cards` styles)
   - Responsive breakpoints for mobile

## Critical Files

### New Files (2)
1. `Chandam.Wasm/Client/src/ui/breadcrumbs.ts` - Breadcrumb component
2. `Chandam.Wasm/Client/src/ui/rule-sets-page.ts` - Dedicated rule sets page

### Modified Files (13)
1. **Backend (API Layer):**
   - `Chandam.API/Services/DescriptionBuilder.cs` - Add `BuildDescriptionHtml()` method
   - `Chandam.API/Services/ChandamService.cs` - Conditional description generation based on RenderFormat
   - `Chandam.API/Models/GetRuleInfoRequest.cs` - Add `DescriptionFormat` parameter
   - `Chandam.Wasm/JsBridge.cs` - Set DescriptionFormat = Html for WASM calls

2. **Frontend (WASM Client):**
   - `Chandam.Wasm/Client/src/types.ts` - Add comment clarifying description format
   - `Chandam.Wasm/Client/src/ui/home-page.ts` - Rewrite as landing page
   - `Chandam.Wasm/Client/src/ui/learn-detail-page.ts` - Render HTML description + breadcrumbs
   - `Chandam.Wasm/Client/src/ui/learn-index-page.ts` - Add breadcrumbs
   - `Chandam.Wasm/Client/src/ui/rule-set-page.ts` - Add breadcrumbs
   - `Chandam.Wasm/Client/src/ui/rule-page.ts` - Add breadcrumbs
   - `Chandam.Wasm/Client/src/main.ts` - Register `/rule-sets` route
   - `Chandam.Wasm/wwwroot/css/chandam.css` - Add ~240 lines (description HTML + breadcrumbs + home page styles)
   - `Chandam.Wasm/wwwroot/index.html` - Update navigation header

## Success Criteria

✅ Rule descriptions render as formatted HTML with proper headers, lists, and spacing (generated on backend)  
✅ No markdown syntax visible in frontend UI  
✅ HTML is semantic and well-structured (`<h2>`, `<ul>`, `<li>`, etc.)  
✅ **Token efficiency**: Only one format (HTML or Markdown) generated per request based on `DescriptionFormat`  
✅ **Backward compatibility**: MCP servers default to Markdown format  
✅ **WASM optimization**: Explicitly requests HTML format for browser rendering  
✅ MCP tests pass (13 tests): `dotnet test Chandam.MCP.Tests`  
✅ Breadcrumbs appear on all appropriate pages with correct hierarchy  
✅ Breadcrumb navigation links work correctly  
✅ `/rule-sets` page displays and functions properly  
✅ Home page is a proper landing page with hero and quick links  
✅ "Rule Sets" link in navigation header  
✅ All existing functionality works (no regressions)  
✅ Mobile responsive on all pages  
✅ No console errors  
✅ All integration tests pass  
✅ No new frontend dependencies added (zero bundle size impact)
