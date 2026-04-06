---
name: cmdb-health-sp
description: This skill should be used when the user asks to "build the portal", "create a widget", "build the health dashboard", "add the CI cards widget", "create the header widget", "add CI modal", "build the service portal page", or mentions "Service Portal", "SP widget", "AngularJS widget", "skeuomorphism", "health dashboard", "CI health cards", or any UI/portal task for the CMDB Health Doctor application.
version: 1.0.0
---

# CMDB Health Doctor — Service Portal Widget Builder

Build production-ready ServiceNow Service Portal widgets for the CMDB Health Doctor application. Follow the quad-file widget architecture and ServiceNow SP constraints exactly. The visual theme is **skeuomorphism** — dark metallic control panel aesthetic with real depth, tactile cards, and analog-style indicators.

---

## App Identity

| Property | Value |
|---|---|
| App Scope | `x_epams_cmdb_healt` |
| Health Table | `x_epams_cmdb_healt_health_record` |
| Portal URL Suffix | `/cmdbhealthportal` |
| Visual Theme | Skeuomorphism — dark metallic control panel |

---

## CRITICAL RULES — Never Violate These

### JavaScript Rules (Server Script)

- NO ES6 — no `let`, `const`, arrow functions `=>`, template literals, or spread operators
- Use ONLY `var` and `function` keyword
- Use `GlideRecord`, `GlideAggregate`, `$sp` utilities
- Wrap action logic in `if (input) { ... }`

### AngularJS Rules (Client Script)

- ALWAYS use `$scope.varName` — NEVER `c.varName`
- ALWAYS use `ng-click="myFn()"` — NEVER `ng-click="c.myFn()"`
- ALWAYS use `{{varName}}` — NEVER `{{c.varName}}`
- Read server data via `$scope.data.fieldName` — NEVER `c.data.fieldName`
- Controller signature: `api.controller = function($scope, spUtil, $timeout, $http) { ... }`
- Call server via `$scope.server.update().then(function() { ... })`

### Widget Config Rules

- Widget `data_table` field MUST be set to `sp_instance`
- NEVER hardcode a table name in the widget configuration panel

### JSON Parsing in Server Script (ES5)

Always wrap in try/catch — never call `JSON.parse` unguarded:

```javascript
var actions = [];
try {
    var raw = gr.getValue('x_epams_cmdb_healt_review_actions');
    if (raw) { actions = JSON.parse(raw); }
} catch(e) { actions = []; }
```

---

## Three Widgets to Build

### Widget 1: `cmdb_health_header`

Full-width summary bar at the top of the portal page.

Displays: App title, animated count cards (Total / Critical / Moderate / Minor / Healthy), pulsing red alert dot if any Critical CIs exist, last job run timestamp, "Add CI" button, and Refresh button.

Server script queries `x_epams_cmdb_healt_health_record` aggregated by `health_status`.

### Widget 2: `cmdb_health_dashboard`

Main widget — filter bar + CI card grid + expandable detail panel.

**Filter bar:** status filter pills, environment dropdown (dynamically populated), sort dropdown (Score worst/best, CI Name, Last Analysed), search box (client-side filter by CI name).

**CI Cards Grid (3 col desktop / 1 col mobile):** left colour stripe, physical LED dot, CI name, CI class + environment, three score bars (Correctness / Completeness / Compliance with animated fill), issue badge pills (STALE / ORPHAN / DUPLICATE / VIOLATIONS / MISSING), priority action text (2 lines truncated), footer with review count + analysis timestamp + score delta arrow.

**Expanded Detail Panel:** slides open below the clicked card (not a modal). Shows overall score, score delta indicator, AI summary terminal readout, priority action highlighted box, three accordion sections (one per CCC dimension), review actions list with risk + dimension badges.

**Add CI Modal:** text input for CI name, validates against `cmdb_ci`, checks for duplicates in health table, creates record with `run_status = 'new'`, shows success/error toast.

### Widget 3: `cmdb-health-status-bar` (optional)

Simple narrow bar showing real-time job status. Not required for MVP.

---

## Known ServiceNow SP Gotchas

| Problem | Fix |
|---|---|
| `c.variable` undefined | Use `$scope.variable` everywhere |
| `const`/`let` error in server script | Use only `var` |
| Arrow function `=>` error | Use `function(x) { }` |
| `JSON.parse` crashes server script | Always wrap in try/catch |
| ng-repeat not updating | Use `$scope.$apply()` or `$timeout` |
| Widget data not loading | Check server script uses `data.fieldName` |
| Boolean field from GlideRecord | Compare with `=== '1'` not `=== true` |
| Reference field display value | Use `gr.getDisplayValue('field')` |
| Integer from GlideRecord | Wrap in `parseInt(..., 10)` |

---

## References

Load these when building the corresponding area:

- **`references/field-reference.md`** — Complete field listing for all columns on `x_epams_cmdb_healt_health_record`, grouped by category, plus the review actions JSON structure
- **`references/design-system.md`** — Full skeuomorphism color palette, and all CSS patterns: metallic panel, embossed card, LED indicators, score bars, scan lines, filter pills, card hover/expand transitions, accordion, modal overlay, toast, terminal readout, issue badges, summary count cards, pulsing alert dot
- **`references/server-scripts.md`** — ES5 server scripts for Widget 1 (header aggregation) and Widget 2 (load-all-records, Add CI action handler)
- **`references/client-scripts.md`** — AngularJS controller initialisation for Widget 1 and Widget 2; score animation, status colour helpers, card expand/collapse, filter/search/sort (incl. environment dropdown), accordion toggle, score delta display, toast, Add CI modal
- **`references/html-templates.md`** — Complete HTML templates: Widget 1 header, Widget 2 filter bar, CI card grid (with embedded expanded detail panel), Add CI modal, toast; plus root structure
- **`references/portal-setup.md`** — How to create the portal record, configure the dark theme CSS variables, set up the portal page in Page Designer, widget record fields, now-sdk file structure, and common gotchas
