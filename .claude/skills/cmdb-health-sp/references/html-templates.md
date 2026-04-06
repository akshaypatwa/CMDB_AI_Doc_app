# HTML Templates

All templates use AngularJS directives. Use `$scope` bindings (`{{varName}}`, `ng-click="fn()"`), never `c.`.

---

## Widget 1: Header (`cmdb_health_header`)

```html
<div class="cmdb-header scanlines" style="padding: 20px 24px; position: relative;">

  <!-- Title row -->
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <span ng-if="summary.hasCritical" class="alert-dot"></span>
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #e8eaf6; letter-spacing: 0.04em;">
        CMDB Health Doctor
      </h1>
      <span style="font-size: 11px; color: #546e7a; font-family: 'Courier New', monospace;">
        Last run: {{summary.lastRun || 'Never'}}
      </span>
    </div>
    <button class="btn-skeuo" ng-click="refresh()"
            style="padding: 8px 18px; border-radius: 8px; color: #4fc3f7; font-size: 12px; font-weight: 600; letter-spacing: 0.06em;">
      &#8635; REFRESH
    </button>
  </div>

  <!-- Summary count cards -->
  <div style="display: flex; gap: 12px; flex-wrap: wrap;">
    <div class="summary-count-card">
      <div class="count-number count-total">{{summary.total}}</div>
      <div class="count-label">Total</div>
    </div>
    <div class="summary-count-card">
      <div class="count-number count-critical">{{summary.critical}}</div>
      <div class="count-label">Critical</div>
    </div>
    <div class="summary-count-card">
      <div class="count-number count-moderate">{{summary.moderate}}</div>
      <div class="count-label">Moderate</div>
    </div>
    <div class="summary-count-card">
      <div class="count-number count-minor">{{summary.minor}}</div>
      <div class="count-label">Minor</div>
    </div>
    <div class="summary-count-card">
      <div class="count-number count-healthy">{{summary.healthy}}</div>
      <div class="count-label">Healthy</div>
    </div>
  </div>

</div>
```

---

## Widget 2: Dashboard — Filter Bar

```html
<div style="padding: 16px 0; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">

  <!-- Status filter pills -->
  <div class="filter-pills">
    <button class="filter-pill" ng-class="{'active-all': activeFilter === 'all'}"
            ng-click="setFilter('all')">All</button>
    <button class="filter-pill" ng-class="{'active-critical': activeFilter === 'critical'}"
            ng-click="setFilter('critical')">Critical</button>
    <button class="filter-pill" ng-class="{'active-moderate': activeFilter === 'moderate'}"
            ng-click="setFilter('moderate')">Moderate</button>
    <button class="filter-pill" ng-class="{'active-minor': activeFilter === 'minor'}"
            ng-click="setFilter('minor')">Minor</button>
    <button class="filter-pill" ng-class="{'active-healthy': activeFilter === 'healthy'}"
            ng-click="setFilter('healthy')">Healthy</button>
  </div>

  <!-- Environment dropdown -->
  <select ng-model="selectedEnv" ng-change="setEnv(selectedEnv)"
          style="background: #1a1a2e; color: #9fa8da; border: 1px solid rgba(255,255,255,0.1);
                 border-radius: 8px; padding: 6px 12px; font-size: 12px;">
    <option ng-repeat="env in environments" value="{{env}}">{{env}}</option>
  </select>

  <!-- Sort dropdown -->
  <select ng-model="sortBy"
          style="background: #1a1a2e; color: #9fa8da; border: 1px solid rgba(255,255,255,0.1);
                 border-radius: 8px; padding: 6px 12px; font-size: 12px;">
    <option value="score_asc">Score: Worst First</option>
    <option value="score_desc">Score: Best First</option>
    <option value="name">CI Name A–Z</option>
    <option value="date">Last Analysed</option>
  </select>

  <!-- Search box -->
  <input type="text" ng-model="searchQuery" placeholder="Search CI name..."
         style="background: #1a1a2e; color: #e8eaf6; border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px; padding: 7px 14px; font-size: 12px; flex: 1; min-width: 160px;"/>

  <!-- Add CI button -->
  <button class="btn-skeuo" ng-click="openAddModal()"
          style="padding: 8px 18px; border-radius: 8px; color: #43a047; font-size: 12px;
                 font-weight: 600; letter-spacing: 0.06em; white-space: nowrap;">
    + ADD CI
  </button>

</div>
```

