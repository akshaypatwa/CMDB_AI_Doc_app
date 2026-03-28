---
name: cmdb-health-sp
description: >
  Build the CMDB Health Doctor Service Portal dashboard using ServiceNow SP widgets.
  Use this skill for ALL portal tasks: header widget, CI health cards widget, 
  add-CI widget, and any portal page configuration for the CMDB Health Doctor app.
  Trigger on any mention of: "portal", "widget", "dashboard", "SP", "service portal",
  "CI cards", "health dashboard", "skeuomorphism", or any UI/UX task for this project.
---

# CMDB Health Doctor — Service Portal Widget Builder

This skill generates production-ready ServiceNow Service Portal widgets for the
CMDB Health Doctor application. Every widget follows the quad-file architecture
and ServiceNow SP constraints exactly. The visual theme is SKEUOMORPHISM — deep,
tactile, physical-looking UI with real depth, textures, and analog-style indicators.

---

## CRITICAL RULES — NEVER VIOLATE THESE

### JavaScript Rules (Server Script)
- NO ES6. No `let`, `const`, arrow functions `=>`, template literals, or spread operators
- Use ONLY `var` and `function` keyword
- Use GlideRecord, GlideAggregate, $sp utilities
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
```javascript
// Parse JSON fields safely
var actions = [];
try {
    var raw = gr.getValue('x_epams_cmdb_healt_review_actions');
    if (raw) { actions = JSON.parse(raw); }
} catch(e) { actions = []; }
```

---

## APP IDENTITY & TABLE

| Property | Value |
|---|---|
| App Scope | `x_epams_cmdb_healt` |
| Health Table | `x_epams_cmdb_healt_health_record` |
| Portal URL Suffix | `/cmdbhealthportal` |
| Portal Theme | SKEUOMORPHISM — dark metallic control panel aesthetic |

---

## COMPLETE FIELD REFERENCE

All fields on `x_epams_cmdb_healt_health_record`:

### Identity Fields
```
x_epams_cmdb_healt_ci                  — Reference to cmdb_ci (display_value = CI name)
x_epams_cmdb_healt_ci_class            — String: e.g. "cmdb_ci_server"
x_epams_cmdb_healt_environment         — String: e.g. "Production"
x_epams_cmdb_healt_analysis_date       — DateTime: when last evaluated
```

### Run Status Fields
```
x_epams_cmdb_healt_run_status          — Choice: new/evaluating/evaluated/complete/failed
x_epams_cmdb_healt_retry_count         — Integer
x_epams_cmdb_healt_error_log           — String: error details if failed
x_epams_cmdb_healt_job_started_at      — DateTime
x_epams_cmdb_healt_job_completed_at    — DateTime
x_epams_cmdb_healt_last_stage          — String: last processing stage description
x_epams_cmdb_healt_stage_updated_at    — DateTime
```

### Score Fields (all Integer 0–100)
```
x_epams_cmdb_healt_overall_health_score  — 0–100
x_epams_cmdb_healt_health_status         — Choice: critical/moderate/minor/healthy
x_epams_cmdb_healt_correctness_score     — 0–100
x_epams_cmdb_healt_completeness_score    — 0–100
x_epams_cmdb_healt_compliance_score      — 0–100
x_epams_cmdb_healt_previous_score        — Integer (from last run)
x_epams_cmdb_healt_score_delta           — Integer (can be negative)
```

### Flag Fields
```
x_epams_cmdb_healt_is_stale              — Boolean
x_epams_cmdb_healt_is_orphan             — Boolean
x_epams_cmdb_healt_duplicate_count       — Integer
x_epams_cmdb_healt_violations_count      — Integer
x_epams_cmdb_healt_missing_fields_count  — Integer
x_epams_cmdb_healt_regulatory_risk       — Boolean
x_epams_cmdb_healt_templates_checked     — Integer
```

### LLM Output Fields
```
x_epams_cmdb_healt_llm_summary           — String (1000): AI overall summary
x_epams_cmdb_healt_priority_action       — String (500): single most critical action
x_epams_cmdb_healt_correctness_summary   — String: correctness dimension summary
x_epams_cmdb_healt_completeness_summary  — String: completeness dimension summary
x_epams_cmdb_healt_compliance_summary    — String: compliance dimension summary
x_epams_cmdb_healt_review_actions        — String/max: JSON array of review items
x_epams_cmdb_healt_autofix_actions       — String/max: JSON array of autofix items
x_epams_cmdb_healt_review_actions_count  — Integer
x_epams_cmdb_healt_autofix_actions_count — Integer
x_epams_cmdb_healt_fields_review         — String: comma-separated field names
```

