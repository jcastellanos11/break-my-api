# Design reference analysis — selected screenshots

## Provenance and limits

This document analyzes three screenshots supplied by the project owner. The observations describe **the visible screenshots only**; they are not assertions about the full products, their interaction design, or what Mobbin offers beyond the screenshots. The current Break My API codebase was **not inspected in this analysis**; Codex must inspect actual files and, if possible, render the current app before recommending changes.

## 1. Cake Equity — Dashboard (`design-references/01-cake-dashboard.png`)

### Visible patterns
- Persistent **left navigation rail**, divided into clear destinations.
- Top bar with workspace identity, secondary actions and progress/status.
- Main heading and a light lavender contextual banner above the content.
- Three-column metric composition: a narrow stacked KPI column, a larger central ownership visualization, and a right-side activity card.
- Clear surfaces with subtle borders, light neutral backgrounds and purple/lavender accent colors.
- Important numbers and trends are visible without opening settings; supplementary cards continue below.

### Suitable adaptations
- A compact, visible KPI strip and selected scenario status near the top of Break My API.
- Group current state, last-completed-second measurements and cumulative counts **visually**, with explicit time labels.
- Discreet cards with consistent borders, spacing and titles across Playground and Learn.
- Consistent app navigation and obvious selected-route state.

### Avoid copying
- Dense equity-specific widgets, table/ownership charts or financial concepts.
- Large persistent sidebar **and** an equally heavy top nav, which would waste width in a technical playground.
- Brand colors, logos, illustrations or exact arrangement; synthesize a distinct visual identity.

## 2. Uxcel — Courses (`design-references/02-uxcel-education.png`)

### Visible patterns
- Course catalog with simple page title and one-sentence descriptive subheading.
- Small filter chips (All, UX, PM, AI) and a right-aligned sort/filter area.
- Three-column desktop card grid; each card has a dominant illustration panel, then category, title, author, summary and compact metadata.
- Restrained white/light-gray interface, black type, subtle borders, bold playful illustrations with bright accents.
- Persistent left navigation with grouped section headings.

### Suitable adaptations
- Learn landing page with **Fundamentals**, **HTTP Status Codes**, **Glossary**, and **Guided Experiments** displayed as 3–4 distinct visually themed learning cards.
- HTTP code family filters as compact chips; details screen separate from navigation.
- Cards with short introductions and recognizable, custom-drawn abstract illustrations, not Uxcel artwork.
- Two-column (medium viewport) and one-column (phone) adaptations with readable card text.

### Avoid copying
- Ratings, fictitious enrollments, durations, badges or author avatars when no such data exists.
- Turning the reference catalog into 58 huge illustrated course cards; status explorer needs a searchable, scannable list with detail view.
- Replicating the underlying Uxcel product branding or exact illustration assets.

## 3. Canva — Chart editor (`design-references/03-canva-visualization.png`)

### Visible patterns
- Left **contextual configuration panel**, containing dropdowns, section headers, toggle controls and form fields.
- Large central neutral workspace/canvas showing one dominant pie visualization.
- Horizontal top actions and contextual edit toolbar, with small status/footer navigation.
- Strong separation between **configure** (left) and **see the result** (center).
- This is an editor screenshot, not an animated API-request trace or infrastructure diagram.

### Suitable adaptations
- Playground: narrow, logically grouped controls sidebar and a wide central **Request Flow** workspace.
- Distinct experiment actions (Start/Pause/Reset) near canvas, not lost among sliders.
- A compact contextual help/info area, integrated with node selection and existing glossary popovers.
- On mobile, turn the controls into collapsible sections **before or after** the core flow according to usability testing.

### Avoid copying
- Exact toolbar, pie chart, canvas editing affordances, floating actions or video timeline; those do not map to our simulator.
- A graphical editor metaphor suggesting nodes can be dragged/re-wired: Break My API does not support modifying service topology.
- A database stage in the Request Flow unless the engine actually models one.

## Synthesized direction: a calm interactive laboratory

- **Cake provides information hierarchy:** compact KPIs, clear navigation, card consistency.
- **Uxcel provides approachability:** discoverable learning entry points, short approachable descriptions, friendly illustrative motifs.
- **Canva provides the working model:** configure on the side, experiment prominently in the center.
- **Our own distinctive quality** comes from showing the accurate request lifecycle, technical precision, EN/ES localization, accessibility, and a clean simulation-specific design language.

## Provisional visual identity (to test, not adopt blindly)

- Light-first warm-neutral surface, readable deep ink text.
- Indigo/violet as **product interaction accent**, teal for successful/cache flows, amber for limiting or waiting, coral for service unavailable.
- Separate colors from semantic text and icons; meet WCAG-oriented contrast targets.
- 8px-derived spacing system; desktop cards with comfortable interior padding; unified 12–16px radii used sparingly.
- Typography: modern open-licensed readable sans-serif for UI; mono only for HTTP examples and technical readouts, using already installed/system fonts where possible.
- Calm animation that respects pause, reduced motion and actual simulation model events.

## Research gap before implementation

Codex must inspect actual current `Playground`, `LearnCenter`, `Help`, charts, styles and responsive breakpoints. Compare to screenshot evidence and propose a **before/after matrix**. Do not assert a specific defect without verifying it in the current code/render.
