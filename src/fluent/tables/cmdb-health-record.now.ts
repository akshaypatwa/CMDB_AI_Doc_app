import {
    Table,
    StringColumn,
    IntegerColumn,
    BooleanColumn,
    DateTimeColumn,
    ReferenceColumn,
    ChoiceColumn,
} from '@servicenow/sdk/core'

export const x_epams_cmdb_healt_health_record = Table({
    name: 'x_epams_cmdb_healt_health_record',
    label: 'CMDB Health Record',
    schema: {
        // ── CI Identity ──────────────────────────────────────────────────
        x_epams_cmdb_healt_ci: ReferenceColumn({
            label: 'CI',
            referenceTable: 'cmdb_ci',
            mandatory: true,
            attributes: {
                encode_utf8: false,
            },
        }),
        x_epams_cmdb_healt_ci_class: StringColumn({
            label: 'CI Class',
            maxLength: 100,
        }),
        x_epams_cmdb_healt_environment: StringColumn({
            label: 'Environment',
            maxLength: 100,
        }),
        x_epams_cmdb_healt_analysis_date: DateTimeColumn({
            label: 'Analysis Date',
        }),

        // ── Run Lifecycle ────────────────────────────────────────────────
        x_epams_cmdb_healt_run_status: ChoiceColumn({
            label: 'Run Status',
            choices: {
                new: { label: 'New' },
                evaluating: { label: 'Evaluating' },
                evaluated: { label: 'Evaluated' },
                complete: { label: 'Complete' },
                failed: { label: 'Failed' },
            },
            default: 'new',
            dropdown: 'dropdown_with_none',
        }),
        x_epams_cmdb_healt_retry_count: IntegerColumn({
            label: 'Retry Count',
        }),
        x_epams_cmdb_healt_error_log: StringColumn({
            label: 'Error Log',
            maxLength: 4000,
        }),

        // ── Job Progress Tracking ─────────────────────────────────────────
        x_epams_cmdb_healt_last_stage: StringColumn({
            label: 'Last Stage',
            maxLength: 500,
        }),
        x_epams_cmdb_healt_stage_updated_at: DateTimeColumn({
            label: 'Stage Updated At',
        }),
        x_epams_cmdb_healt_job_started_at: DateTimeColumn({
            label: 'Job Started At',
        }),
        x_epams_cmdb_healt_job_completed_at: DateTimeColumn({
            label: 'Job Completed At',
        }),

        // ── Health Scores ────────────────────────────────────────────────
        x_epams_cmdb_healt_overall_health_score: IntegerColumn({
            label: 'Overall Health Score',
        }),
        x_epams_cmdb_healt_health_status: ChoiceColumn({
            label: 'Health Status',
            choices: {
                healthy: { label: 'Healthy' },
                minor: { label: 'Minor' },
                moderate: { label: 'Moderate' },
                critical: { label: 'Critical' },
            },
            dropdown: 'dropdown_with_none',
        }),
        x_epams_cmdb_healt_correctness_score: IntegerColumn({
            label: 'Correctness Score',
        }),
        x_epams_cmdb_healt_completeness_score: IntegerColumn({
            label: 'Completeness Score',
        }),
        x_epams_cmdb_healt_compliance_score: IntegerColumn({
            label: 'Compliance Score',
        }),

        // ── Score History ────────────────────────────────────────────────
        x_epams_cmdb_healt_previous_score: IntegerColumn({
            label: 'Previous Health Score',
        }),
        x_epams_cmdb_healt_score_delta: IntegerColumn({
            label: 'Score Delta',
        }),

        // ── Quick Flags ──────────────────────────────────────────────────
        x_epams_cmdb_healt_is_stale: BooleanColumn({
            label: 'Is Stale',
        }),
        x_epams_cmdb_healt_is_orphan: BooleanColumn({
            label: 'Is Orphan',
        }),
        x_epams_cmdb_healt_has_duplicates: BooleanColumn({
            label: 'Has Duplicates',
        }),
        x_epams_cmdb_healt_duplicate_count: IntegerColumn({
            label: 'Duplicate Count',
        }),
        x_epams_cmdb_healt_violations_count: IntegerColumn({
            label: 'Violations Count',
        }),
        x_epams_cmdb_healt_missing_fields_count: IntegerColumn({
            label: 'Missing Fields Count',
        }),
        x_epams_cmdb_healt_regulatory_risk: BooleanColumn({
            label: 'Regulatory Risk',
        }),

        // ── Portal Card Surface — Action Counts ──────────────────────────
        // Stored as integers so portal widgets can display badges without
        // parsing JSON arrays (e.g. "3 actions pending", "1 high-risk").
        x_epams_cmdb_healt_review_actions_count: IntegerColumn({
            label: 'Review Actions Count',
        }),
        x_epams_cmdb_healt_autofix_actions_count: IntegerColumn({
            label: 'Auto-Fix Actions Count',
        }),
        x_epams_cmdb_healt_high_risk_count: IntegerColumn({
            label: 'High Risk Actions Count',
        }),
        x_epams_cmdb_healt_templates_checked: IntegerColumn({
            label: 'Compliance Templates Checked',
        }),

        // ── Portal Expanded View — Dimension Summaries ────────────────────
        // Human-readable narrative per dimension, shown when a card is expanded.
        // Avoids portal JS having to parse full_llm_response JSON.
        x_epams_cmdb_healt_correctness_summary: StringColumn({
            label: 'Correctness Summary',
            maxLength: 1000,
        }),
        x_epams_cmdb_healt_completeness_summary: StringColumn({
            label: 'Completeness Summary',
            maxLength: 500,
        }),
        x_epams_cmdb_healt_compliance_summary: StringColumn({
            label: 'Compliance Summary',
            maxLength: 500,
        }),

        // ── Portal Expanded View — Field-Level Detail ─────────────────────
        // Comma-separated list of field names needing human review
        // (e.g. "os, cpu_type"). Displayed as a chip list on the expanded card.
        x_epams_cmdb_healt_fields_review: StringColumn({
            label: 'Fields Needing Review',
            maxLength: 500,
        }),

        // ── LLM Output Fields ────────────────────────────────────────────
        x_epams_cmdb_healt_llm_summary: StringColumn({
            label: 'LLM Health Summary',
            maxLength: 1000,
        }),
        x_epams_cmdb_healt_priority_action: StringColumn({
            label: 'Priority Action',
            maxLength: 500,
        }),
        x_epams_cmdb_healt_autofix_actions: StringColumn({
            label: 'Auto-Fix Actions',
            maxLength: 8000,
        }),
        x_epams_cmdb_healt_review_actions: StringColumn({
            label: 'Review Required Actions',
            maxLength: 8000,
        }),
        x_epams_cmdb_healt_full_llm_response: StringColumn({
            label: 'Full LLM Response',
            maxLength: 8000,
        }),
        x_epams_cmdb_healt_raw_payload_json: StringColumn({
            label: 'Raw Payload Sent to LLM',
            maxLength: 8000,
        }),

        // ── Auto-Fix Tracking ────────────────────────────────────────────
        x_epams_cmdb_healt_autofix_status: ChoiceColumn({
            label: 'Auto-Fix Status',
            choices: {
                pending: { label: 'Pending' },
                partial: { label: 'Partial' },
                completed: { label: 'Completed' },
                failed: { label: 'Failed' },
            },
            default: 'pending',
            dropdown: 'dropdown_with_none',
        }),

        // ── Review Tracking ──────────────────────────────────────────────
        // review_status drives the portal card's workflow badge and allows
        // filtering by "needs attention" vs "in progress" vs "resolved".
        x_epams_cmdb_healt_review_status: ChoiceColumn({
            label: 'Review Status',
            choices: {
                pending:     { label: 'Pending' },
                in_progress: { label: 'In Progress' },
                resolved:    { label: 'Resolved' },
            },
            default: 'pending',
            dropdown: 'dropdown_with_none',
        }),
        x_epams_cmdb_healt_reviewed_by: ReferenceColumn({
            label: 'Reviewed By',
            referenceTable: 'sys_user',
            attributes: {
                encode_utf8: false,
            },
        }),
        x_epams_cmdb_healt_review_date: DateTimeColumn({
            label: 'Review Date',
        }),
    },
    index: [
        {
            name: 'index',
            unique: false,
            element: 'x_epams_cmdb_healt_ci',
        },
        {
            name: 'index2',
            unique: false,
            element: 'x_epams_cmdb_healt_reviewed_by',
        },
    ],
})