### Tracking Fields
```
x_epams_cmdb_healt_autofix_status        — Choice: pending/partial/completed/failed
x_epams_cmdb_healt_review_status         — Choice: pending/in_progress/complete
x_epams_cmdb_healt_reviewed_by           — Reference: sys_user
x_epams_cmdb_healt_review_date           — DateTime
x_epams_cmdb_healt_raw_payload_json      — String/max: payload sent to LLM
```

---

## REVIEW ACTIONS JSON STRUCTURE

Each item in `x_epams_cmdb_healt_review_actions` array:
```json
{
  "dimension": "correctness | completeness | compliance",
  "title": "Short title of the issue",
  "target_ci_sys_id": "sys_id of CI to fix",
  "action": "Specific action to take",
  "risk": "MEDIUM | HIGH | CRITICAL",
  "reason": "Why this recommendation was made — names specific signals",
  "requires_approval": false
}
```

---

## SKEUOMORPHISM DESIGN SYSTEM

The CMDB Health Doctor portal looks like a physical control room monitoring panel.
Dark metallic background, tactile cards with real depth, analog-style gauges,
physical LED status indicators, embossed text and buttons.

### Color Palette
```scss
// Background — dark brushed steel
$bg-deep:        #0d0d1a;
$bg-panel:       #16213e;
$bg-card:        #1a1a2e;
$bg-card-light:  #0f3460;

// Status colors — physical LED style
$critical-color: #e53935;
$critical-glow:  rgba(229, 57, 53, 0.6);
$moderate-color: #fb8c00;
$moderate-glow:  rgba(251, 140, 0, 0.5);
$minor-color:    #fdd835;
$minor-glow:     rgba(253, 216, 53, 0.4);
$healthy-color:  #43a047;
$healthy-glow:   rgba(67, 160, 71, 0.5);

// Metallic accents
$metal-light:    #c0c8d8;
$metal-mid:      #8892a4;
$metal-dark:     #4a5568;
$accent-blue:    #4fc3f7;
$accent-glow:    rgba(79, 195, 247, 0.3);

// Text
$text-primary:   #e8eaf6;
$text-secondary: #9fa8da;
$text-muted:     #546e7a;
```

### Skeuomorphism CSS Patterns

**Metallic panel background:**
```scss
background: linear-gradient(145deg, #1e2a4a 0%, #0d1525 50%, #1a2035 100%);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -1px 0 rgba(0,0,0,0.4),
            0 8px 32px rgba(0,0,0,0.6);
```

**Embossed card surface:**
```scss
background: linear-gradient(145deg, #1e2847 0%, #141d35 100%);
border: 1px solid rgba(255,255,255,0.06);
box-shadow: 0 2px 4px rgba(0,0,0,0.4),
            0 8px 24px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.08);
border-radius: 12px;
```

**Physical LED status indicator:**
```scss
// Critical LED
.led-critical {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b);
  box-shadow: 0 0 6px #e53935, 0 0 12px rgba(229,57,53,0.6),
              inset 0 1px 2px rgba(255,255,255,0.3);
}
```

**Pressed/active button:**
```scss
.btn-skeuo {
  background: linear-gradient(145deg, #1a2540, #0d1525);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 4px 8px rgba(0,0,0,0.4),
              inset 0 1px 0 rgba(255,255,255,0.08);
  &:active {
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5),
                0 1px 2px rgba(0,0,0,0.3);
    transform: translateY(1px);
  }
}
```

