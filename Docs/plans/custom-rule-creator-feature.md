# Custom Rule Creation Feature - Implementation Plan

## Context

This feature adds a custom Telugu poetry meter rule designer to the Chandam WASM app. Users can create their own rules with a visual form interface similar to the legacy designer (`Obsolete/Client/App/Designer.cs`) but with modern UI/UX matching the current design system.

**Why this change is needed:**
- Allow users to experiment with custom meter patterns without code changes
- Enable community contribution of new rule patterns
- Provide educational tool for understanding chandas (meters)
- Store user-created rules permanently in their browser

**What it accomplishes:**
- Full-featured rule designer matching legacy functionality
- Custom rules stored in IndexedDB as a "Custom Rules" collection
- Persistent storage across sessions (like favorites)
- Integration with existing analysis engine via JsBridge

## UI/UX Design Principle

**Critical**: The rule creator form follows the **exact same pattern as the compute page's editor** (`/Client/src/ui/shared-components.ts` - `renderEditorCard` function).

**Pattern Structure:**
```
.editor-section
├── .editor-toolbar (top actions)
│   ├── .editor-context-group (left: context/labels)
│   └── .editor-actions (right: utility buttons)
├── [Content area] (textarea/table/etc.)
└── .controls-bar (bottom actions)
    ├── .toggle-group (left: options/toggles)
    └── .main-actions (right: primary button)
```

**Key Elements Reused:**
- `editor-section` - Card container with borders
- `editor-toolbar` - Top toolbar with left/right layout
- `controls-bar` - Bottom toolbar with left/right layout
- `toggle-switch` - Existing toggle component
- `<details class="rule-picker-inline">` - Dropdown pattern
- `separator` spans - Visual dividers between items
- Button classes: `btn-primary`, `btn-secondary`

This ensures visual consistency and familiar UX across the entire application.

**Visual Layout Comparison:**

```
COMPUTE PAGE EDITOR:                     RULE CREATOR FORM:
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│ [AutoDetect] | Rule ▼  Random | │     │ Name: [________]          [✓]   │
├─────────────────────────────────┤     ├─────────────────────────────────┤
│                                 │     │ PadyamType: [Vruttam▼] |        │
│   [Poem Text Area]              │     │ GanaType: [Name▼]               │
│                                 │     └─────────────────────────────────┘
│                                 │     
├─────────────────────────────────┤     ┌─────────────────────────────────┐
│ [Yati] | [Prasa]      [Analyze]│     │ Rule Pattern          [Add Row] │
└─────────────────────────────────┘     ├─────────────────────────────────┤
                                        │ Table with gana dropdowns        │
                                        └─────────────────────────────────┘
                                        
                                        ┌─────────────────────────────────┐
                                        │ [Prasa] | [PrasaYati] | ...     │
                                        │                  Lines: [4▼]    │
                                        └─────────────────────────────────┘
                                        
                                        ┌─────────────────────────────────┐
                                        │ [Cancel]             [Create]   │
                                        └─────────────────────────────────┘

Same structure: toolbar on top, controls on bottom, consistent styling
```

## Requirements Based on User Feedback

### Form Features (Full Legacy Parity)
Based on analysis of `Obsolete/Client/App/Designer.cs`:

1. **Name input** - Text field for rule name (పేరు)
2. **PadyamType dropdown** - Jati/UpaJati/Vruttam (జాతి/ఉపజాతి/వృత్తం)
3. **GanaType dropdown** - Dynamically changes based on PadyamType:
   - **Vruttam** → "Name" (పేరు): య,మ,త,ర,జ,భ,న,స,గ,గా,వ,హ,లల,ల
   - **Jati** → "Type" (రీతి): ఇంద్ర,సూర్య,చంద్ర,గురువు,లఘువు OR "Weight" (మాత్రా): 1-50
   - **UpaJati** → "Type" only
