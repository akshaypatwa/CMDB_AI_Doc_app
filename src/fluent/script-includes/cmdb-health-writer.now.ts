import { ScriptInclude } from '@servicenow/sdk/core'

export const cmdbHealthWriter = ScriptInclude({
    $id: Now.ID['cmdb_health_writer_si'],
    name: 'CMDBHealthWriter',
    description:
        'Writes CCC evaluation results and LLM response to x_epams_cmdb_healt_health_record. Handles score delta calculation. Never re-runs evaluation.',
    script: Now.include('../../server/CMDBHealthWriter.server.js'),
    clientCallable: false,
    apiName: 'x_epams_cmdb_healt.CMDBHealthWriter',
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})