**Score progress bar (analog meter style):**
```scss
.score-track {
  background: linear-gradient(90deg, #0a0f1e, #111827);
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.6),
              inset 0 -1px 0 rgba(255,255,255,0.03);
  border-radius: 4px; height: 8px;
}
.score-fill {
  border-radius: 4px; height: 100%;
  box-shadow: 0 0 8px currentColor;
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Left status stripe on cards:**
```scss
.card-stripe-critical {
  border-left: 4px solid $critical-color;
  box-shadow: -2px 0 12px $critical-glow;
}
```

**Scan line texture overlay (control room effect):**
```scss
.scanlines::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.03) 2px,
    rgba(0,0,0,0.03) 4px
  );
  pointer-events: none;
}
```

---

## THREE WIDGETS TO BUILD

### Widget 1: cmdb-health-header
**ID:** `cmdb_health_header`
**Purpose:** Full-width summary bar at top of page

Displays:
- App title "CMDB Health Doctor" with metallic logo text
- Animated count cards: Total | Critical | Moderate | Minor | Healthy
- Pulsing red alert dot if any Critical CIs exist
- Last job run timestamp
- "Add CI" button (opens modal in Widget 2)
- Refresh button

Server script queries `x_epams_cmdb_healt_health_record` aggregated by `health_status`.

### Widget 2: cmdb-health-dashboard
**ID:** `cmdb_health_dashboard`
**Purpose:** Main widget — filter bar + CI card grid + expandable detail panel

#### Filter Bar
- Status filter pills: [All] [Critical] [Moderate] [Minor] [Healthy]
- Environment dropdown (dynamically populated)
- Sort dropdown: Score (worst first) | Score (best first) | CI Name | Last Analysed
- Search box: filters by CI name client-side

#### CI Cards Grid (3 columns desktop, 1 mobile)
Each card shows:
- Left colour stripe (red/orange/yellow/green)
- Physical LED dot indicator
- CI name (bold, `$text-primary`)
- CI class + environment (smaller, `$text-secondary`)
- Three score bars: Correctness / Completeness / Compliance with animated fill
- Issue badge pills: [STALE] [ORPHAN] [DUPLICATE x1] [VIOLATIONS x2] [MISSING x2]
- Priority action text (truncated, 2 lines max)
- Footer: review count + analysis timestamp + score delta arrow

#### Expanded Detail Panel
Slides open below the clicked card (not a modal).
Contains:
- Overall score with large analog-gauge-style display
- Score delta indicator (↑↓→ with colour)
- AI summary text (styled as a terminal/readout)
- Priority action highlighted box
- Three accordion sections (Correctness / Completeness / Compliance)
  - Each shows score bar + LLM summary text for that dimension
- Review Actions list
  - Each item: risk badge + dimension badge + title + action text + reason
- Close button

#### Add CI Modal
Triggered by "Add CI" button in header or a FAB on the dashboard.
- Text input: CI name (validates against cmdb_ci on submit)
- Checks for existing record in health table (no duplicates)
- Creates new record with run_status = 'new'
- Success toast notification
- Error display if CI not found or duplicate

### Widget 3: (optional) cmdb-health-status-bar
Simple narrow bar showing real-time job status.
Only needed if you want a persistent status indicator.
Not required for MVP.

---

## SERVER SCRIPT PATTERNS

### Load all health records (Widget 2 main query)
```javascript
(function() {
    data.records = [];
    data.summary = { total: 0, critical: 0, moderate: 0, minor: 0, healthy: 0, lastRun: '' };

    var gr = new GlideRecord('x_epams_cmdb_healt_health_record');
    gr.addQuery('x_epams_cmdb_healt_run_status', 'complete');
    gr.orderBy('x_epams_cmdb_healt_overall_health_score'); // worst first
    gr.setLimit(50);
    gr.query();

    while (gr.next()) {
        var rec = {};
        rec.sys_id               = gr.getUniqueValue();
        rec.ci_name              = gr.getDisplayValue('x_epams_cmdb_healt_ci');
        rec.ci_sys_id            = gr.getValue('x_epams_cmdb_healt_ci');
        rec.ci_class             = gr.getValue('x_epams_cmdb_healt_ci_class');
        rec.environment          = gr.getValue('x_epams_cmdb_healt_environment');
        rec.overall_score        = parseInt(gr.getValue('x_epams_cmdb_healt_overall_health_score') || '0', 10);
        rec.health_status        = gr.getValue('x_epams_cmdb_healt_health_status');
        rec.correctness_score    = parseInt(gr.getValue('x_epams_cmdb_healt_correctness_score') || '0', 10);
        rec.completeness_score   = parseInt(gr.getValue('x_epams_cmdb_healt_completeness_score') || '0', 10);
        rec.compliance_score     = parseInt(gr.getValue('x_epams_cmdb_healt_compliance_score') || '0', 10);
        rec.previous_score       = gr.getValue('x_epams_cmdb_healt_previous_score');
        rec.score_delta          = gr.getValue('x_epams_cmdb_healt_score_delta');
        rec.is_stale             = gr.getValue('x_epams_cmdb_healt_is_stale') === '1';
        rec.is_orphan            = gr.getValue('x_epams_cmdb_healt_is_orphan') === '1';
        rec.duplicate_count      = parseInt(gr.getValue('x_epams_cmdb_healt_duplicate_count') || '0', 10);
        rec.violations_count     = parseInt(gr.getValue('x_epams_cmdb_healt_violations_count') || '0', 10);
        rec.missing_fields_count = parseInt(gr.getValue('x_epams_cmdb_healt_missing_fields_count') || '0', 10);
        rec.regulatory_risk      = gr.getValue('x_epams_cmdb_healt_regulatory_risk') === '1';
        rec.llm_summary          = gr.getValue('x_epams_cmdb_healt_llm_summary');
        rec.priority_action      = gr.getValue('x_epams_cmdb_healt_priority_action');
        rec.correctness_summary  = gr.getValue('x_epams_cmdb_healt_correctness_summary');
        rec.completeness_summary = gr.getValue('x_epams_cmdb_healt_completeness_summary');
        rec.compliance_summary   = gr.getValue('x_epams_cmdb_healt_compliance_summary');
        rec.review_actions_count = parseInt(gr.getValue('x_epams_cmdb_healt_review_actions_count') || '0', 10);
        rec.analysis_date        = gr.getDisplayValue('x_epams_cmdb_healt_analysis_date');
        rec.templates_checked    = gr.getValue('x_epams_cmdb_healt_templates_checked');

        // Parse review_actions JSON
        rec.review_actions = [];
        try {
            var ra = gr.getValue('x_epams_cmdb_healt_review_actions');
            if (ra) { rec.review_actions = JSON.parse(ra); }
        } catch(e) { rec.review_actions = []; }

        data.records.push(rec);
        data.summary.total++;
        if (rec.health_status === 'critical')  { data.summary.critical++; }
        if (rec.health_status === 'moderate')  { data.summary.moderate++; }
        if (rec.health_status === 'minor')     { data.summary.minor++; }
        if (rec.health_status === 'healthy')   { data.summary.healthy++; }
    }

    // Get last run time
    var jobGr = new GlideRecord('x_epams_cmdb_healt_health_record');
    jobGr.addQuery('x_epams_cmdb_healt_run_status', 'complete');
    jobGr.orderByDesc('x_epams_cmdb_healt_job_completed_at');
    jobGr.setLimit(1);
    jobGr.query();
    if (jobGr.next()) {
        data.summary.lastRun = jobGr.getDisplayValue('x_epams_cmdb_healt_job_completed_at');
    }
})();
```

### Add CI action handler
```javascript
if (input) {
    data.addResult = { success: false, message: '' };

    if (input.action === 'add_ci') {
        var ciName = input.ci_name || '';
        if (!ciName) {
            data.addResult.message = 'CI name is required.';
        } else {
            // Validate CI exists in cmdb_ci
            var ciGr = new GlideRecord('cmdb_ci');
            ciGr.addQuery('name', ciName);
            ciGr.setLimit(1);
            ciGr.query();

            if (!ciGr.next()) {
                data.addResult.message = 'CI "' + ciName + '" not found in CMDB. Check the name and try again.';
            } else {
                var ciSysId = ciGr.getUniqueValue();
                // Check for existing record
                var existGr = new GlideRecord('x_epams_cmdb_healt_health_record');
                existGr.addQuery('x_epams_cmdb_healt_ci', ciSysId);
                existGr.setLimit(1);
                existGr.query();

                if (existGr.next()) {
                    data.addResult.message = 'CI "' + ciName + '" is already in the health watchlist.';
                } else {
                    // Create new record
                    var newRec = new GlideRecord('x_epams_cmdb_healt_health_record');
                    newRec.setValue('x_epams_cmdb_healt_ci', ciSysId);
                    newRec.setValue('x_epams_cmdb_healt_run_status', 'new');
                    newRec.insert();
                    data.addResult.success = true;
                    data.addResult.message = 'CI "' + ciName + '" added to watchlist. It will be evaluated in the next scheduled run.';
                }
            }
        }
    }
}
```

---

## CLIENT SCRIPT PATTERNS

### Score bar animation (run after data loads)
```javascript
$scope.animateScores = function() {
    $timeout(function() {
        $scope.scoresAnimated = true;
    }, 100);
};