4. **Dynamic rule rows** (each row = one pada/line):
   - "పాదమును కలుపు" button - Add new row
   - Each row contains:
     - Row header: "X గణములు" (gana count)
     - "గణమును కలుపు" link - Add gana dropdown to row
     - "గణమును తొలగించు" link - Remove last gana
     - Yati input - Comma-separated positions (e.g., "8,14")
     - Multiple gana dropdowns (based on GanaType selection)
   - Remove row button (removes entire pada)
5. **Options section** (checkboxes/toggles):
   - Prasa (ప్రాస) - Rhyme requirement
   - PrasaYati (ప్రాసయతి) - Prasa with Yati
   - AnthyaPrasa (అంత్యప్రాస) - End rhyme
   - DaMdakamu (దండకము) - Infinite length flag
   - SameRules (సమము) - Use same pattern for all lines
6. **Lines dropdown** - 1-8 padas (visible when SameRules checked)

### Rule Structure Example
From `Chandam.Rules/Vruttam/R17.cs` - మందాక్రాంతము:
```csharp
Rules = new string[][] { "మ,భ,న,త,త,గా".Split(',') };
// 2D array: outer = different patterns, inner = gana sequence per pada
// This example: 1 pattern with 6 ganas (మ,భ,న,త,త,గా)
```

### Storage & Display
- **Storage**: IndexedDB with `custom-rules` object store
- **Collection Display**: "Custom Rules" card on home page (similar to favorites, but distinct styling)
- **Collection ID**: `"custom-rules"` with `type: 'custom'`
- **UI Entry Point**: Button/link on rule-sets-page
- **Management**: Create + Delete (no editing)
- **Limit**: 50 custom rules maximum

### Examples
- **NOT collected during rule creation**
- Users can add examples later by analyzing poems with the custom rule on the compute page

### Identifier Generation
- Auto-generated as hash of the rule name
- Format: `custom-{positive_hash}` (e.g., `custom-1234567890`)
- Uses simple 32-bit hash algorithm on the name string
- Same name always produces same identifier (deterministic)
- Collision-resistant for typical use case

## Implementation Approach

See full implementation details in the sections below covering:
- Phase 1: Data Model & Storage Service
- Phase 2: Rule Creator Form UI (with i18n)
- Phase 3: Route & Navigation Integration
- Phase 4: Custom Rules Collection Display
- Phase 5: Delete Functionality
- Phase 6: C# Integration via JsBridge
- Phase 7: Styling

## Critical Files

### New Files
1. `/Client/src/ui/rule-creator-page.ts` - Main form implementation (~500-600 lines)
2. `/Client/src/services/storage/custom-rules-service.ts` - CRUD service (~150-200 lines)

### Modified Files
1. **`/Client/src/i18n.ts`** - Add ~65 new translation keys (both EN and TE)
2. `/Client/src/main.ts` - Add `/create-rule` route
3. `/Client/src/ui/rule-sets-page.ts` - Add button + display collection card + i18n import
4. `/Client/src/ui/learn-index-page.ts` - Add delete functionality + i18n import
5. `/wwwroot/css/chandam.css` - Add form styles (~300 lines)
6. `/Client/src/services/storage/storage-service.ts` - Export customRulesService (if needed)

## Success Criteria
- ✅ User can create custom rules with full legacy designer features
- ✅ Custom rules persist in IndexedDB across sessions
- ✅ Custom rules appear in dedicated collection on home page
- ✅ Custom rules work for poem analysis via compute page
- ✅ User can delete custom rules
- ✅ **All text uses i18n system** - supports both English and Telugu via language toggle
- ✅ **Language switching works seamlessly** - all labels update when toggling EN/TE
- ✅ **UI matches compute page design exactly**:
  - Same `editor-section` card structure
  - Same `editor-toolbar` and `controls-bar` layout
  - Same toggle switches, buttons, and separators
  - Same dropdown styling (border, padding, hover states)
  - Same responsive behavior on mobile
- ✅ No regressions in existing functionality
- ✅ All 379 existing rules still work (no breakage)

---

**Status**: Planning complete - Ready for implementation
**Date**: 2026-04-14
