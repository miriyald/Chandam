# Telugu Padyam Writing Guide

A comprehensive guide for composing Telugu padyams (poems) using the Chandam MCP tools. Organized into four parts: **Knowledge** (reference material), **Workflow** (step-by-step process), **Examples** (practical illustrations), and **Learnings** (insights from practice).

---

# Part I: Knowledge

Reference material for Telugu prosody. Consult these sections as needed during writing.

---

## 1. Syllable Basics: Guru and Laghu

Every Telugu syllable is classified as either **guru** (heavy/long) or **laghu** (light/short). This is the foundation of all meter analysis.

| Type | Telugu | Symbol | Description |
|------|--------|--------|-------------|
| **Guru** | గ | `U` | Heavy/long syllable (2 మాత్రలు) |
| **Laghu** | ల | `\|` | Light/short syllable (1 మాత్ర) |

**What makes a syllable guru:**
- Long vowels: ఆ, ఈ, ఊ, ఏ, ఐ, ఓ, ఔ
- Anusvara (ం) on the syllable
- Visarga (ః) on the syllable
- A syllable followed by a conjunct consonant

**What makes a syllable laghu:**
- Short vowels: అ, ఇ, ఉ, ఋ
- No anusvara, no visarga, no following conjunct

---

## 2. GaNA Classification

Each Telugu letter in a chandam rule represents a specific pattern of guru and laghu syllables.

### Tri-syllable GaNAs (3 aksharas each)

The 8 fundamental gaNAs — every chandam rule is built from combinations of these.

| Telugu Symbol | Name | Binary Pattern | Mnemonic |
|---------------|------|----------------|----------|
| న | na-gaNamu | `\|\|\|` | all light |
| స | sa-gaNamu | `\|\|U` | light-light-heavy |
| య | ya-gaNamu | `\|UU` | light-heavy-heavy |
| జ | ja-gaNamu | `\|U\|` | light-heavy-light |
| భ | bha-gaNamu | `U\|\|` | heavy-light-light |
| ర | ra-gaNamu | `U\|U` | heavy-light-heavy |
| త | ta-gaNamu | `UU\|` | heavy-heavy-light |
| మ | ma-gaNamu | `UUU` | all heavy |

### Sub-units (1-2 aksharas)

| Telugu Symbol | Binary Pattern | Description |
|---------------|----------------|-------------|
| గ | `U` | Single guru |
| ల | `\|` | Single laghu |
| వ | `\|U` | laghu + guru (2 syllables) |
| హ | `U\|` | guru + laghu (2 syllables) |
| గా | `UU` | Two gurus |
| లల | `\|\|` | Two laghus |

### Compound GaNAs (4 syllables) - Indra class

| Telugu Symbol | Name | Binary Pattern | Derivation |
|---------------|------|----------------|------------|
| నల | nala-gaNamu | `\|\|\|\|` | న + ల |
| నగ | naga-gaNamu | `\|\|\|U` | న + గ |
| సల | sala-gaNamu | `\|\|U\|` | స + ల |

### Compound GaNAs (5 syllables) - Chandra class

| Telugu Symbol | Name | Binary Pattern | Derivation |
|---------------|------|----------------|------------|
| నగగ | nagaga-gaNamu | `\|\|\|UU` | న + గా |
| నహ | naha-gaNamu | `\|\|\|U\|` | న + హ |
| సలల | salala-gaNamu | `\|\|U\|\|` | స + లల |
| భల | bhala-gaNamu | `U\|\|\|` | భ + ల |
| భగురు | bhaguru-gaNamu | `U\|\|U` | భ + గ |
| మలఘు | malaghu-gaNamu | `UUU\|` | మ + ల |
| సవ | sava-gaNamu | `\|\|U\|U` | స + వ |
| సహ | saha-gaNamu | `\|\|UU\|` | స + హ |
| తల | tala-gaNamu | `UU\|\|` | త + ల |
| రల | rala-gaNamu | `U\|U\|` | ర + ల |
| నవ | nava-gaNamu | `\|\|\|\|U` | నల + గ |
| నలల | nalala-gaNamu | `\|\|\|\|\|` | నల + ల |
| రగురు | raguru-gaNamu | `U\|UU` | ర + గ |
| తగ | taga-gaNamu | `UU\|U` | త + గ |

