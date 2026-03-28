import { Property } from '@servicenow/sdk/core'

Property({
    $id: Now.ID['5ca3be6287777a90a5d8ddbabbbb3595'],
    name: 'x_epams_cmdb_healt.governance.restricted_fields',
    value: 'owned_by,business_criticality',
    description: 'Comma-separated fields the LLM must never recommend modifying',
    ignoreCache: true,
})