// Score fill width — use ng-style
// In HTML: ng-style="{'width': scoresAnimated ? record.overall_score + '%' : '0%'}"
```

### Status colour helper
```javascript
$scope.getStatusColor = function(status) {
    var colors = {
        'critical': '#e53935',
        'moderate': '#fb8c00',
        'minor':    '#fdd835',
        'healthy':  '#43a047'
    };
    return colors[status] || '#546e7a';
};

$scope.getStatusLabel = function(status) {
    var labels = {
        'critical': 'CRITICAL',
        'moderate': 'MODERATE',
        'minor':    'MINOR',
        'healthy':  'HEALTHY'
    };
    return labels[status] || status.toUpperCase();
};
```

### Card expand/collapse
```javascript
$scope.expandedCard = null;

$scope.toggleCard = function(record) {
    if ($scope.expandedCard && $scope.expandedCard.sys_id === record.sys_id) {
        $scope.expandedCard = null;
    } else {
        $scope.expandedCard = record;
        $timeout(function() {
            $scope.scoresAnimated = true;
        }, 150);
    }
};

$scope.isExpanded = function(record) {
    return $scope.expandedCard && $scope.expandedCard.sys_id === record.sys_id;
};
```

### Filter and search
```javascript
$scope.activeFilter = 'all';
$scope.searchQuery  = '';
$scope.sortBy       = 'score_asc';