### Reading a Chandam Rule Pattern

When a chandam rule says the pattern is `భ ర న భ భ ర ల గ`, expand it:

```
భ  = U||
ర  = U|U
న  = |||
భ  = U||
భ  = U||
ర  = U|U
ల  = |
గ  = U
```

Full line pattern: `U|| U|U ||| U|| U|| U|U | U` (20 syllables per line)

Multi-character symbols are read as single gaNAs. For example, `నగగ` is one 5-syllable gaNa (`|||UU`), not three separate symbols.

### GaNA Categories

GaNAs are classified into categories that determine **yati compatibility** at gaNa boundaries.

| Category | GaNAs | Syllable Count |
|----------|-------|----------------|
| **Surya (సూర్య)** | హ (`U\|`), న (`\|\|\|`) | 2-3 |
| **Indra (ఇంద్ర)** | భ, ర, త, నల, నగ, సల | 3-4 |
| **Chandra (చంద్ర)** | నగగ, నహ, సలల, భల, భగురు, మలఘు, సవ, సహ, తల, రల, నవ, నలల, రగురు, తగ | 5 |

**SubCategories:**

| Pattern | Telugu Name | SubCategory |
|---------|-------------|-------------|
| `\|\|\|` | న (na) | **LaghuSurya** — All-laghu surya group |
| `\|\|\|\|\|` | నలల (nalala) | **Laghu5** — Five consecutive laghus |

---

## 3. యతి (Yati) Matching

యతి is the caesura — a sound-match between the line's first akshar and an akshar at a specific position within the line.

### Yati Position Modes

| Mode | How Position is Determined | Used By |
|------|---------------------------|---------|
| **CharPosition** | Nth character/akshar in the line | వృత్తం meters (e.g., 10th syllable in ఉత్పలమాల) |
| **GPosition** | First akshar of the Nth గణం | జాతి meters (e.g., 4th గణం in కందం) |

### Yati Types by Meter

| Meter Type | యతి Position | What Must Match |
|------------|-------------|-----------------|
| **వృత్తం** (e.g., ఉత్పలమాల) | Fixed character position (e.g., 10th syllable) | Letter at that position ↔ line's 1st letter |
| **జాతి** (e.g., కందం) | Start of a specific గణం (e.g., 4th గణం) | Letter at గణం boundary ↔ line's 1st letter |
| **ఉపజాతి** (e.g., ఆటవెలది) | Varies by line | Check `get_rule_info` for each line's rule |

### Two-Phase Matching Algorithm

The engine checks యతి in **two phases**: first a consonant/vowel match, then (for consonant matches) a finish-group confirmation. Both must pass.

#### Phase 1: Consonant or Vowel Match

Checked **in order** — first match wins:

