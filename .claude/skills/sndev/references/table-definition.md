# Table Definition — `u_cmdb_health_record`

The only custom table in the app. One record per CI. Overwritten on each nightly run. Never pre-populate with blank rows — a row is only created when the Scheduled Job processes a CI.

## Complete TypeScript Definition

```typescript
import {
  Table,
  StringColumn,
  IntegerColumn,
  BooleanColumn,
  DateTimeColumn,
  ReferenceColumn,
  ChoiceColumn
} from '@servicenow/sdk/core'

// Replace x_<scope> with the actual scope from now.config.json
export const cmdbHealthRecord = Table({
  name: 'x_<scope>_health_record',
  label: 'CMDB Health Record',
  schema: {

    // ── CI Identity ──────────────────────────────────────────────────
    x_<scope>_ci: ReferenceColumn({
      label: 'CI',
      reference: 'cmdb_ci',
      mandatory: true
    }),
    x_<scope>_ci_class: StringColumn({
      label: 'CI Class',
      maxLength: 100
    }),
    x_<scope>_environment: StringColumn({
      label: 'Environment',
      maxLength: 100
    }),
    x_<scope>_analysis_date: DateTimeColumn({
      label: 'Analysis Date'
    }),

    // ── Run Lifecycle ────────────────────────────────────────────────
    // NEW        → user just added this CI, never evaluated
    // EVALUATING → job has picked it up, prevents duplicate execution
    // EVALUATED  → payload computed and stored, LLM not yet called
    // COMPLETE   → LLM response received, all fields populated
    // FAILED     → something broke, check u_error_log
    x_<scope>_run_status: ChoiceColumn({
      label: 'Run Status',
      choices: {
        new:        { label: 'New' },
        evaluating: { label: 'Evaluating' },
        evaluated:  { label: 'Evaluated' },
        complete:   { label: 'Complete' },
        failed:     { label: 'Failed' }
      },
      default: 'new'
    }),
    x_<scope>_retry_count: IntegerColumn({
      label: 'Retry Count'
    }),
    x_<scope>_error_log: StringColumn({
      label: 'Error Log',
      maxLength: 4000
    }),

    // ── Health Scores ────────────────────────────────────────────────
    // All scores are 0–100. Computed by script, not LLM.
    // Weights: Correctness 40%, Completeness 30%, Compliance 30%
    // CRITICAL regulatory violation hard-caps overall score at 40.
    x_<scope>_overall_health_score: IntegerColumn({
      label: 'Overall Health Score'
    }),
    x_<scope>_health_status: ChoiceColumn({
      label: 'Health Status',
      choices: {
        healthy:  { label: 'Healthy'  },   // score >= 80
        minor:    { label: 'Minor'    },   // score >= 60
        moderate: { label: 'Moderate' },   // score >= 40
        critical: { label: 'Critical' }    // score < 40
      }
    }),
    x_<scope>_correctness_score: IntegerColumn({
      label: 'Correctness Score'
    }),
    x_<scope>_completeness_score: IntegerColumn({
      label: 'Completeness Score'
    }),
    x_<scope>_compliance_score: IntegerColumn({
      label: 'Compliance Score'
    }),

    // ── Score History ────────────────────────────────────────────────
    // u_previous_score: read from current row BEFORE overwriting
    // u_score_delta: current minus previous (can be negative)
    x_<scope>_previous_score: IntegerColumn({
      label: 'Previous Health Score'
    }),
    x_<scope>_score_delta: IntegerColumn({
      label: 'Score Delta'
    }),

    // ── Quick Flags ──────────────────────────────────────────────────
    x_<scope>_is_stale: BooleanColumn({
      label: 'Is Stale'
    }),
    x_<scope>_is_orphan: BooleanColumn({
      label: 'Is Orphan'
    }),
    x_<scope>_has_duplicates: BooleanColumn({
      label: 'Has Duplicates'
    }),
    x_<scope>_violations_count: IntegerColumn({
      label: 'Violations Count'
    }),
    x_<scope>_missing_fields_count: IntegerColumn({
      label: 'Missing Fields Count'
    }),

    // ── LLM Output Fields ────────────────────────────────────────────
    // Populated in Phase 2 (LLM phase) of the Scheduled Job.
    // u_llm_summary: max 1000 chars — factual summary for portal headline
    // u_priority_action: max 500 chars — single most critical action
    // u_autofix_actions: JSON array — actions LLM says are safe to auto-apply
    // u_review_actions: JSON array — actions requiring human review
    // u_full_llm_response: complete raw LLM response JSON
    // u_raw_payload_json: what was SENT to LLM — enables retry without re-evaluation
    x_<scope>_llm_summary: StringColumn({
      label: 'LLM Health Summary',
      maxLength: 1000
    }),
    x_<scope>_priority_action: StringColumn({
      label: 'Priority Action',
      maxLength: 500
    }),
    x_<scope>_autofix_actions: StringColumn({
      label: 'Auto-Fix Actions',
      maxLength: 8000
    }),
    x_<scope>_review_actions: StringColumn({
      label: 'Review Required Actions',
      maxLength: 8000
    }),
    x_<scope>_full_llm_response: StringColumn({
      label: 'Full LLM Response',
      maxLength: 8000
    }),
    x_<scope>_raw_payload_json: StringColumn({
      label: 'Raw Payload Sent to LLM',
      maxLength: 8000
    }),

    // ── Auto-Fix Tracking ────────────────────────────────────────────
    x_<scope>_autofix_status: ChoiceColumn({
      label: 'Auto-Fix Status',
      choices: {
        pending:   { label: 'Pending'   },
        partial:   { label: 'Partial'   },
        completed: { label: 'Completed' },
        failed:    { label: 'Failed'    }
      },
      default: 'pending'
    }),

    // ── Review Tracking ──────────────────────────────────────────────
    x_<scope>_reviewed_by: ReferenceColumn({
      label: 'Reviewed By',
      reference: 'sys_user'
    }),
    x_<scope>_review_date: DateTimeColumn({
      label: 'Review Date'
    })
  }
})
```

## Critical Rules

- `x_<scope>_run_status` choices use `default: 'new'` — NOT `defaultValue`
- `x_<scope>_ci` references `cmdb_ci` — run `now-sdk dependencies` first so the type is available
- `x_<scope>_reviewed_by` references `sys_user` — also needs type defs
- All JSON-stored fields (`autofix_actions`, `review_actions`, `full_llm_response`, `raw_payload_json`) use `StringColumn` with high `maxLength` — ServiceNow has no native JSON column type in Fluent
- Violations and recommendations live inside those JSON fields — NOT in separate rows