$scope.setFilter = function(status) {
    $scope.activeFilter = status;
};

$scope.getFilteredRecords = function() {
    if (!$scope.data || !$scope.data.records) { return []; }
    var filtered = $scope.data.records.filter(function(r) {
        var matchesFilter = ($scope.activeFilter === 'all') || (r.health_status === $scope.activeFilter);
        var matchesSearch = !$scope.searchQuery ||
            r.ci_name.toLowerCase().indexOf($scope.searchQuery.toLowerCase()) !== -1;
        return matchesFilter && matchesSearch;
    });
    return filtered;
};
```

### Score delta display
```javascript
$scope.getDeltaIcon = function(delta) {
    if (!delta && delta !== 0) { return ''; }
    var d = parseInt(delta, 10);
    if (d > 0)  { return '↑'; }
    if (d < 0)  { return '↓'; }
    return '→';
};

$scope.getDeltaColor = function(delta) {
    if (!delta && delta !== 0) { return '#546e7a'; }
    var d = parseInt(delta, 10);
    if (d > 0)  { return '#43a047'; }
    if (d < 0)  { return '#e53935'; }
    return '#546e7a';
};
```

### Add CI modal
```javascript
$scope.showAddModal = false;
$scope.newCiName    = '';
$scope.addMessage   = '';
$scope.addSuccess   = false;
$scope.addLoading   = false;

$scope.openAddModal = function() {
    $scope.showAddModal = true;
    $scope.newCiName    = '';
    $scope.addMessage   = '';
    $scope.addSuccess   = false;
};

$scope.closeAddModal = function() {
    $scope.showAddModal = false;
};

$scope.submitAddCi = function() {
    if (!$scope.newCiName) { return; }
    $scope.addLoading = true;
    $scope.data.action  = 'add_ci';
    $scope.data.ci_name = $scope.newCiName;

    $scope.server.update().then(function() {
        $scope.addLoading = false;
        $scope.addSuccess = $scope.data.addResult.success;
        $scope.addMessage = $scope.data.addResult.message;
        if ($scope.addSuccess) {
            $timeout(function() {
                $scope.closeAddModal();
            }, 2000);
        }
    });
};
```

---

## KNOWN SERVICENOW SP GOTCHAS

| Problem | Fix |
|---|---|
| `c.variable` undefined | Use `$scope.variable` everywhere |
| `const`/`let` error in server script | Use only `var` |
| Arrow function `=>` error | Use `function(x) { }` |
| JSON.parse crashes server script | Always wrap in try/catch |
| ng-repeat not updating | Use `$scope.$apply()` or `$timeout` |
| Widget data not loading | Check server script returns data in `data.fieldName` |
| Boolean field from GlideRecord | Compare with `=== '1'` not `=== true` |
| Reference field display value | Use `gr.getDisplayValue('field')` not `gr.getValue()` |
| Integer from GlideRecord | Wrap in `parseInt(..., 10)` |