| Step | Name | Condition | Match Logic |
|------|------|-----------|-------------|
| 1 | **ౠత్వసౌమ్యవళి** | Both contain ృ | Always match |
| 2 | **ఋత్వసంబంధవళి** | One has ృ | Other must be in {ఇ,ఈ,ఋ,ౠ,ఎ,ఏ,ి,ీ,ృ,ౄ,ె,ే} |
| 3 | **ఋవళి** | One has ఋ or ృ | Other must start with ర and end with {ి,ీ,ె,ే} |
| 4 | **స్వరప్రధానవళి** | Extract vowels/finishes | Must be in same VowelAndFinishGroup. Does NOT match if both are pure finishes only |
| 5 | **ప్రత్యేక యతి** | One consonant is య or హ | Other must contain అ |
| 6 | **సమాన హల్లు** | Extract consonants | Exact same consonant found |
| 7 | **ConsoGroups** | Extract consonants | At least one consonant from each side belongs to the same group (18 groups) |
| 8 | **విశేషవళి** | One contains ఙ | Other must be ంక, ంఖ, ంగ, or ంఘ |
| 9 | **తద్భవవ్యాజ విశ్రమములు** | One has న or ణ | Other must contain ఙ |
| 10 | **బిందు యతులు** | One starts with ం | ం+consonant matched against nasal of that consonant's వర్గ (ంక↔ఙ, ంచ↔ఞ, ంట↔ణ, ంత↔న, ంప↔మ). Also: అనుస్వార సంబంధ యతులు, అనునాసికాక్షర యతులు, మువర్ణ విరామం |
| 11 | **Finish group confirmation** | Steps 6-10 matched | **Required second check** — see Phase 2 below |
| 12 | **మువిభక్తియతి / ముకారయతి** | One is మ+{ు,ూ,ొ,ో} | Other must be {ప,ఫ,భ,బ,మ}+{ు,ూ,ొ,ో} |
| 13 | **అంత్యోష్మ సంధి కళులు** | One contains హ | Other has a specific aspirate conjunct (క్ఖ, గ్ఘ, చ్ఛ, etc.) |
| 14 | **SoundexSandhi** | Flag enabled on engine | Match FinishGroups only (no consonant check) |

**Input Preprocessing:** Before matching, the engine replaces variant ై with normalized form and ఽ (avagraha) with అ.

#### Phase 2: Finish Group Confirmation

After a consonant match (steps 6-10), the engine **also checks** that the vowel markings are compatible. This is the most common cause of unexpected యతి failures.

| Finish Group | Members | Compatible with no-finish? |
|-------------|---------|---------------------------|
| **అ-group** | ా, ై, ౌ, ం | Yes — no finish defaults to అ-group |
| **ఇ-group** | ి, ీ, ృ, ౄ, ె, ే | No |
| **ఉ-group** | ు, ూ, ొ, ో | No |

**Rules:**
- If neither side has a finish → match (both are అ-group by default)
- If one side has no finish, the other must be in the **అ-group** (ా, ై, ౌ, ం)
- If both have finishes, they must be in the **same group**

### Consonant Groups (ConsoGroups)

All 18 groups accepted by the engine for yati matching:

| Group Name | Letters | Notes |
|-----------|---------|-------|
| **క-వర్గ** | క, ఖ, గ, ఘ | Standard వర్గ |
| **చ-వర్గ** | చ, ఛ, జ, ఝ | Standard వర్గ |
| **ట-వర్గ** | ట, ఠ, డ, ఢ | Standard వర్గ |
| **త-వర్గ** | త, థ, ద, ధ | Standard వర్గ |
| **ప-వర్గ** | ప, ఫ, బ, భ | Standard వర్గ |
| **ఋజు యతులు** | య, హ | Also part of ప్రత్యేక యతి with అ |
| **ఏకతరయతులు** | ర, ఱ | |
| **అభేద విరతులు** | వ-బ, ల-ళ, ల-డ | Cross-వర్గ pairs |
| **అభేద వర్గ విరతులు** | ప-వ, ఫ-వ, బ-వ, భ-వ | ప-వర్గ ↔ వ |
| **ఊష్మ విశ్రాంతులు** | శ, ష, స | Sibilants are interchangeable |
| **సరసయతి** | చ-ఛ-జ-ఝ-శ-ష-స | చ-వర్గ + sibilants combined |
| **సరసయతి** | న, ణ | Nasals across వర్గs |
| **Special** | ల, ళ, డ, ర | Extended lateral/retroflex group |

