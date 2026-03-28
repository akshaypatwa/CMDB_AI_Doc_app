import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_epams_cmdb_healt_health_record',
    view: default_view,
    columns: [
        'x_epams_cmdb_healt_analysis_date',
        'x_epams_cmdb_healt_autofix_actions',
        'x_epams_cmdb_healt_autofix_status',
        'x_epams_cmdb_healt_ci',
        'x_epams_cmdb_healt_ci_class',
        'x_epams_cmdb_healt_completeness_score',
        'x_epams_cmdb_healt_compliance_score',
        'x_epams_cmdb_healt_correctness_score',
        'x_epams_cmdb_healt_environment',
        'x_epams_cmdb_healt_error_log',
    ],
})
