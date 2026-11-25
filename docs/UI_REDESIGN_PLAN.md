# UI redesign plan · for approval

The current Playground already has a settings column, charts, contextual insights and a tour. Learn already has three linked destinations. This proposal changes their order and emphasis first. The request-flow diagram belongs to a separate P1.5.2 implementation. Wireframes describe reading order and relationships, not new simulator controls.

## Playground at 1100–1440px

```text
Brand / Playground / Learn / About                    EN | ES   Depth
Playground  [Guided Tour]  [Glossary]            Simulated traffic
Scenario [Traffic Spike ▾]   [Start/Pause/Resume] [Reset]   State · time
Choosing or resetting a scenario restores its defaults and clears history.

Configuration · 240–288px      Last completed simulated second · [start, end)
Traffic                         Arrivals (req/s) | Successful (req/s) | p95 (ms)
  Incoming RPS
Compute and queue               Current capacity
  Instances × slots/unit        Processing / slots | FIFO waiting | active + pending units
  Service time · queue limit
Protection                      Primary workspace
  Cache + configured fraction   First layout: existing traffic/outcomes chart
  Limiter + admission cap       P1.5.2: request flow here; chart moves to History
  Automatic scaling             Why is this happening? [primary observation] [More]
  [Policy and bounds]
                                Since scenario start: 200 | 429 | 503 | cache completions
                                History: remaining charts + accessible data table
                                Scaling events [expand]
```

Keep one tour entry in the title area. Place the optional lesson immediately below the run controls while it is open. An open lesson belongs beside the workspace in document flow; no overlay interrupts Start. Keep one instance of each chart. Before P1.5.2 the existing traffic chart fills the reserved region and the FIFO chart sits in History. After P1.5.2 both charts occupy History. Give pending instances their own label and value; adding them to active capacity would overstate available slots.

## Playground at ~390px

```text
Brand                       EN | ES
Playground   Learn   About      Depth
Playground · Simulated traffic     [Tour]
Scenario [▾]   reset consequence
[Start/Pause/Resume] [Reset]   State · time
[Guided Tour]   Last completed second [bounds]
  Arrivals       Successful completions
  Observed p95   [unit or Sin datos]
[Configure experiment ▾]  current scenario summary
Now: processing/slots · FIFO waiting · active/pending
Primary workspace: chart now / labeled flow later
Why this happened [More]     [Glossary]
Since start: 200 / 429 / 503 / cache completions
History: charts · [Read chart data]
Scaling events [expand]
```

On the phone, open configuration inline between the readings and current capacity. Expanding it temporarily increases the distance to the chart. Keep the values mounted and preserve focus when a group opens. The tour’s link to capacity must expand the correct group before focusing it. At tablet widths use the same disclosure pattern with a wider three-value strip and optional side-by-side charts when their labels fit. At ≥64rem open the configuration column. At 1440px cap the shell width and give remaining space to the workspace. Avoid separate desktop/mobile controllers or duplicate hidden forms. Use logical DOM groups and verify focus order after any grid placement.

## Learn and reference layouts

| Screen | Desktop reading order | Phone reading order |
|---|---|---|
| Learn landing | H1 + invitation → three cards in a row: follow a request / find a code / define a term. Each has a small original motif, native link and one-sentence description. | Same three anchors in a stack. Use a compact motif beside each title. Keep the verb and description in view. |
| Fundamentals | Learn subnav → H1 and short outline → reading column. First example: client → fictional GET and endpoint → response. Continue with arrivals/completions, protection and code families. End with explicit Open Playground. | Subnav wraps. Heading → single example → short explanation → next concept. Code wraps. Retain the final link without applying a preset. |
| Glossary | Subnav → search and depth → alphabetic term rows → selected definition inline, with relevant status link. | Search first, depth on the next line when needed. Native disclosures keep browsing short. Maintain the open term under language changes. |
| About | Title → purpose and synthetic scope → compact “Model assumptions” section → existing repository link. | Same short reading order, one column. |

### HTTP Status Explorer

```text
Desktop
Learn subnav → HTTP Status Codes → curated coverage and verification date
[Search code, name or keyword]   (All) (1xx) (2xx) (3xx) (4xx) (5xx)
Matching results                     Selected detail · ?code=503
  500  localized title                503 · localized title / canonical English
  501  localized title                Family · Simulated in Playground
  503  localized title [selected]     Simple meaning → technical meaning → example
                                      Usage note where relevant → related codes → sources

Phone, browsing                     Phone, after explicitly selecting a result
Title · search                      [Back to results] → focused code heading
Wrapping family choices             Family · simulated/reference indicator
Count + compact result rows         Meaning → technical note → illustrative example
                                    Related code links → official source
```

