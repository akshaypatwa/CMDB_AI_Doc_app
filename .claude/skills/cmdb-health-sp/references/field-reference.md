# Field Reference — `x_epams_cmdb_healt_health_record`

## Identity Fields

```
x_epams_cmdb_healt_ci                  — Reference to cmdb_ci (display_value = CI name)
x_epams_cmdb_healt_ci_class            — String: e.g. "cmdb_ci_server"
x_epams_cmdb_healt_environment         — String: e.g. "Production"
x_epams_cmdb_healt_analysis_date       — DateTime: when last evaluated
```

## Run Status Fields

```
x_epams_cmdb_healt_run_status          — Choice: new/evaluating/evaluated/complete/failed
x_epams_cmdb_healt_retry_count         — Integer
x_epams_cmdb_healt_error_log           — String: error details if failed
x_epams_cmdb_healt_job_started_at      — DateTime
x_epams_cmdb_healt_job_completed_at    — DateTime
x_epams_cmdb_healt_last_stage          — String: last processing stage description
x_epams_cmdb_healt_stage_updated_at    — DateTime
```

## Score Fields (all Integer 0–100)

```
x_epams_cmdb_healt_overall_health_score  — 0–100
x_epams_cmdb_healt_health_status         — Choice: critical/moderate/minor/healthy
x_epams_cmdb_healt_correctness_score     — 0–100
x_epams_cmdb_healt_completeness_score    — 0–100
x_epams_cmdb_healt_compliance_score      — 0–100
x_epams_cmdb_healt_previous_score        — Integer (from last run)
x_epams_cmdb_healt_score_delta           — Integer (can be negative)
```

## Flag Fields

```
x_epams_cmdb_healt_is_stale              — Boolean
x_epams_cmdb_healt_is_orphan             — Boolean
x_epams_cmdb_healt_duplicate_count       — Integer
x_epams_cmdb_healt_violations_count      — Integer
x_epams_cmdb_healt_missing_fields_count  — Integer
x_epams_cmdb_healt_regulatory_risk       — Boolean
x_epams_cmdb_healt_templates_checked     — Integer
```

## LLM Output Fields

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

## Tracking Fields

```
x_epams_cmdb_healt_autofix_status        — Choice: pending/partial/completed/failed
x_epams_cmdb_healt_review_status         — Choice: pending/in_progress/complete
x_epams_cmdb_healt_reviewed_by           — Reference: sys_user
x_epams_cmdb_healt_review_date           — DateTime
x_epams_cmdb_healt_raw_payload_json      — String/max: payload sent to LLM
```

---

## Review Actions JSON Structure

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
