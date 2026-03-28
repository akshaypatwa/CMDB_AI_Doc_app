import { Record } from '@servicenow/sdk/core'

// Deploys the CMDB Health Doctor nightly scheduled job (sysauto_script).
// Runs daily at 02:00 AM. Calls CMDBHealthEvaluator → CMDBHealthWriter (Phase 1)
// then CMDBHealthLLM → CMDBHealthWriter (Phase 2) for each CI in scope.
Record({
    $id: Now.ID['cmdb_health_nightly_job'],
    table: 'sysauto_script',
    data: {
        name: 'CMDB Health Doctor — Nightly Run',
        run_type: 'daily',
        run_time: '2026-03-26 17:53:07',
        active: true,
        description: 'Nightly CMDB Health evaluation and LLM enrichment. Phase 1: CCC scoring. Phase 2: LLM insights.',
        script: Now.include('../../server/CMDBHealthJob.server.js'),
        conditional: 'false',
        run_dayofmonth: '1',
        run_dayofweek: '1',
        upgrade_safe: 'false',
    },
})
