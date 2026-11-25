# Break My API — UI redesign brief (review before coding)

## Product goal

A bilingual interactive **API performance laboratory** with a clear separation between experimenting and learning. The simulator has a proven deterministic engine. The redesign must make cause-and-effect understandable without replacing the engine, reintroducing invented telemetry or adding unnecessary dependencies.

## App structure (existing)

- Playground (`/` and `/playground`)
- Learn (`/learn`), Fundamentals, HTTP Status Explorer, Glossary
- About (`/about`)
- Language switch (EN/ES), Simple/Technical educational depth
- Four presets: Healthy, Traffic Spike, Cache Rescue, Auto Scale Recovery
- Existing help popovers, guided tour, insights, charts and autoscaling state

**Do not remove or hide** any approved learning functionality. Review how current route state persists without remounting the engine.

## Layout hypothesis — Playground, desktop >= ~1100px

- Header/nav: lean product identity; primary sections Playground / Learn / About; language + explanation-depth selectors accessible.
- Left ~240–300px (responsive) **Experiment Configuration**: scenario first, core parameters grouped by traffic, compute, resilience; +/- and sliders where useful; switches for cache, limiter and auto scaling. Keep contextual help (?) beside labels.
- Center flexible workspace: **prominent request lifecycle visualization** (P1.5.2, not implemented during discovery), Start/Pause/Reset, scenario status.
- Near center/top: a small set of **meaningful KPIs** with measurement windows and units. Distinguish 200, 429, 503 and pending vs active scaling.
- Below: a compact set of charts (throughput/outcomes, FIFO queue), with text/table alternatives and measured p95.
- Insight panel can be adjacent to or below flow; avoid competing with chart and controls above the fold.
- Use a simple responsive grid rather than two persistent heavy sidebars or a full-blown editor.

## Layout hypothesis — Learn

- Card-based landing inspired by the way Uxcel exposes learning categories, not by its exact visuals.
- Fundamentals: concise concept/article cards with examples and links into Playground that do not mutate simulation automatically.
- HTTP Explorer: family chips, accessible search, condensed code list, detail panel and shareable code-specific URL; don't turn it into 58 full-width lessons.
- Glossary: accessible search + expandable concise definition; Simple/Technical variant and links back to relevant controls; avoid duplicated content sources.
- About: readable technical disclosure of synthetic limitations, security scope and README/GitHub link, when already configured.

## Future P1.5.2 visualizer design requirements

- Depict **actual engine stages only**: arrivals -> rate limiter (429 path) -> eligible GET cache (200 bypass) -> origin admission / waiting FIFO -> origin processing (200), and overflow 503. Autoscaling adds abstract capacity *after provisioning*.
- No decorative database stage, no fake gateway and no misleading 1-particle-per-request animations.
- Prefer nodes with active gauges and engine-derived per-window counts; movement is sparse and labeled aggregate/illustrative unless genuine event records are present.
- Healthy: little waiting. Spike: queue/503. Cache Rescue: bypass. Auto Scale Recovery: pending then ready.
- Nodes allow help without changing simulator state, with links to Learn/status codes.
- Reduced-motion/paused states are understandable without animation.

## Candidate reusable tokens / primitives

- App navigation; nav active states; card; metric card; labeled control; info popover; segmented filter; chip; status badge (with text); empty state; code example; concept card; chart frame; request stage node.
- Define tokens in existing CSS architecture, rather than migrating to Tailwind/shadcn reflexively.
- The 3 screenshots are **sources of ideas**, not templates to reproduce.

## Review criteria before implementation

1. Clear above-the-fold hierarchy: scenario, action, status, visualizer, top KPIs.
2. Beginner can identify where to press Start and why an overload happened.
3. Engineer can locate exact measurement windows, reset, p95, cache and scaling assumptions.
4. No forced horizontal scroll on 390px; no crowded controls, cut-off Spanish labels or unreadable SVG text.
5. Existing chart text alternatives, focus states, popovers and reduced-motion behavior remain.
6. EN/ES copy and Simple/Technical depth work without triggering engine changes.
7. All existing simulation integration tests and deterministic outcomes remain untouched.
8. No dependency churn, big component library, auth, database or new backend.

## Proposed implementation order after design approval

1. Approve `DESIGN_SYSTEM.md` and `UI_REDESIGN_PLAN.md` produced by Codex.
2. Implement design tokens, shared primitives, and one validated Playground shell/layout, **no engine change**.
3. Apply approved visual language to Learn, status catalog, glossary, About; verify localized mobile layouts.
4. Implement true P1.5.2 Request Flow diagram on the newly established layout.
5. Run final P1.6 QA, live preview/deep-link tests, accessibility and release prep.

**Do not implement these steps during discovery.**
