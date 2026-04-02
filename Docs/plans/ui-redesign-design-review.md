# Chandam WASM Editor - UI Redesign Proposal (Updated)
**Design Review Document for External Team**

---

## Executive Summary

This proposal redesigns the Chandam poetry meter analyzer interface from a **tabbed navigation model** to a **streamlined, context-aware interaction model**. The redesign eliminates unnecessary navigation, maximizes space for Telugu text, and creates a cleaner visual hierarchy.

**Key Goals:**
- Reduce cognitive load (from "which tab?" to "analyze my poem")
- Maximize editor space for Telugu poetry text
- Modernize interaction patterns (toggle switches, inline dropdowns)
- Improve mobile experience
- Maintain all existing functionality

---

## What is Chandam?

Chandam (ఛందం) is a Telugu poetry meter analysis system. Users enter a Telugu poem, and the system either:
1. **Auto-detects** which meter pattern it matches (like "iambic pentameter" but for Telugu)
2. **Tests** if it matches a specific meter the user selects

Think of it as a spell-checker, but for poetic rhythm and structure.

---

## Current State (Problem)

### Desktop View - Current
```
┌────────────────────────────────────────────┐
│ Rule Set: Telugu Frequent [379 Rules]     │
├────────────────────────────────────────────┤
│ [Determine Tab] [Match Tab]  ← Navigation │
├────────────────────────────────────────────┤
│ Text editor                                │
│                                            │
│ పద్యం ఇక్కడ టైప్ చేయండి...               │
│                                            │
├────────────────────────────────────────────┤
│ ☑ Yati  ☑ Prasa  ← Options                │
├────────────────────────────────────────────┤
│ [Select Rule ▼]  ← Only visible in Match   │
├────────────────────────────────────────────┤
│ [Determine] or [Match]  ← Button changes   │
│ 🎲 Random  🧹 Clear                        │
└────────────────────────────────────────────┘
```

### Issues Identified

1. **Tab Navigation Friction** - Users must click tabs to switch between modes
2. **Hidden Context** - Rule selection hidden in Match tab
3. **Changing Button Labels** - Button says "Determine" or "Match" depending on tab
4. **Scattered Controls** - Options spread across interface
5. **Mobile Challenges** - Tabs take vertical space, checkboxes are small touch targets

---

## Proposed Solution (Future State)

### Desktop View - Proposed (CORRECTED)
```
┌──────────────────────────────────────────────────────┐
│ Auto-detect [⚪────] ON                               │
│ Matching with: Utpalamala ▼  (when OFF)             │
├──────────────────────────────────────────────────────┤
│ Enter Telugu poem:                    🎲 Random 🧹 Clear │ ← Editor toolbar
│ ┌──────────────────────────────────────────────────┐ │
│ │ పద్యం ఇక్కడ టైప్ చేయండి...                      │ │
│ │                                                  │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ Yati [⚪──]  Prasa [⚪──]              [Analyze Poem] │
└──────────────────────────────────────────────────────┘
```

**Key correction:** Random/Clear belong to the **editor toolbar** (top-right of editor), not mode controls. This positioning:
- Groups utilities with the content they act upon (editor)
- Leaves room for future editor tools (keyboard selector, copy, paste, font size)
- Separates mode configuration (top) from content tools (middle) from analysis (bottom)

### Mobile View - Proposed (CORRECTED)
```
┌────────────────────────────┐
│ Auto-detect [⚪────] ON     │
│ Matching with: Rule ▼      │
├────────────────────────────┤
│ Enter poem:      🎲 🧹     │ ← Editor toolbar
│ ┌────────────────────────┐ │
│ │ పద్యం...              │ │
│ └────────────────────────┘ │
├────────────────────────────┤
│  Yati [⚪──]  Prasa [⚪──]  │
├────────────────────────────┤
│     [Analyze Poem]         │
└────────────────────────────┘
```

---

## Key Design Changes

### 1. Tabs → Toggle Switch
**Before:** Two tabs (Determine / Match)  
**After:** One toggle switch (Auto-detect ON/OFF)

**Why:** Mode is a preference, not navigation. Toggle is instant vs tabs requiring click-to-switch.

### 2. Checkboxes → Toggle Switches
**Before:** `☑ Yati  ☑ Prasa`  
**After:** `Yati [⚪──]  Prasa [⚪──]`

**Why:** Larger touch targets (44px+ vs ~20px), clearer ON/OFF state, modern aesthetic.

### 3. Dropdown → Inline Label Picker
**Before:** Large `<select>` dropdown buried in Match tab  
**After:** Clickable "Matching with: Utpalamala ▼" that expands inline

**Why:** Always visible, lightweight interaction, room for enhancements (search, recent rules).

### 4. Scattered → Grouped Controls Bar
**Before:** Options above editor, button below, utilities at bottom  
**After:** Single controls bar below editor (options left, button right)

**Why:** Clear visual hierarchy, all controls in one scannable location.

### 5. Editor Toolbar (NEW)
**Before:** Random/Clear at bottom, separated from editor  
**After:** Toolbar above editor with utility actions

**Why:** 
- Utilities belong with the content they modify
- Extensible for future tools (keyboard selector, copy/paste, font controls)
- Clearer information architecture

---

## Design Inspiration

- **LangChain Agent Chat UI** - Single focused input, inline options
- **Google Material Design** - Toggle switches, elevation
- **iOS Human Interface Guidelines** - Toggle pattern, clear hierarchy
- **Poetry Foundation** - Content-first layout
- **VS Code Editor** - Toolbar pattern for editor utilities

