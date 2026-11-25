# Design system proposal · Break My API

**Decision for review:** Build on the existing warm paper, dark ink and green action accent. A small request envelope opening into two reply lines can identify Fundamentals. A pair of labeled status tabs can identify the catalog. An indexed term slip can identify the glossary. These are original, static teaching motifs. Keep their scale modest so a person can choose by reading the title alone.

## Principles

1. **Put the question beside its evidence.** When someone changes traffic, the nearest result should compare arrivals with successful completions over the same simulated second.
2. **Make time part of the label.** “Now,” “last completed simulated second” and “since scenario start” identify different measurements. They travel with their groups at every width.
3. **Use one shell for different tasks.** Playground is for experiments. Learn is for independent reading and lookup. About explains assumptions. Language and depth are preferences shared by the same session.
4. **Reveal complexity on request.** An experienced reader can reach exact units, definitions, policy and tabular data. A first-time visitor can start immediately. Preserve familiar native controls and the optional tour.

## Tokens for the existing CSS

Adopt incrementally in `src/styles/global.css`. Names below describe proposed CSS custom properties. The current `--ink`, `--surface`, `--line` and `--accent` can be aliases during migration.

| Role | Proposed color | Application |
|---|---|---|
| Paper / surface / subtle divider | `#F7F8F2` / `#FFFEFA` / `#DCE1D5` | Page, reading panels, grouping lines. Use subtle lines for decoration. |
| Ink / secondary | `#24332D` / `#526059` | Body, captions and units. Ink on surface is 13.12:1, secondary on paper 6.19:1. |
| Action / on-action | `#365B47` / white | Start or Resume. White on action is 7.65:1. Underline text links and mark the current navigation link with an inset rule. |
| Measured success | `#07665D` on `#E2F4ED` | Completed 200, 6.00:1. Mark cache-sourced completions with source text. |
| Waiting / limited | `#794700` on `#FFF1D6` | 6.93:1. Label queued work “Waiting”; label a rejection “429 · Rate limited.” They have different shapes and terminal states. |
| Unavailable | `#963B30` on `#FDECE7` | 503 · queue full, 6.18:1. Preserve the visible code. |
| Focus / control boundary | `#3E50A4` / `#738177` | On surface, 7.20:1 and 4.05:1. Reserve the stronger boundary for interactive elements whose shape conveys meaning. |

Ratios are computed from sRGB relative luminance for these exact solid pairs. They are design checks, not a compliance audit of the current app. Target ≥4.5:1 for ordinary text and ≥3:1 for essential graphic boundaries. Recheck adjacent colors, hover backgrounds, forced colors and disabled readability in implementation. Assign neutral solid to arrivals, teal dashed to successes, amber dotted to 429 and rust dash-dot to 503. Label each legend swatch in text. The same color can serve two purposes only where words or shapes resolve the meaning.

| Token family | Proposed values | Use |
|---|---|---|
| Type | 0.875rem labels, 1rem body and controls, 1.125rem subhead, 1.375rem section, 1.75rem KPI, page title from 2rem to 2.75rem | Use the current Inter/system sans stack. Body line height 1.55, headings 1.2. Keep article text around 60–68ch. |
| Numeric / code | Tabular digits for clocks, counts and KPIs. System monospace at ≥0.875rem for paths, headers and JSON | Prose and translated control names remain proportional. Format measured values using the active locale. Preserve canonical HTTP phrases with English language metadata. |
| Space | 4, 8, 12, 16, 24, 32, 48px equivalents in rem | 4 between value/unit, 8 between control/help, 12 within a field, 16 phone panel padding, 24 desktop padding, 32 between sections. |
| Corners / elevation | 8px input, 12px card, 16px workspace, full radius for small state labels | Flat cards, one border. A modest shadow only on floating help. |
| Layout | <48rem one column, 48–63.99rem compact workspace, ≥64rem sidebar + workspace. Max shell 80rem | At 390px allow 16px gutters. Desktop gutters 24–40px, gap 24px, sidebar 15–18rem; give remainder to measurements. |
| Input / focus | Preferred minimum 44 × 44 CSS px for buttons, summaries, filter choices and help. 3px outline, 3px offset | Keep ring visible on both light surfaces and filled buttons, including within disclosures. Allow full wrapping of Spanish labels at 200% zoom. |
| Motion | 120–160ms opacity or color for user-triggered feedback | Respect reduced motion with immediate updates. Paused or hidden simulation time produces no new flow activity. No looping “busy” ornament. |

## Component behavior

| Component | Anatomy and states | Accessibility and narrow-screen behavior |
|---|---|---|
| Header and route navigation | Brand/home, three native links, language switch; place the shared depth preference in an accessible utility group. Current destination gets text emphasis and a rule. | Keep skip link, translated navigation name, `aria-current`, pressed language state and route-heading focus. On phone allow a second row. Preserve the welcome entry. |
| Run bar | Native scenario select and reset explanation, one primary Start/Pause/Resume action, secondary Reset, explicit status and simulated time. | Keep action names stable across layout changes. State changes may be announced; avoid announcing the clock on every tick. Show one visible synthetic-traffic notice in context. |
| Control group | Fieldset and legend for traffic, compute/queue, protection. Slider with persistent value, unit and min/max. Native checkbox for cache, limiting and scaling. | Label points only to input. Help is a sibling. Native keyboard adjustments persist. Keep disabled subordinate settings readable and explain dependencies, including manual instances during automatic scaling. |
| Contextual help | A question-mark button opens meaning, example, setting effect when adjustable and Technical detail when selected. | Name includes the subject. Preserve expanded state, Escape, explicit close, outside dismissal and focus return. Allow inline expansion on a phone. Reuse glossary definitions. |
| KPI strip / chart frame | Group title with interval, value, label, unit and optional help. Match the chart legend, window caption, accessible SVG name and expandable table. | A measured zero is 0. Empty p95 is “No data / Sin datos.” Keep 429/503 distinct; status detail links have discernible destinations. Use a wrapping grid, with local scrolling limited to wide tables. |
| Learn entry / reader | One anchor per destination with original motif, heading and one sentence. Fundamentals pairs each concept with one example. About uses the same reading measure. | Motifs are decorative where the heading conveys the meaning. Let text determine card height. Stack at phone width. A link to Playground preserves the experiment. |
| Filter chips / status list | Search plus a single-choice native radio group styled as All and five families. Result row shows code and localized title. Selected row has outline and selection text or current-link state. | Full family names available in both languages. Chips wrap; radio arrows and native link activation work. Keep existing query, empty-result state and selected-code URL distinct. |
| Glossary | Search, shared Simple/Technical selector, alphabetic term summaries and expandable definitions | Use term keys for identity through locale changes. Preserve 20 terms and existing status links. Content fits the viewport at either depth. |
| Future request-flow node | Label, actual count with time basis, outcome/source where relevant, optional help. A decision has labeled branches; a terminal includes HTTP code and reason. | Desktop diagram and phone list share the same data. No drag affordances. Text equivalents include waiting, cache pending and pending capacity. Reduced-motion view conveys the same information. |

## Review specimens

Review “Instancias en preparación”, “Último segundo simulado completo”, “Espacios simultáneos por instancia” and a long Spanish code title at 390px, with keyboard focus and at 200% zoom. Inspect ready, running, paused, disabled, selected, no search matches, zero completions, and a full queue. Compare a cache HIT decision with a completed cache response. These pairs expose truncation, ambiguous color and measurement errors faster than a page of ideal values.
