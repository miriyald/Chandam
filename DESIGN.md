---
name: "Chandam"
description: "Telugu poetry meter analysis — modern clarity for classical knowledge"
colors:
  primary: "#1a3a5c"
  primary-hover: "#0f2a45"
  accent-gold: "#b8860b"
  accent-gold-light: "#d4a843"
  success: "#2d6a4f"
  error: "#c1121f"
  warning: "#cc6600"
  yati-orange: "#e07000"
  prasa-purple: "#5c3d7a"
  poem-ink: "#1a2744"
  neutral-bg: "#faf8f5"
  neutral-surface: "#f4f1ec"
  neutral-text: "#1a1a1a"
  neutral-muted: "#5c5c5c"
  neutral-border: "#d4cfc8"
  neutral-divider: "#e8e4de"
  header-bg: "#1a1a1a"
  header-text: "#f5f3f0"
typography:
  logo:
    fontFamily: "'Anek Telugu', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
  display:
    fontFamily: "'Anek Telugu', sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
  editor:
    fontFamily: "'Tiro Telugu', serif"
    fontSize: "1.1rem"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "0.05em"
  body:
    fontFamily: "'Anek Telugu', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Anek Telugu', sans-serif"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "3px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.header-text}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.header-text}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "20px"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: Chandam

## 1. Overview

**Creative North Star: "The Scholar's Desk"**

A clean, organized workspace where ancient texts meet modern tools. The surface is warm — not sterile white but the slight warmth of quality paper. Tools are arranged with deliberate precision. Every element has a clear function and a defined place. The interface communicates scholarly authority through restraint: strong typographic hierarchy, architectural spacing, and color used only where it carries meaning.

This system explicitly rejects generic SaaS aesthetics (gradient CTAs, purple accents, rounded-card grids), gamified patterns (badges, confetti, bright reward colors), lifeless academic density (gray walls of text, no hierarchy), and dark-mode hacker aesthetics (terminal green, monospace-everywhere). It draws from the Telugu literary tradition without becoming a museum piece.

**Key Characteristics:**
- Warm neutral surfaces (paper-tone, not clinical white)
- Ink-dark text with generous line-height for Telugu script
- Gold accent for emphasis and cultural resonance (saffron/temple reference)
- Deep blue-navy as primary action color (authority without harshness)
- Sharp, architectural component edges (small radii, visible borders)
- Progressive disclosure — density only where analysis demands it

## 2. Colors

A restrained palette anchored by warm neutrals and ink tones. Color earns its place: semantic colors mark analysis results, gold marks cultural emphasis, and the deep navy drives actions.

### Primary
- **Scholar's Ink Navy** (#1a3a5c): Primary actions, links, active states. The authoritative tone of the interface. Used on buttons, selected tabs, focus rings.

