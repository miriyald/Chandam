# Coding Preferences and Instructions (Future Reference)

This document captures coding preferences and instructions for this project so future work stays consistent.

---

## Architecture

- **N-Layer:** Use standard layers: **Interface → Service → Data Access**, plus **Data Contracts**.
- **No business logic in data access.** Data access only talks to the store (e.g. OpenSearch) and uses contracts/DTOs.
- **Services** orchestrate use cases and depend on data access (prefer interfaces so an API can be added later without changing services).
- **Contracts** hold DTOs and shared types; no dependency on infrastructure (e.g. no OpenSearch in contracts).
- **Reuse and clean coding:** Shared DTOs, single place for domain concepts (e.g. tag contract), avoid duplication of logic.

---

## Simplicity and scope

- **Keep it very simple and stupid (KISS).** Prefer obvious, minimal code over “future-proof” or clever design.
- **Don’t assume complexity or build for future-proofing.** Solve the current problem; avoid speculative features.
- **Less “clean” or over-modularized is acceptable** if it keeps things understandable; code should speak for itself.

---

## Functions and parameters

- **Small functions and classes.** Prefer focused, single-purpose units.
- **Methods should take mandatory parameters.** Avoid optional parameters where possible; pass explicit arguments.
- **Don’t build for optional parameters** unless they are clearly required.


## Configuration and organization

- **Use `.env`** for secrets and connection settings (OpenSearch, LLM). Do not hardcode credentials.
- All Constants should be driven by constants folder.

---