> **Note:** The standard 5 వర్గ groups do **not** include the 5th letter (nasal): ఙ, ఞ, ణ, న, మ are handled separately via బిందు యతులు and other special rules. This differs from classical prosody where the nasal is part of the వర్గ.

### Vowel/Finish Groups (VowelAndFinishGroups)

Used for స్వరప్రధానవళి matching (checked before consonants):

| Group | Vowels | Finishes |
|-------|--------|----------|
| **అ-group** | అ, ఆ, ఐ, ఔ | ా, ై, ౌ |
| **ఇ-group** | ఇ, ఈ, ఋ, ౠ, ఎ, ఏ | ి, ీ, ృ, ౄ, ె, ే |
| **ఉ-group** | ఉ, ఊ, ఒ, ఓ | ు, ూ, ొ, ో |

---

## 4. ప్రాస (Prasa) Matching

ప్రాస is the **2nd akshar** (syllable) of each line. All lines must share the same consonant at this position.

### What the Engine Extracts

- `Prasa.Value` — the akshar string at position 2
- `Prasa.Poorva` — the 1st akshar string (context for special rules)
- `Prasa.Symbol` — guru/laghu weight of the 1st akshar

Line 1's prasa is compared against all other lines. All must match.

### Matching Algorithm (`IsPrasaMatched3`)

The engine calls `IsPrasaMatched(s1, s2)` first, then falls back to `IsPrasaMatched2(P1, P2)` if that fails.

#### Step 1: Basic Consonant Match (`IsPrasaMatched`)

1. **Vowel bypass** — If either prasa akshar is a pure vowel, match succeeds
2. **Extract consonants** — If multi-akshar (conjunct), use only the first akshar's consonants
3. **Same consonant count** — Compare using PrasaGroups (see below)
4. **Different consonant count** — **సంయుతాసంయుత ప్రాసము**: If one has 2 consonants and the 2nd is ల or ర, drop it and retry
5. **శాంతిప్రాసము** (only if `AllowSantiPrasa=true`) — First OR last consonant matches

### Prasa Consonant Groups (PrasaGroups)

These are **different from** the yati ConsoGroups — prasa uses individual pairs, not full వర్గ groups.

| Group Name | Letters | Type |
|-----------|---------|------|
| ప్రాసవైరము | ఱ, ర | |
| ప్రాది ప్రాసము | న, ణ | |
| శ-ప్రాసము | స, ష, శ | |
| అభేద ప్రాస | ల, ళ, డ, ర | |
| అభేద ప్రాస | ప, వ | |
| వికల్ప ప్రాస | గ-ఙ, జ-ఞ, డ-ణ, ద-న, బ-మ | 5 pairs |
| అప్రశస్త ప్రాస | ద, డ | |
| స్వవర్గజ ప్రాసము | క-గ, ఖ-ఘ, గ-ఘ, చ-జ, ఛ-ఝ, జ-ఝ, ట-డ, ఠ-ఢ, డ-ఢ, త-ద, థ-ధ, ద-ధ, ప-బ, ఫ-భ, బ-భ | 15 pairs |

Special: **వలపలిగిలక ప్రాస** — ర+X+X ↔ X+X pattern (e.g., ర్జ ↔ జ్జ)

#### Step 2: Poorva-Aware Match (`IsPrasaMatched2`)

If Step 1 fails, checks using the 1st akshar (Poorva) context:

| Rule | Condition | Match |
|------|-----------|-------|
| **వికల్ప ప్రాస** | ం+హ on one side | హ+వ on other |
| **అనునాసిక ప్రాసము** | ం+న or ం+మ on one side | న+న or మ+మ on other |
| **ప్రాసమైత్రి ప్రాస** | ం+బ on one side | మ+మ on other; or ం+బ ↔ ం+మ |
| **బిందు ప్రాసము** | న+consonant on one side | ం+same consonant on other |

#### Step 3: Poorva Validation (`CheckPrasaPoorva2`)

After consonant matching succeeds, the engine validates the 1st akshar context:

| Rule | Condition | Requirement |
|------|-----------|-------------|
| **బిందుపూర్వక ప్రాసము** | Line 1's Poorva ends with ం | ALL lines' Poorva must end with ం |
| **విసర్గపూర్వక ప్రాసము** | Line 1's Poorva ends with ః | ALL lines' Poorva must end with ః |
| **Symbol matching** | Line 1's 1st akshar is guru (not laghu) | ALL lines' 1st akshar must have same guru/laghu weight |

---

## 5. Meter-Specific Constraints

These constraints are NOT always obvious from the basic description but the validation engine WILL check them:

| Constraint | Applies To | What It Means | Validation Error |
|------------|-----------|---------------|-----------------|
| **OddNonJa** | కందం, other జాతి | Odd-positioned గణాలు (1st, 3rd, 5th) must NOT be జ (`\|U\|`) | `OddNonJa` |
| **Sixth rule** | కందం even lines | The 3rd గణం in even lines must be జ or నల only | `Sixth` |
| **GCount** | All meters | Each line must have exactly the specified number of గణాలు | `GCount` |
| **Weight** | జాతి meters | Each గణం must have exactly the specified matra count (typically 4) | `Weight` |
| **Character count** | వృత్తం meters | Each line must have exactly N syllables (e.g., 20 for ఉత్పలమాల) | `Weight` / `GCount` |

---

## 6. Validation Error Reference

| Error Type | Meaning | Fix Strategy |
|------------|---------|-------------|
| `Weight` | A గణం has wrong matra count | Add/remove syllables, swap guru↔laghu words, or shift a word to an adjacent group |
| `Yati` | Letter at యతి position doesn't match line start | Check **two things**: (1) consonants in same group? (2) vowel/finish in same FinishGroup? Most failures are finish-group mismatches (e.g., కి↔గు fails because ి and ు are different groups — fix: కి↔గి) |
| `OddNonJa` | Odd-positioned గణం is జ (`\|U\|`) | Rearrange so it becomes భ (`U\|\|`), స (`\|\|U`), నల (`\|\|\|\|`), or గగ (`UU`) |
| `Sixth` | Even-line 3rd group isn't జ or నల | Force that group to be `\|U\|` or `\|\|\|\|` |
| `GCount` | Wrong number of groups in the line | Line is too long or short — add/remove matras |
| `Prasa` | 2nd syllable consonant doesn't match | Change the starting word of the offending line |

---

## 7. Tool Reference

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `list_rules` | Browse all available meters | Phase 1: choosing a chandam |
| `get_rule_info` | Detailed meter rules and pattern | Phase 1 & 3: understanding meters |
| `get_examples` | Classical example poems | Phase 3: studying the form |
| `get_word_meaning` | Telugu dictionary lookup (multi-source) | Phase 2: word exploration (sparse use) |
| `try_match_chandam` | Validate poem against a specific meter | Phase 5 & 6: scoring and iteration |
| `determine_chandam` | Auto-detect the meter of a poem | Ad-hoc: if meter is unknown |
| `calculate_scores` | Score against all meters (ranked) | Ad-hoc: exploring best-fit meters |

**Important:** `get_word_meaning` queries external sources. It is **rate-limited and expensive**. Use only when you genuinely need to explore a word's meaning or find alternatives.

---

# Part II: Workflow

Step-by-step process for composing a Telugu padyam. Each phase references the Knowledge section above for detailed rules.

---

## Phase 1: Brainstorm

**Goal:** Understand the theme and intent, explore ideas, and pick a target chandam.

1. Discuss the **theme** — What is the poem about? What emotion or message should it carry?
2. Explore **narrative ideas** — What imagery, metaphors, or story arc will the poem use?
3. **Select a target chandam** (meter) that suits the theme and tone.
4. **Run a feasibility check** — Before committing, verify that the chosen meter can accommodate your key theme words.