---

## Widget 2: CI Card Grid

```html
<!-- Cards grid — 3 col desktop, stacks on mobile -->
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">

  <div ng-repeat="record in getFilteredRecords() track by record.sys_id">

    <!-- CI Card -->
    <div class="ci-card embossed-card card-stripe-{{record.health_status}}"
         ng-class="{'expanded': isExpanded(record)}"
         ng-click="toggleCard(record)"
         style="padding: 0; border-radius: 12px; overflow: hidden;">

      <!-- Card body -->
      <div style="padding: 16px 18px;">

        <!-- Top row: LED + CI name + score -->
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <div class="led-{{record.health_status}}" style="flex-shrink: 0;"></div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; font-weight: 700; color: #e8eaf6;
                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {{record.ci_name}}
            </div>
            <div style="font-size: 11px; color: #546e7a; margin-top: 2px;">
              {{record.ci_class}} &middot; {{record.environment || 'Unknown'}}
            </div>
          </div>
          <!-- Overall score badge -->
          <div style="flex-shrink: 0; text-align: right;">
            <div style="font-size: 22px; font-weight: 800; color: {{getStatusColor(record.health_status)}}; line-height: 1;">
              {{record.overall_score}}
            </div>
            <div style="font-size: 9px; color: #546e7a; letter-spacing: 0.08em;">SCORE</div>
          </div>
        </div>

        <!-- Score bars: Correctness / Completeness / Compliance -->
        <div style="margin-bottom: 12px;">
          <div ng-repeat="dim in [
              {label: 'COR', key: 'correctness_score'},
              {label: 'COM', key: 'completeness_score'},
              {label: 'CPL', key: 'compliance_score'}
            ]" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <div style="font-size: 9px; font-weight: 700; letter-spacing: 0.07em;
                        color: #546e7a; width: 28px; flex-shrink: 0;">{{dim.label}}</div>
            <div class="score-track" style="flex: 1;">
              <div class="score-fill"
                   ng-style="{
                     'width':  scoresAnimated ? (record[dim.key] + '%') : '0%',
                     'background': getStatusColor(record.health_status),
                     'color': getStatusColor(record.health_status)
                   }">
              </div>
            </div>
            <div style="font-size: 11px; color: #9fa8da; width: 28px; text-align: right;">
              {{record[dim.key]}}
            </div>
          </div>
        </div>

        <!-- Issue badge pills -->
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
          <span class="badge-pill badge-stale"     ng-if="record.is_stale">STALE</span>
          <span class="badge-pill badge-orphan"    ng-if="record.is_orphan">ORPHAN</span>
          <span class="badge-pill badge-duplicate" ng-if="record.duplicate_count > 0">{{record.duplicate_count}} DUPES</span>
          <span class="badge-pill badge-violation" ng-if="record.violations_count > 0">{{record.violations_count}} VIOLATIONS</span>
          <span class="badge-pill badge-missing"   ng-if="record.missing_fields_count > 0">{{record.missing_fields_count}} MISSING</span>
        </div>

        <!-- Priority action (2-line truncated) -->
        <div style="font-size: 11px; color: #9fa8da; line-height: 1.5;
                    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          {{record.priority_action || 'No priority action identified.'}}
        </div>

      </div>

      <!-- Card footer -->
      <div style="padding: 8px 18px; border-top: 1px solid rgba(255,255,255,0.05);
                  display: flex; align-items: center; justify-content: space-between;">
        <div style="font-size: 10px; color: #546e7a;">
          {{record.review_actions_count}} actions &middot; {{record.analysis_date}}
        </div>
        <div style="font-size: 12px; font-weight: 700;"
             ng-style="{'color': getDeltaColor(record.score_delta)}">
          {{getDeltaIcon(record.score_delta)}} {{record.score_delta > 0 ? '+' : ''}}{{record.score_delta}}
        </div>
      </div>

    </div>
    <!-- END CI Card -->

    <!-- Expanded Detail Panel — rendered inside the ng-repeat, full grid width -->
    <div class="detail-panel" ng-class="{'open': isExpanded(record)}"
         style="grid-column: 1 / -1;">
      <div style="padding: 24px; margin-top: -8px; background: linear-gradient(145deg, #1a2038 0%, #0d1525 100%);
                  border: 1px solid rgba(255,255,255,0.07); border-radius: 12px;">

        <!-- Overall score + delta -->
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
          <div style="font-size: 48px; font-weight: 800; color: {{getStatusColor(record.health_status)}}; line-height: 1;">
            {{record.overall_score}}
          </div>
          <div>
            <div style="font-size: 14px; font-weight: 700; color: #e8eaf6;">{{getStatusLabel(record.health_status)}}</div>
            <div style="font-size: 12px;" ng-style="{'color': getDeltaColor(record.score_delta)}">
              {{getDeltaIcon(record.score_delta)}} {{record.score_delta > 0 ? '+' : ''}}{{record.score_delta}} from last run
            </div>
          </div>
        </div>

        <!-- AI Summary terminal readout -->
        <div class="terminal-readout" style="margin-bottom: 20px;">{{record.llm_summary}}</div>

        <!-- Priority Action highlighted box -->
        <div style="padding: 14px 18px; border-left: 4px solid #fb8c00;
                    background: rgba(251,140,0,0.08); border-radius: 0 8px 8px 0; margin-bottom: 20px;">
          <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #fb8c00; margin-bottom: 6px;">
            PRIORITY ACTION
          </div>
          <div style="font-size: 13px; color: #e8eaf6; line-height: 1.5;">{{record.priority_action}}</div>
        </div>

        <!-- Accordion: Correctness -->
        <div style="margin-bottom: 8px;">
          <div class="accordion-header" ng-class="{'open': isAccordionOpen('cor_' + record.sys_id)}"
               ng-click="toggleAccordion('cor_' + record.sys_id)">
            <span style="font-size: 12px; font-weight: 700; letter-spacing: 0.06em; color: #e8eaf6;">
              CORRECTNESS &nbsp;<span style="color: #4fc3f7;">{{record.correctness_score}}</span>
            </span>
            <span class="chevron">&#9660;</span>
          </div>
          <div class="accordion-body" ng-class="{'open': isAccordionOpen('cor_' + record.sys_id)}">
            <p style="color: #9fa8da; font-size: 12px; line-height: 1.6; margin: 0;">{{record.correctness_summary}}</p>
          </div>
        </div>

        <!-- Accordion: Completeness -->
        <div style="margin-bottom: 8px;">
          <div class="accordion-header" ng-class="{'open': isAccordionOpen('cmp_' + record.sys_id)}"
               ng-click="toggleAccordion('cmp_' + record.sys_id)">
            <span style="font-size: 12px; font-weight: 700; letter-spacing: 0.06em; color: #e8eaf6;">
              COMPLETENESS &nbsp;<span style="color: #4fc3f7;">{{record.completeness_score}}</span>
            </span>
            <span class="chevron">&#9660;</span>
          </div>
          <div class="accordion-body" ng-class="{'open': isAccordionOpen('cmp_' + record.sys_id)}">
            <p style="color: #9fa8da; font-size: 12px; line-height: 1.6; margin: 0;">{{record.completeness_summary}}</p>
          </div>
        </div>

        <!-- Accordion: Compliance -->
        <div style="margin-bottom: 20px;">
          <div class="accordion-header" ng-class="{'open': isAccordionOpen('cpl_' + record.sys_id)}"
               ng-click="toggleAccordion('cpl_' + record.sys_id)">
            <span style="font-size: 12px; font-weight: 700; letter-spacing: 0.06em; color: #e8eaf6;">
              COMPLIANCE &nbsp;<span style="color: #4fc3f7;">{{record.compliance_score}}</span>
            </span>
            <span class="chevron">&#9660;</span>
          </div>
          <div class="accordion-body" ng-class="{'open': isAccordionOpen('cpl_' + record.sys_id)}">
            <p style="color: #9fa8da; font-size: 12px; line-height: 1.6; margin: 0;">{{record.compliance_summary}}</p>
          </div>
        </div>

        <!-- Review Actions list -->
        <div ng-if="record.review_actions && record.review_actions.length > 0">
          <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #546e7a; margin-bottom: 12px;">
            REVIEW ACTIONS ({{record.review_actions.length}})
          </div>
          <div ng-repeat="action in record.review_actions"
               style="padding: 12px 14px; margin-bottom: 8px; border-radius: 8px;
                      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge-pill"
                    ng-class="{
                      'badge-violation': action.risk === 'CRITICAL',
                      'badge-duplicate': action.risk === 'HIGH',
                      'badge-missing':   action.risk === 'MEDIUM'
                    }">{{action.risk}}</span>
              <span class="badge-pill badge-orphan"
                    style="text-transform: capitalize;">{{action.dimension}}</span>
              <span style="font-size: 12px; font-weight: 600; color: #e8eaf6;">{{action.title}}</span>
            </div>
            <div style="font-size: 11px; color: #9fa8da; line-height: 1.5;">{{action.action}}</div>
            <div style="font-size: 11px; color: #546e7a; margin-top: 4px; font-style: italic;">{{action.reason}}</div>
          </div>
        </div>

      </div>
    </div>
    <!-- END Detail Panel -->

  </div>
</div>
```

