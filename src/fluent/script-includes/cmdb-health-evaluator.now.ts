import { ScriptInclude } from '@servicenow/sdk/core'

export const cmdbHealthEvaluator = ScriptInclude({
    $id: Now.ID['cmdb_health_evaluator_si'],
    name: 'CMDBHealthEvaluator',
    description:
        'Runs full CCC evaluation for a single CI. Returns merged JSON payload and scores. Does not write to table. Does not call LLM.',
    script: Now.include('../../server/CMDBHealthEvaluator.server.js'),
    clientCallable: false,
    apiName: 'x_epams_cmdb_healt.CMDBHealthEvaluator',
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})