Keep the filters within reach on desktop. Typing filters rows only. If the selected code is outside the filter, label it as the open detail; offer a way back to the current results. Empty results retain the query and a clear-filters action. On phones, a direct URL opens the detail first, with a safe return to the full catalog even when there is no earlier app history. Returning locally restores query, family and focus to the selected result if visible, otherwise to the search field. Browser Back/Forward remains native. Only 200, 429 and 503 get the engine badge. Existing 418 wording, coverage limits and external references carry through.

## P1.5.2 only · future request flow

```text
Synthetic GET arrivals → enabled token bucket ── no token → HTTP 429
                                  │ admitted / limiter off
                                  ▼
                         Eligible GET cache ── hit → pending cache response → HTTP 200
                                  │ miss / cache off
                                  ▼
                         Origin admission ── free slot → processing ── completes → HTTP 200
                                  │                          ▲
                                  ├─ busy + space → FIFO ────┘ when a slot opens
                                  └─ busy + full (including queue limit 0) → HTTP 503

Capacity annotation beside processing: active units × slots/unit; pending units separate.
```

Use `snapshot.waiting`, `processing` and `cachePending` for instantaneous gauges. Use the latest completed bucket for arrivals, 429/503 and completed 200; `completedCacheHits` is a subset of those successes. `cacheHits` measures lookup decisions. A request can hit in one window and complete in the next. Label edge counts by event and interval; counts drawn from different windows need not balance within a single displayed second. Use the bounded event tail only for observed samples, never to reconstruct totals. During manual capacity drain, the effective slot gauge and admission limit can differ. Let the engine decide admissions.

Pending scale-out contributes zero usable capacity. Two sustained pressure evaluations may schedule one unit, then a 2s provisioning delay precedes activation. Read pending, active, bounds and actual scale events from the model. On phones show the same branches as an ordered list with indented outcomes; keyboard selection opens an explanation. Prefer a brief highlight of an observed aggregate change. Pause freezes all flow motion, and reduced motion uses static values. Publish from the existing 250ms controller only.

## Delivery sequence after approval

Effort is relative: S is a local styling or copy change, M spans components and responsive states, L spans model interpretation, rendering and accessibility. Each slice should be independently reviewable and reversible.

| Order / priority / effort | Surfaces and deliverable | Proof and regression risk |
|---|---|---|
| 1 · High · M | Add role-based aliases in `src/styles/global.css`. Scope nav, focus, buttons and measurement styles in `App.tsx`, `Playground.tsx` and `Plots.tsx`. Deliver the run bar and compact window strip together. | Compare initial/one-second/pause states in both locales. Screen-read each value with its period and unit. Keep the 3 metric periods, p95 empty state, chart dashes and text table. Avoid broad selector changes that alter the welcome hero or Learn. |
| 2 · High · M | Reorder Playground workspace and group settings. Adapt `Learning.tsx` and `Help.tsx` placement. Reuse `useSimulation`, existing anchors and shared depth preference. | Keyboard from scenario through help to chart table at 390px, 1100px and zoom. Exercise tour links with controls folded, Escape and focus return. Pause with nonempty queue and pending scale-out; change route, depth and language, then resume. A remount would lose the pending launch. |
| 3 · Medium · M | Apply the reading and card patterns to `LearnCenter.tsx`, glossary and About; pair copy via `src/i18n/en.ts` and `es.ts`. Then deliver the explorer filter/list/detail split, preserving `navigation.ts` and the typed catalog contract. | Exercise all 20 terms at both depths, accent-insensitive search, family choice, empty results, shared 503 URL, related code, metric links and Back/Forward. Check ES at phone width. Risk: losing search position or confusing a displayed reference with a simulated outcome. |
| 4 · High when separately approved · L | Implement P1.5.2 as a presentation component under `src/app/` consuming the existing model/snapshot. Replace the primary chart placement with the flow and move the chart to History. Reuse glossary keys, outcome tokens and sources. | Healthy: direct processing. Traffic Spike: actual waiting and 503. Cache Rescue: bypass, delayed completions and possible remaining overflow. Auto Scale Recovery: pending then active. Add limiter-on case for 429. Test 500 RPS, bounded DOM/history, replay, hidden tab, reduced motion and pause. No second clock. |
| Later · P1.6 | Perform release QA under its own approval. | Hosted deep-link refresh, real devices, screen readers, zoom/reflow and full bilingual scenario walkthrough. |

Retain **all 83 existing tests and their assertions**, including engine conservation, deterministic replay, scaling bounds and cleanup. Add targeted behavior tests beside `App.test.tsx`, `Learning.test.tsx` and `Modules.test.tsx`. Preserve meaningful labels and identifiers that existing callers depend on. Run typecheck, lint, full tests and production build per implementation slice. Shared CSS and layout changes should produce identical engine histories for the same seed, preset and edits.

**Review decisions:** Approve the green action palette or request the brief’s indigo alternative; choose whether the phone control disclosure starts collapsed; decide whether a code-detail view replaces or follows the phone results. Recommended defaults are green, collapsed, and a focused detail with a return link. Validate the last two through the tasks in the [audit](UX_AUDIT.md) before building the flow.
