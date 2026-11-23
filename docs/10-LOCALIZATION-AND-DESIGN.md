# 10 — Localization + educational minimalist design contract

## Product identity (approved)

Educational and playful **in a restrained way**: warm light surfaces, generous spacing, friendly rounded shapes, easy-to-recognize flow stages, clear hierarchy and a few purposeful accent colors. No overwhelming admin console, flashy gaming style, or black-and-neon cyberpunk aesthetic as the default.

## UI mood and visual primitives

- Light/off-white base, high-contrast dark text, accessible contrast and useful spacing; cohesive design tokens for colors, radius, spacing and typography.
- Semantic accents should distinguish **success / accepted**, **waiting**, **rate limited (429)**, **queue rejected (503)**, **cached**, **instance pending**; each has a text label/icon, not just color.
- Expressive but calm diagrams: flows and status indicators convey *actual model events*, not fabricated request streams.
- Charts emphasize legibility, not density; empty and zero states are distinct; p95 “No data” when no measured samples.
- Phone layout first: horizontal overflow avoided, explanation panel collapsible, controls large and keyboard accessible, touch popovers not hover-only.
- Reduced-motion respected; pause stops simulation motion, decorative motion cannot conflict with model state.

## English + Spanish — both mandatory at MVP release

- Use clear international Spanish understandable across Latin America and Spain; avoid regional slang.
- Use English technical labels that a global developer audience recognizes, but define jargon.
- All visible UI text lives in **typed translation resources**, not hardcoded JSX; use e.g. `src/i18n/en.ts`, `es.ts`, `types.ts` with identical nested key structures.
- Translate: nav and title descriptions, form labels, buttons/toggles, presets, status, metric/chart axes and legends, time units/context, ARIA labels/live announcements, errors, empty states, tour chapters, Simple/Technical copy, glossaries, cloud caveats, autoscaling events and safety notice.
- `en` and `es` must be key-equivalent; CI/typecheck should catch missing keys. Avoid a placeholder translator that returns translation keys to users.
- Use a React provider/context (or similarly lightweight solution) so switching language preserves the *same* engine instance, seed, time, queue, config, results, and controller run/pause state.
- `Simple / Sencillo` vs `Technical / Técnico` affects only **explanation details**, not engine calculations or limits.
- Technical tokens (`RPS`, `GET`, `HTTP 429`, `p95`, code examples) should remain recognizable regardless of locale.
- Prefer separate copy strings for instructional paragraphs rather than concatenating grammatical fragments.

## Translation examples

| Key / idea | EN | ES |
|---|---|---|
| `action.start` | Start simulation | Iniciar simulación |
| `action.pause` | Pause | Pausar |
| `action.reset` | Reset | Reiniciar |
| `control.incomingRps` | Incoming requests (RPS) | Solicitudes entrantes (RPS) |
| `control.instances` | Compute instances | Instancias de cómputo |
| `control.autoScale` | Automatic scaling | Escalamiento automático |
| `stat.queue` | Waiting requests | Solicitudes en espera |
| `stat.p95` | p95 response time | Tiempo de respuesta p95 |
| `status.pendingScale` | New instance starting… | Iniciando nueva instancia… |
| `disclaimer` | All traffic is simulated. No real API is being stressed. | Todo el tráfico es simulado. No estamos sobrecargando ninguna API real. |
| `depth.simple` | Simple | Sencillo |
| `depth.technical` | Technical | Técnico |

## Language control recommendations

- Visible **EN / ES** or **English / Español** selector in top bar and mobile menu; clear active state.
- Browser locale may select initial default, but manual selection always wins; if no preference, default English for international portfolio.
- Optionally persist language/depth in localStorage, but this is not a backend requirement and must not persist any simulation personally identifying data.
- Expose `lang` semantic on page root/document if practical and safe; screen reader language should follow selector.

## Accessibility rules

- Contrast at least WCAG AA target for normal copy where practical; avoid tiny numeric labels.
- Inputs use real `label`, buttons have accessible names, toggles with clear status, focus ring, keyboard navigation, tooltips available on tap/click.
- Diagrams have alternate text describing request flow, and charts have readable textual summary with actual numbers and time windows.
- Don't use color alone to distinguish 429 vs 503; explicit text and labels required.

## Practical MVP design limit

Only **one** visual system, **one** language switch, **one** explanation-depth toggle, **one** main playground screen, **one** guided tour and **one** autoscaling policy. No light/dark theme toggle or animation configurator unless all required behavior is finished and quality gates remain green.
