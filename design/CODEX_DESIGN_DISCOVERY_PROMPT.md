# Codex — Break My API Design Discovery (no implementation)

Act as a Senior Product Designer, UX Researcher, Interaction Designer, and Frontend Architect.

We want to improve the visual quality and usability of **Break My API** without rebuilding the working app. Current implementation: P1.1 through P1.5.1 complete, including React/TypeScript, deterministic request simulation, four scenarios, autoscaling, bilingual navigation, educational center, status explorer, glossary, contextual help, guided tour, and accessible metrics. P1.5.2 (Animated Request Flow Visualizer) and final P1.6 are still pending.

## Inputs and preparation

1. Inspect the actual repository and read `AGENTS.md`, `README.md`, relevant documents in `docs/`, and the current `src/app`, `src/i18n`, `src/styles`, `src/engine` interfaces.
2. Read `design/README.md`, `design/DESIGN_REFERENCE_ANALYSIS.md` and `design/UI_REDESIGN_BRIEF.md` (or the corresponding paths where this reference package was placed).
3. Carefully inspect these **three provided screenshots**:
   - `design/design-references/01-cake-dashboard.png` — dashboard hierarchy, concise KPIs, navigation and cards.
   - `design/design-references/02-uxcel-education.png` — approachable learning catalog, category chips and illustrated cards.
   - `design/design-references/03-canva-visualization.png` — left configuration area + prominent main workspace.
4. Inspect the actual current UI by rendering/build review if runtime permits. If browser dev/preview binding is denied, use available static build methods and clearly record the limitation. **Do not claim to have audited pixels or interaction states you did not inspect.**

## Scope: DESIGN RESEARCH AND DOCUMENTATION ONLY

Do NOT edit `src/` files, change engine behavior, install dependencies, migrate CSS frameworks, add routes, implement visualizations, commit, push or deploy.

Use the references as inspiration for **principles and patterns**, not as templates to copy. Do not reproduce third-party logos, brand illustrations, exact layout or proprietary content. Keep their screenshots local; do not add reference images to the public Git repo.

## Tasks

### A — Evidence-based UX/UI audit

Review the real current Playground, Learn landing page, Fundamentals, HTTP status catalog, Glossary, About and mobile layout. Identify high/medium/low-priority issues in hierarchy, spacing, typographic scale, use of color, cognitive load, discoverability, visual consistency, access to help, accessibility and responsiveness. Tie each finding to **actual code or observed screens** and avoid speculative defects. Explain the expected user benefit and potential regression risk.

### B — Unified design direction

Synthesize Cake's clear dashboard hierarchy, Uxcel's approachable learning presentation and Canva's side-controls/central-workspace mental model into a **distinct** Break My API visual identity: a calm, playful-yet-precise interactive engineering laboratory. Define design principles and a concept of how the existing modules fit together. Don't reduce the app to an enterprise admin dashboard.

### C — Concrete, reusable design system

Propose design tokens (color semantics, type scale, spacing, border radius, surfaces, responsive breakpoints, motion and focus styles); UI component patterns (header/nav, buttons, sliders, toggle, popover, KPI cards, lesson cards, filter chips, status list, chart frame and future request-flow nodes); accessible states; typography for EN/ES and technical output; and responsive guidelines. Respect existing dependencies, CSS structure and accessibility requirements.

### D — Layout plans before code

Provide written wireframes / low-fidelity text mockups for:
- Playground desktop (~1100–1440px), phone (~390px), with visualizer space reserved and exact information hierarchy.
- Learn landing and at least one educational/catalog detail view in desktop/phone.
- HTTP Status Explorer filtering and result/detail UX.
- A brief future Request Flow node/branch layout honoring real engine order and 200/429/503 outcomes, without claiming it has already been implemented.

Clarify how the left controls / central workspace / KPIs / learning insight blocks stack and collapse across breakpoints. Separate proposals from features already present.

### E — Plan implementation safely

Write a phased implementation plan that begins with shared tokens + Playground layout, then Learn module consistency, and then P1.5.2 visuals. Include affected code surfaces, potential tests, priority and effort (S/M/L) with known risks. Do not implement any step now. Explicitly preserve all 83+ existing test assertions and deterministic model behavior.

## Deliverables (markdown files only)

Create or update these *project-owned* documents:

- `docs/UX_AUDIT.md` — evidence, screenshot comparison and priorities.
- `docs/DESIGN_SYSTEM.md` — concrete reusable tokens/components, accessible typography/color rationale.
- `docs/UI_REDESIGN_PLAN.md` — desktop/mobile low-fidelity layouts and small safe implementation milestones.

**Before editing docs**, state the audit plan and files you will touch. **After finishing**, summarize: key opportunities, proposed design direction, what to implement first, unresolved design choices, and precisely which verification methods were possible.

Do not modify code, run commits, push, or deploy. Stop and wait for design review/approval.