### Meter-Theme Feasibility Check

After selecting a candidate meter, run `get_rule_info` and check whether your most important theme words can physically fit. This catches showstopper conflicts *before* you invest in constraint design.

**Process:**
1. Identify the meter's guru/laghu pattern and note which positions allow guru syllables.
2. For each key theme word, compute its guru positions (long vowels, anusvara, conjuncts).
3. Check: can each word's guru syllables land on the meter's guru-allowed positions?

**Red flags that require action:**
- A word has a guru syllable that cannot land on ANY guru-allowed position → shorten it, find a synonym, or change the meter.
- The meter is **laghu-dominant** (>70% laghu) → most Sanskrit-origin and long-vowel Telugu words won't fit in the laghu zone. Build a **laghu word bank** (Phase 2) and accept that some words may need shortened forms.
- The meter is **guru-dominant** → short, common Telugu particles and verb forms may not fit.

If the feasibility check fails and no adaptation is acceptable, return to step 3 and pick a different meter **now**.

### Output
- A clear theme statement
- 2-3 candidate meters with brief rationale
- One selected chandam to proceed with

---

## Phase 2: Plan

**Goal:** Lock the high-level idea and build a vocabulary palette.

1. **Finalize the core idea** — Write a one-line summary of what each line/section will convey.
2. **Identify key words** — List the essential words that carry the poem's meaning.
3. **Explore alternatives** — Use `get_word_meaning` to find synonyms, related forms, or verify meanings.

### For Laghu-Dominant Meters: Build a Laghu Word Bank

If the meter has >70% laghu positions, build a dedicated bank of all-laghu words relevant to your theme before proceeding.

**What qualifies as all-laghu:** Every syllable has a short vowel (అ, ఇ, ఉ, ఋ), no anusvara, no visarga, and no following conjunct consonant.

Words with guru syllables can only be placed where their guru syllable lands on one of the meter's guru-allowed positions. Pre-plan these placements.

### Output
- A structured outline (what each line will say)
- A vocabulary palette of candidate words with syllable counts
- (If laghu-dominant meter) A laghu word bank

---

## Phase 2B: Design Constraints

**Goal:** Make the structural decisions that constrain every line — ప్రాస, యతి anchors, and word-to-group alignment — BEFORE drafting.

These are the highest-leverage decisions in padyam writing. Getting them wrong costs multiple iteration rounds; getting them right makes drafting almost mechanical.

> **Prerequisite:** You must deeply understand the meter's structure before designing constraints. Run `get_rule_info(rule_identifier="...", include_examples=true)` and `get_examples(...)` first. You need the exact gaNA pattern, యతి position, and meter-specific rules (like OddNonJa for కందం).

### Step 1: Choose the ప్రాస Consonant

The 2nd syllable of every line must share the same consonant. This must be a deliberate upfront choice.

**Process:**
1. List the key words from your vocabulary palette.
2. For each word, note its 2nd syllable's consonant.
3. Identify which consonant gives the most line-starting options across all 4 lines.
4. Verify: can you find at least 4 natural line-starters using this consonant?

**Output:** One confirmed ప్రాస consonant with 4+ viable line-starter words.

### Step 2: Plan యతి Anchors

Failing to plan for యతి is the #1 cause of iteration waste.