### Secondary
- **Temple Gold** (#b8860b): Cultural accent. Used sparingly (≤10% of any screen) for emphasis: favorite indicators, selected badges, hover highlights on heritage elements. Connects to saffron/gold of Telugu literary tradition.

### Tertiary (Semantic — analysis-specific)
- **Meter Match Green** (#2d6a4f): Success states exclusively. A poem matches its meter.
- **Pattern Error Red** (#c1121f): Mismatch indicators. Gana errors, failed validations.
- **Yati Orange** (#e07000): Caesura marking in analyzed poems.
- **Prasa Purple** (#5c3d7a): Rhyme marking in analyzed poems.

### Neutral
- **Paper Warm** (#faf8f5): Page background. The warmth of quality stock, not sterile white.
- **Desk Surface** (#f4f1ec): Card and section backgrounds. One step below paper.
- **Deep Charcoal** (#1a1a1a): Primary text and header background. Near-black with warmth.
- **Muted Text** (#5c5c5c): Secondary labels, metadata, timestamps.
- **Warm Border** (#d4cfc8): Card borders, dividers. Visible but never harsh.
- **Subtle Divider** (#e8e4de): Section separators, table lines.

### Named Rules
**The Earned Color Rule.** Color appears only when it carries semantic meaning. Analysis results get semantic color. Navigation and chrome stay neutral. A screen at rest is warm neutrals and ink; color ignites when analysis produces results.

**The Poem Ink Rule.** Poetry text always renders in Poem Ink (#1a2744) — a deep blue-black distinct from UI text. This separates authored content from interface chrome at a glance.

## 3. Typography

**UI Font:** Anek Telugu (sans-serif, variable: 400–800 weight)
**Editor Font:** Tiro Telugu (serif, 400 + italic)

**Character:** A two-font Telugu-first type system. Anek Telugu provides modern geometric clarity across all UI roles, from bold 800-weight logo/display to clean 400-weight body text. Tiro Telugu (by Tiro Typeworks, designed by Fiona Ross and John Hudson) brings expert-crafted literary serif quality to poetry text. The sans/serif contrast clearly signals "interface" vs "verse."

### Hierarchy
- **Logo** (Anek Telugu, 800, 1.5rem, line-height 1.2): Brand mark only. Heavy weight creates distinction.
- **Display** (Anek Telugu, 700, clamp(1.5rem, 4vw, 2.25rem), line-height 1.2): Meter names, page titles, hero text. The visual anchor of every page.
- **Editor** (Tiro Telugu, 400, 1.1rem, line-height 1.8, letter-spacing 0.05em): Poetry input and output. Generous metrics honor Telugu verse rhythm.
- **Body** (Anek Telugu, 400, 1rem, line-height 1.6): Navigation, labels, table content, UI text. Clean and functional.
- **Label** (Anek Telugu, 500, 0.85rem, line-height 1.4, letter-spacing 0.02em): Metadata, counts, timestamps, control labels.

### Named Rules
**The Telugu-First Rule.** Every font decision is validated against Telugu script rendering before Latin. If a size, weight, or spacing looks right in English but wrong in Telugu, the Telugu rendering wins.

**The Poetry Breathing Room Rule.** Poetry text (Tiro Telugu, editor tier) always has line-height ≥ 1.8 and letter-spacing ≥ 0.05em. Telugu verse needs air to be read as rhythm, not as a wall of glyphs.

## 4. Elevation

This system is flat by default. Depth is conveyed through surface color (Paper Warm → Desk Surface → white) and border definition, not shadow. Shadows appear only as a response to interaction state: hover on clickable cards, focus on inputs.

### Shadow Vocabulary
- **Hover lift** (`0 2px 8px rgba(26, 26, 26, 0.08)`): Cards and clickable surfaces on hover. Subtle upward lift.
- **Focus glow** (`0 0 0 2px rgba(26, 58, 92, 0.3)`): Input and button focus rings. Uses primary navy.
- **Dropdown** (`0 4px 16px rgba(26, 26, 26, 0.12)`): Rule picker dropdown, tooltips. Establishes floating layer.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Borders define containers, not shadows. Shadow appears only as feedback: hover lifts a card, focus rings an input, open state floats a dropdown. If a shadow is visible with no interaction, it's wrong.

## 5. Components

### Buttons
- **Shape:** Sharp with minimal rounding (3px radius). Architecturally defined, not pill-shaped.
- **Primary:** Scholar's Ink Navy background, warm white text. Padding 10px 20px. Font: body tier, 500 weight.
- **Hover / Focus:** Darkened navy on hover; 2px navy focus ring on focus-visible. Transition: background 0.2s ease-out.
- **Secondary:** Transparent background, navy text, 1px navy border. Same dimensions. Hover: navy background at 5% opacity.
- **Danger:** Error red background, white text. Reserved for destructive actions (delete rule).

### Cards / Containers
- **Corner Style:** Gently squared (6px radius). Architectural, not rounded.
- **Background:** White (#ffffff) or Desk Surface (#f4f1ec) depending on nesting level.
- **Border:** 1px Warm Border (#d4cfc8). Always visible — borders define, shadows don't.
- **Internal Padding:** 20px (lg spacing).
- **Hover (if clickable):** Hover lift shadow + border darkens slightly.

### Inputs / Fields
- **Style:** White background, 1px Warm Border, 3px radius. Clean stroke definition.
- **Padding:** 10px 12px. Enough room for Telugu glyphs.
- **Focus:** Border shifts to primary navy + focus glow ring. Clear state change.
- **Placeholder:** Muted text color, normal weight.

### Navigation
- **Header:** Deep Charcoal background, warm white text. Logo in Anek Telugu 800 with embossed text-shadow.
- **Nav links:** Warm white, no underline. Hover: Temple Gold color transition. Active: gold underline.
- **Mobile:** Hamburger toggle at 768px. Full-width dropdown nav panel.

### Mode Switcher (Learn/Compute)
- **Style:** Two tabs, segmented control. Active tab: navy background, white text. Inactive: transparent, navy text.
- **Shape:** 3px radius on outer corners. Joined edges are square.

### Toggle Switches
- **Style:** 48x26px track. Off: Warm Border background. On: primary navy background.
- **Knob:** White circle with subtle shadow. Smooth 0.2s slide transition.

### Match Result Cards (Signature Component)
The payoff screen. Two variants:
- **Success (100% match):** 2px left-border in Meter Match Green. Background: white. Prominent green score badge.
- **Failure (<100%):** 2px left-border in Error Red. Score badge in appropriate level color (medium=gold, low=red).
- **Body:** Split view — left panel shows poem/gana table, right panel shows errors or beautified output.
- **Score badge:** Rounded pill, bold weight, color-coded by threshold (≥90% green, 50-89% gold, <50% red).

### Gana Tables (Core-Generated)
- **Structure:** Grid of syllable cells. Each cell: bordered, mono-height, centered content.
- **Colors:** `.gOk` cells use Success green background at 10% opacity. `.gErr` cells use Error red at 10% opacity.
- **Yati markers:** Orange bottom-border on `.yati` / `.y1` cells.
- **Direction indicators:** `.up` and `.dw` cells show directional content in muted text.

## 6. Do's and Don'ts

### Do:
- **Do** use Paper Warm (#faf8f5) as the page background — never pure white (#ffffff) except inside cards/inputs.
- **Do** render all meter names in Anek Telugu 700 (display tier) at 1.25rem+ to establish clear hierarchy.
- **Do** give poetry text (Tiro Telugu, editor tier) at least 1.8 line-height and 0.05em letter-spacing, always.
- **Do** use Temple Gold sparingly — favorites, selected states, cultural emphasis. Its rarity is the point.
- **Do** test every typography change against actual Telugu text before committing.
- **Do** keep component corners sharp (3-6px radius). This is an architectural system, not a friendly one.

### Don't:
- **Don't** use gradient CTAs, pill-shaped primary buttons, or rounded-card grids. This is not generic SaaS.
- **Don't** add badges, streaks, confetti, or cartoon illustrations. Too casual for a scholarly tool.
- **Don't** use walls of unstyled text with no visual hierarchy. Content without structure is not minimalism.
- **Don't** use terminal green, monospace body text, or code-editor chrome. Wrong cultural context.
- **Don't** use pure black (#000000) for backgrounds or text — always use Deep Charcoal (#1a1a1a) or warmer.
- **Don't** use pure white (#ffffff) for page backgrounds — always Paper Warm (#faf8f5). White is for elevated surfaces (cards, inputs).
- **Don't** apply shadows to static elements. If nothing is being hovered, focused, or opened, no shadow should be visible.
- **Don't** nest cards inside cards. If content needs grouping within a card, use spacing and typography, not another container.
- **Don't** use border-left accents thicker than 2px. The match result cards use exactly 2px as a status indicator — never thicker, never decorative.