---

## Widget 2: Add CI Modal

```html
<!-- Modal backdrop -->
<div class="modal-backdrop" ng-if="showAddModal" ng-click="closeAddModal()">
  <div class="modal-dialog" ng-click="$event.stopPropagation()">

    <div style="font-size: 14px; font-weight: 700; color: #e8eaf6; margin-bottom: 20px; letter-spacing: 0.04em;">
      ADD CI TO WATCHLIST
    </div>

    <input type="text" ng-model="newCiName" placeholder="Enter exact CI name (e.g. PROD-DB-01)"
           ng-keyup="$event.keyCode == 13 && submitAddCi()"
           style="width: 100%; box-sizing: border-box; background: #0d1525; color: #e8eaf6;
                  border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 10px 14px;
                  font-size: 13px; margin-bottom: 16px;"/>

    <div ng-if="addMessage" style="padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 16px;"
         ng-style="{
           'background': addSuccess ? 'rgba(67,160,71,0.15)' : 'rgba(229,57,53,0.15)',
           'color':      addSuccess ? '#43a047' : '#e53935',
           'border':     addSuccess ? '1px solid rgba(67,160,71,0.4)' : '1px solid rgba(229,57,53,0.4)'
         }">
      {{addMessage}}
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button class="btn-skeuo" ng-click="closeAddModal()"
              style="padding: 9px 20px; border-radius: 8px; color: #546e7a; font-size: 12px;">
        CANCEL
      </button>
      <button class="btn-skeuo" ng-click="submitAddCi()" ng-disabled="addLoading || !newCiName"
              style="padding: 9px 20px; border-radius: 8px; color: #43a047; font-size: 12px; font-weight: 700;">
        <span ng-if="!addLoading">ADD CI</span>
        <span ng-if="addLoading">ADDING...</span>
      </button>
    </div>

  </div>
</div>
```

---

## Widget 2: Toast Notification

```html
<!-- Toast — place outside the main grid, at the root of the widget -->
<div class="toast" ng-if="toast"
     ng-class="{'toast-success': toast.type === 'success', 'toast-error': toast.type === 'error'}">
  {{toast.message}}
</div>
```

---

## Full Widget 2 Root Structure

```html
<div class="cmdb-dashboard scanlines" style="padding: 0 20px 40px;">

  <!-- Filter bar -->
  <!-- (paste Filter Bar template here) -->

  <!-- Cards grid + expanded panels -->
  <!-- (paste CI Card Grid template here) -->

  <!-- Add CI Modal -->
  <!-- (paste Modal template here) -->

  <!-- Toast -->
  <!-- (paste Toast template here) -->

</div>
```
