# 08 — Interview results and accepted decision log

**Interview closed:** 2026-11-23. Answers captured exactly from product owner. These decisions **override older v0.1 defaults**. No further confirmation needed before starting P1.1/P1.2.

## Seven approved answers

| # | User answer | Interpretation / accepted outcome |
|---|---|---|
| Q1 | **C** | Beginners and experienced developers have equal priority. |
| Q2 | **B** | English and Spanish from MVP launch. |
| Q3 | **A** | Three-step guided tour plus inline contextual explanations. |
| Q4 | **A** | Fully synthetic browser-only simulation; no traffic sent to real targets. |
| Q5 | **B** | Queue, cache, rate limit, capacity and **autoscaling included in first release**. |
| Q6 | **B + minimalism** | Friendly colorful educational design with minimalist layout/visual restraint. |
| Q7 | **C** | Equal emphasis on educational benefit and portfolio engineering credibility. |

## Product decisions (approved)

| Decision ID | Choice | Status | Notes |
|---|---|---|---|
| D-001 | Browser-only, seeded synthetic simulation | Approved | No backend or arbitrary network target. |
| D-002 | Vendor-neutral domain labels + qualified cloud mapping | Approved | Cloud analogies are not 1:1 equivalences. |
| D-003 | Compute Instance + Concurrency Slots | Approved | Explicit abstract units, not cloud-worker synonym. |
| D-004 | **English and Spanish together** | Approved | Full interactive UI, tour, glossary, status, ARIA text. |
| D-005 | Equal beginner and engineer priority | Approved | **Simple/Technical** content depth, same model. |
| D-006 | Three-step tour and rule-driven “Why?” | Approved | Education integrated into playground, not a course site. |
| D-007 | Rate limiter before cache **in this model** | Approved | Not claimed universal network order. |
| D-008 | Cache only on eligible GET requests | Approved | Avoid blanket caching claims. |
| D-009 | HTTP 429 limiter / 503 queue overflow | Approved | No unmodeled 504. |
| D-010 | **Bounded, simplified autoscaling in MVP** | Approved | Implement P1.4 after engine/controls; fixed policy, delay, cooldown, safe scale-in. |
| D-011 | Incremental Codex runs with test gates | Approved | First run P1.1 + P1.2, stop afterward. |
| D-012 | Friendly educational + minimalist design | Approved | Light foundation, restrained accents and animation. |
| D-013 | Four meaningful presets | Approved | Healthy, Spike, Cache Rescue, Auto Scale Recovery. |
| D-014 | No advanced policy configurator | Approved | Limit complexity; fixed values explained, no provider cloning. |

## Clarifications resolved as low-risk design defaults

These are implementation details, **not unanswered user questions**:

- EN and ES share one simulation state, with a switch at any time.
- Simple/Technical are explanation depth modes, never distinct simulations.
- MVP autoscaling is **one** queue/503-driven +1/-1 policy; full definition in `docs/05-SIMULATION-ENGINE.md`.
- Interface uses modern light-first style, not dark neon; dark mode can be later if wanted.
- Localhost development and static host, no cloud-resource provisioning required.
- No owner-specified launch date; milestones take precedence over a promised schedule.

## Change protocol

If the product owner changes scope later, update this file, the affected FR IDs, engine assumptions, milestones and Codex prompt **together**. Never silently reintroduce “English only” or “autoscaling v2”.
