import { ScriptInclude } from '@servicenow/sdk/core'

export const cmdbHealthLlm = ScriptInclude({
    $id: Now.ID['cmdb_health_llm_si'],
    name: 'CMDBHealthLLM',
    description:
        'Calls the configured LLM REST endpoint with the merged CI health payload. Returns parsed LLM response. Does not write to table.',
    script: Now.include('../../server/CMDBHealthLLM.server.js'),
    clientCallable: false,
    apiName: 'x_epams_cmdb_healt.CMDBHealthLLM',
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})
