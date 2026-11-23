# AGENTS.md — Break My API

## Mission and source of truth

Build a polished, **bilingual English/Spanish**, beginner-friendly yet technically credible synthetic API load simulator. Product decisions in `docs/08-DECISIONS-AND-INTERVIEW.md` are **approved**, not provisional. Every phase must satisfy `docs/09-TESTING-AND-ACCEPTANCE.md` and respect the milestone boundaries in `docs/07-IMPLEMENTATION-PLAN.md`.

## Required reading (before coding)

`README.md`, `docs/01-PRODUCT-VISION.md`, `docs/02-REQUIREMENTS.md`, `docs/03-EDUCATIONAL-EXPERIENCE.md`, `docs/04-TERMINOLOGY-AND-CLOUD-MAPPING.md`, `docs/05-SIMULATION-ENGINE.md`, `docs/06-ARCHITECTURE.md`, `docs/07-IMPLEMENTATION-PLAN.md`, `docs/08-DECISIONS-AND-INTERVIEW.md`, `docs/09-TESTING-AND-ACCEPTANCE.md`, `docs/10-LOCALIZATION-AND-DESIGN.md`.

## Non-negotiable guardrails

1. Never generate live load against external or arbitrary APIs. All traffic is synthetic within the browser; no user-supplied target URLs.
2. The simulator engine must be deterministic pure TypeScript, independent of React, browser timers or network access.
3. Charts and KPIs come from model events; no invented CPU %, measurements, throughput, response times or animation counters.
4. Distinguish incoming RPS, concurrency, throughput, queue wait, processing time, p95, cache hit and 429 vs 503. Always label the selected simulation time window.
5. Canonical **Compute Instance** is a documented conceptual abstraction; AWS and Azure mappings are examples, never 1:1 equivalences.
6. **Both English and Spanish are MVP release requirements**. Centralize *all user-visible strings*, tooltips, empty states, ARIA labels, graph summaries, glossary, tour text, and scale explanations in typed dictionaries from day one. No English-only UI with a decorative language toggle.
7. Two explanation depths, **Simple / Technical**, must describe the *same system/model* rather than run two separate simulations.
8. Target a friendly, educational **minimalist** look: clear hierarchy, warm light surfaces, restrained accents, legible charts; no clutter, gimmick effects or aggressive dark hacker aesthetic.
9. **Autoscaling is in the MVP** but **only implemented in P1.4**: one transparent bounded scaling policy with provisioning delay/cooldown and safe scale-in; never model CPU metrics or suggest production fidelity.
10. Build ONLY the requested milestone; no auth, database, analytics, AI tutor, real targets, microservices, cloud resources or framework overengineering.
11. Accessible semantics, full keyboard use, chart text alternatives, non-color status descriptions, responsive mobile and `prefers-reduced-motion`.
12. Strict types, clearly documented assumptions, deterministic tests, memory-bounded history; no fake interactive controls.
13. When implementation reveals a needed clarification, document the chosen safe assumption and its rationale; preserve the approved product decisions.
14. For each milestone, run typecheck, lint, tests and build, and report actual results (including failures).
15. **Do not commit, push, deploy, configure remote services or create credentials** without user instruction.

## Phase-1 work protocol

Before code: summarize current milestone, likely files, assumptions. After code: enumerate changed paths, evidence of validations, remaining limits, and exact next milestone. Provide brief, copy-paste next-step prompt if appropriate. Do not implement the whole product in one run.

## Implementation conventions

- React/Vite shell; engine code under `src/engine/`; i18n resources under `src/i18n/`; separate engine state vs React render state.
- Prefer straightforward CSS or CSS Modules, React hooks and a small controller; avoid Redux/state-heavy stacks.
- One event-accounting model; all visual states derive from its snapshots and events.
- Bilingual copy is paired and reviewed even for placeholder content; avoid unlocalized UI during development.
- Approved autoscaling policy has a fixed set of constants in MVP; **do not add an advanced autoscaling configuration panel**.