**2a: Identify యతి requirements** — Use `get_rule_info` to find the exact యతి position for your meter. See [Knowledge > యతి Matching > Yati Types by Meter](#yati-types-by-meter) for the lookup table.

**2b: Understand compatibility** — The engine uses two-phase matching. See [Knowledge > యతి Matching](#3-యతి-yati-matching) for the full algorithm. Key points for planning:
- **Safest:** Exact same consonant + same vowel group (e.g., క↔కా, స↔సా)
- **Reliable:** Same వర్గ + same finish group (e.g., క↔గా — both క-వర్గ, both అ-group finish)
- **Extended:** Cross-వర్గ groups the engine accepts (వ↔బ, ల↔ళ, శ↔స, న↔ణ, etc.)
- **Special:** ప్రత్యేక యతి (య/హ ↔ అ), బిందు యతులు (ం-based)
- **Critical:** Consonant match alone is NOT enough — the finish groups must also match

**2c: Build anchor pairs** — For each line with యతి, plan the line-start letter and the యతి-position letter. Verify both consonant AND finish group compatibility.

**2d: Pre-check feasibility** — Sketch rough line shapes. If you can't imagine words fitting, revisit Step 1 or Phase 1 **now**.

### Step 3: Analyze Word-to-Group Alignment

Key vocabulary must fit within or across the meter's group boundaries.

**Process:**
1. For each key word, compute the guru/laghu breakdown (see [Knowledge > Syllable Basics](#1-syllable-basics-guru-and-laghu)).
2. Check the total matra count against your meter's group size.
3. For words that don't fit a single group, find where they can span across two groups cleanly. Verify the split creates valid group types.
4. Flag problem words that can't be placed. Find alternatives.

### Step 3B: Theme Word Feasibility Check

For each theme word with guru syllables, verify it can fit somewhere in the line.

**Adaptation strategies:**

| Adaptation | When to Use |
|-----------|-------------|
| **Shorten** | Drop a long vowel to make it laghu |
| **Synonym** | Replace with an all-laghu word of similar meaning |
| **Split across lines** | Enjambment — end one line with first half, start next with rest |
| **Change the meter** | If the word is essential and no adaptation works |

Document every adaptation — these become "Deviations & Notes" in the final result.

### Step 4: Compile the Constraint Sheet

Write a single reference capturing all design decisions: chandam, ప్రాస consonant, line starters, per-line constraints (group count, యతి pairs, meter-specific rules), and key word placements.

### Output
- Confirmed ప్రాస consonant with line-starter words
- యతి anchor pairs for each line that requires యతి
- Word-group alignment analysis for all key vocabulary
- A complete constraint sheet ready for drafting

---

## Phase 3: Understand the Chandam Rules

**Goal:** Deeply understand the chosen meter's structure and extract ALL constraints.

> **Phase ordering note:** This phase and Phase 2B are interdependent. In practice, do an initial pass of Phase 3 (get rule info + examples) before Phase 2B, then return here to verify your constraint decisions.

1. **Study the rule definition** — gaNA pattern, line count, syllables per line.
2. **Verify yati and prasa** — Confirm Phase 2B decisions match the rule definition.
3. **Extract meter-specific constraints** — See [Knowledge > Meter-Specific Constraints](#5-meter-specific-constraints).
4. **Read classical examples** — Study how master poets handled yati transitions and ప్రాస placement.

### Output
- A cheat sheet: gaNA pattern, line structure, yati position, prasa rule
- Meter-specific constraints added to the constraint sheet
- 2-3 annotated examples showing how the rules apply in practice

---

## Phase 4: Draft

**Goal:** Compose the first draft of the padyam.

1. **Write line by line**, keeping the gaNA pattern in mind.
2. **Prioritize meaning and flow** — Get the poetry right first; syllable adjustments come next.
3. **Apply yati and prasa** as you write, using the constraint sheet.
4. **Use the vocabulary palette** from Phase 2 to swap words for better metrical fit.

### Guidelines
- **Draft the most constrained lines first:**
  - **కందం / జాతి:** Even lines have యతి + special rules. Draft them first; odd lines are free.
  - **వృత్తం:** ALL lines have యతి, so prioritize lines where యతి + ప్రాస + theme word all intersect.
  - **General rule:** If a line must contain a specific theme word AND satisfy యతి, draft it first.
- **Use the constraint sheet** as your blueprint. Check each group's matra count as you write.
- **Validate early.** After drafting 2 lines, run `try_match_chandam` to catch issues before they compound.
- Mark lines you're unsure about for revision in Phase 6.

### Output
- A full first draft of the padyam

---

## Phase 5: Validate

**Goal:** Check the draft against the target chandam and get a concrete score.

```
try_match_chandam(
  poem_text="<your padyam text>",
  rule_identifier="utpalamaala",
  match_yati=true,
  match_prasa=true
)
```

### What to Review
- **Overall match score** — How closely does the poem follow the meter?
- **Per-line results** — Which lines match and which don't?
- **Yati compliance** — Are pauses at the correct positions?
- **Prasa compliance** — Do the rhyme patterns hold?

### Output
- Match score and detailed per-line breakdown
- A list of lines that need revision, with specific issues noted

---

## Phase 6: Iterate

**Goal:** Revise problem lines and re-validate until the score is strong.

### Process
1. **Classify the error** — Use the [Validation Error Reference](#6-validation-error-reference) to diagnose. Is it incremental (Weight, Yati) or structural (Prasa, GCount)?
2. **For incremental fixes:** Swap words, rearrange phrases, or adjust sandhi.
3. **For structural problems:** Loop back to Phase 2B to change ప్రాస or యతి anchors. Expect temporary score regression.
4. **Re-run validation** after each round of changes.
5. **If score regresses**, revert and try a different approach.
6. **Repeat** for a reasonable number of rounds.

### Stopping Criteria
- **Stop when:** Score is clear and strong (high match percentage, yati and prasa pass).
- **Also stop when:** 3-5 rounds done and further changes would compromise meaning or beauty.
- **Never sacrifice quality for score.** A poem with minor metrical liberty but powerful meaning is better than a metrically perfect but lifeless verse.

### Output
- Revised padyam after each iteration
- Corresponding match scores showing improvement

---

## Phase 7: Final Result

**Goal:** Present the finished padyam with a complete summary.

### Deliverables

1. **The final padyam** — Clean text, properly formatted.
2. **Summary table:**

   | Item | Detail |
   |------|--------|
   | Chandam | Name of the meter used |
   | Language | te / sa / kn / etc. |
   | Match Score | Final percentage |
   | Yati | Pass / Fail (with notes) |
   | Prasa | Pass / Fail (with notes) |
   | Iterations | Number of revision rounds |

3. **Notes on deviations** — If any intentional metrical liberties were taken, explain the poetic justification.
4. **Verdict** — Is the padyam ready, or does it need further expert review?
5. **Learnings** - Critical Learnings

### Save Results

Save each run to **`results/<YYYY-MM-DD>T<HH-MM-SS>.md`** using the current date-time.

```
results/
  2026-03-17T14-30-00.md    <- first attempt
  2026-03-17T15-45-12.md    <- second attempt, different theme
  2026-03-18T09-00-00.md    <- next day
```

Each file should follow this structure:

~~~~markdown
# Padyam Results — {YYYY-MM-DD}T{HH-MM-SS}

## Theme
{One-line theme description}

## Chandam
{Name of the chosen meter}

## Final Padyam
```
{The final poem text}
```

## Design Constraints (from Phase 2B)
| Constraint | Decision |
|------------|----------|
| ప్రాస       | {consonant and line starters} |
| యతి        | {anchor pairs per line} |
| Key words  | {word-group alignment notes} |

## Score Summary
| Item | Detail |
|------|--------|
| Chandam | ... |
| Language | ... |
| Match Score | ... |
| Yati | Pass / Fail (with notes) |
| Prasa | Pass / Fail (with notes) |
| Iterations | ... |

## Iteration History
| Round | Key Changes Made | Score |
|-------|-----------------|-------|
| 1 | Initial draft | ... |
| 2 | Fixed lines X, Y | ... |

## Deviations & Notes
{Any intentional metrical liberties and their justification}

## Verdict
{Final assessment: Ready / Needs expert review}
~~~~



