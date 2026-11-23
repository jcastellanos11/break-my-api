# 07 — Phase 1 roadmap (approved scope, incremental delivery)

## Method

Short, reviewable milestones; **only** work on the requested milestone. At each handoff run typecheck, lint, tests and build, summarize changed files and evidence, identify limitations and stop. No autonomous commits/deployment.

## Phase 0 — Completed

- Approved Q1=C, Q2=B, Q3=A, Q4=A, Q5=B, Q6=B (with minimalism), Q7=C on 2026-11-23.
- Bilingual English/Spanish (EN/ES) and autoscaling are **must-haves** in finished MVP, not stretch features.
- Agreed safe model, vendor-neutral terms, visual direction, milestones and test gates.

## Phase 1 — Six tightly scoped milestones

### P1.1 — App foundation + bilingual minimal educational shell

- Initialize Vite, React, strict TypeScript, CSS/design tokens, lint, Vitest, Testing Library.
- Responsive light/friendly shell: welcome, nav, Start Experiment, simulation disclaimer, basic labeled placeholder slots.
- Typed `en`/`es` resources, actual working language selector; localize current shell/ARIA labels.
- **Do not** implement charts or the guided tour yet. Acceptance: shell appears professional on phone/desktop, language switch works, check commands pass.

### P1.2 — Core pure deterministic engine

- Config, presets, seeded arrivals, scheduled completions, concurrency slots, FIFO queue, cache/429/503, metrics including measured p95, bounded history and state conservation.
- Make active capacity safe to change without cancelling requests, as precondition for P1.4.
- Unit tests for model invariants, deterministic replay, rate-limit/cache, capacity and presets.
- **Do not implement autoscaling policy here**. Acceptance: engine tests pass; no invented numbers.

### P1.3 — Working Playground, metrics and charts

- Start/pause/reset, scenario presets, all base controls, metrics, queue visualization, incoming/completed/429/503 charts and p95.
- Every displayed control is functional; no fake UI; screens bilingual and responsive.
- Real snapshots drive the view and contextual status; no new engine algorithm except bug fixes.
- Acceptance: Healthy, Traffic Spike and Cache Rescue reproducible; changing language does not reset state.

### P1.4 — Simple bounded autoscaling

- Add the approved **queue/503-driven**, sustained-delay + cooldown + max/min policy in `docs/05-SIMULATION-ENGINE.md`.
- One toggle, active/pending instance display, 4th preset “Auto Scale Recovery”, event explanations in EN/ES.
- Unit tests for decision windows, delayed provisioning, max cap, idle scale-in, pause/reset, in-flight safety, determinism.
- Acceptance: visible *waiting* before added capacity, never retroactive completion; no fictitious CPU %.

### P1.5 — Educational experience + explanation depth

- 3-step Guided Tour with real model interactions and back/skip/revisit.
- Contextual “Why?” engine-derived cards, glossary, sample request/response; full EN/ES translations.
- Simple/Technical explanation switch, no duplication of simulation state; content matches policy assumptions.
- Acceptance: beginner can complete tour, engineer can inspect precise terms, all interactive learning surfaces accessible and translated.

### P1.6 — QA, polish and publish

- Mobile layout, reduced-motion, accessible controls/charts, error/empty states, deterministic smoke tests.
- Full translation parity checks, anti-overflow graphs, bounded performance at 500 RPS, clean README with annotated model caveats.
- Static Cloudflare Pages config, manual smoke, confirm publish only when user requests it.
- Acceptance: all Must requirements FR-01..FR-18, command checks green, real mobile+desktop verification documented.

## Scope control / non-goals

Do NOT add: actual load generation, arbitrary target APIs, AWS/Azure credential integration, full cloud simulations, backend, database, login, leaderboard, quizzes/course portal, AI tutor, production metrics, complex autoscale rules or policy UI, API key handling, admin tools, persistence/exports, request retry storms.

If schedule becomes tight, trim **visual decoration and optional charts**, not test correctness, bilingual release, the 3-step learning path or approved simple autoscaling. The features should remain modest; a narrow complete product is better than a broad half-working one.

## Definition of done / portfolio story

The user can teach themselves how requests are processed, induce overload and use cache, rate limiting, and bounded autoscaling. An engineer can inspect reproducible metrics and model assumptions. The repo demonstrates localization, accessible UX, deterministic modeling and sound tests, while remaining trivially deployable as a static site.