---

## Success Metrics

### Quantitative
- Reduce clicks to analyze: 3-4 → 2-3 clicks
- Mode switching: 2 seconds → <1 second  
- Reduce "no rule selected" errors by 50%
- Pass WCAG AA accessibility audit (100 score)

### Qualitative
- Users describe interface as "simpler" or "cleaner"
- Reduced confusion about modes
- Positive mobile usability feedback

---

## External Design Team Feedback (Addressed)

### 1. Hidden Rule Risk
**Concern:** When Auto-detect is ON, rule picker could confuse users.

**Response:** Rule picker row completely hidden (not disabled) when auto-detect ON. Progressive disclosure only when needed.

### 2. Telugu Script Spacing
**Concern:** Telugu script (vattulu, maatras) needs generous vertical spacing.

**Response:** 
- Line-height: 1.8 minimum
- Padding: 1rem inside textarea
- Min-height: 200px
- Border-radius: 8px (complements script curves)

### 3. Editor Toolbar Placement
**Concern:** Random/Clear belong to editor, not mode controls.

**Response:** ✓ CORRECTED - Moved to editor toolbar (see updated mockups above). Extensible for future tools.

### 4. Smart Button Labels
**Suggestion:** Button could change label based on mode.

**Response:** Starting with consistent "Analyze Poem" for simplicity. Future enhancement could show:
- Auto-detect ON: "Scan for Meter"
- Auto-detect OFF: "Verify [Rule Name]"
- Requires user testing to validate.

### 5. Real-time Analysis
**Suggestion:** WASM performance could enable live highlighting.

**Response:** Phase 2 feature. Phase 1 focuses on core UX improvements. Future:
- Debounced analysis (300ms after typing stops)
- Inline Yati/Prasa markers
- Performance budget: <50ms per keystroke

### 6. Rule Set Visibility
**Concern:** "Telugu Frequent [379 Rules]" context missing in new design.

**Response:** Kept in existing location. Future enhancement: Show active rule count in mode header or settings gear icon.

### 7. Performance Visibility
**Suggestion:** Show analysis time to highlight WASM speed.

**Response:** Added to roadmap. "Analyzed in 12ms" toast or inline with results.

---

## Implementation Roadmap

### Phase 1 (This Redesign) - 6-8 hours
- ✓ Toggle switches for all boolean controls
- ✓ Full-width editor (line-height: 1.8)
- ✓ Editor toolbar (Random, Clear)
- ✓ Context-aware Analyze button
- ✓ Mobile-responsive layout

### Phase 2 (Quick Wins) - 4-6 hours
- Rule set visibility in header
- Performance timing display
- Smart button labels (optional)
- Keyboard shortcuts (Ctrl+Enter)

### Phase 3 (Advanced UX) - 12-16 hours
- Real-time analysis (debounced)
- Inline prosody highlighting
- Editor toolbar extensions:
  - Telugu keyboard selector
  - Copy/Paste formatting
  - Font size adjuster
  - Dark mode toggle
- Floating Action Button (mobile)

### Phase 4 (Power User) - 20+ hours
- Command palette (Cmd+K)
- Rule set quick switcher
- Analysis history
- Export (PDF, Markdown)
- Comparative analysis

---

## Technical Notes

### WASM Integration
- Toggle state syncs to WASM on button click (not pre-computed)
- Reactive state management for UI responsiveness
- Performance budget: <50ms for future real-time mode

### Accessibility
- All toggle switches: keyboard operable (Space/Enter)
- Screen reader: "Auto-detect, toggle switch, on/off"
- Touch targets: 44px+ minimum
- Color contrast: WCAG AA (4.5:1)

### Browser Support
- Toggle CSS: All modern browsers
- `<details>` element: 97% support
- Fallback: Standard dropdown for older browsers

---

## Open Questions for Design Team

1. **Toggle Animation:** 300ms feels right, or adjust?
2. **Rule Picker Search:** Add search box for 379 rules?
3. **Button Style:** Keep solid black, or try outlined/gradient?
4. **Loading State:** Spinner in button or separate indicator?
5. **First-time User:** Show tooltips/hints on first visit?
6. **Error Handling:** Inline messages or alert dialogs?
7. **Micro-interactions:** Button press animation (scale)?

---

## Comparison Table

| Feature | Tabbed Model (Current) | Streamlined (Proposed) |
|---------|------------------------|------------------------|
| **Cognitive Load** | High (mode navigation) | Low (mode preference) |
| **Screen Space** | Fragmented | Maximized for content |
| **Error Rate** | High (wrong tab) | Low (context visible) |
| **Mobile UX** | Poor (small targets) | Good (44px+ toggles) |
| **Editor Focus** | Competing elements | Full-width, generous spacing |
| **Extensibility** | Limited | Editor toolbar expandable |

---

## Next Steps

1. ✓ **Design Review** - External team feedback incorporated
2. **Mockups** - Create high-fidelity designs (optional, Figma)
3. **Prototype** - Build interactive HTML/CSS prototype
4. **User Testing** - Test with 5-10 Telugu poetry users
5. **Refinement** - Incorporate user feedback
6. **Implementation** - Follow technical plan
7. **Launch** - Gradual rollout with analytics

---

*Document created: 2026-04-01*  
*Updated: 2026-04-01 (incorporated design team feedback)*  
*Status: Ready for implementation*  
*Technical plan: composed-mapping-kernighan.md*
