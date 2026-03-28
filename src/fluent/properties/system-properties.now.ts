import { Record } from '@servicenow/sdk/core'

// ── LLM Configuration ────────────────────────────────────────────────────────

Record({
    $id: Now.ID['prop_llm_endpoint'],
    table: 'sys_properties',
    data: {
        name: 'cmdb_health.llm.endpoint',
        value: '',
        description: 'REST endpoint for the LLM API',
        type: 'string',
        private: false,
        ignore_cache: false,
        is_private: false,
    },
})

Record({
    $id: Now.ID['prop_llm_api_key'],
    table: 'sys_properties',
    data: {
        name: 'cmdb_health.llm.api_key',
        value: '',
        description: 'Bearer token / API key for LLM authentication',
        type: 'password2',
        private: true,
        ignore_cache: false,
        is_private: false,
    },
})

Record({
    $id: Now.ID['prop_llm_model'],
    table: 'sys_properties',
    data: {
        name: 'cmdb_health.llm.model',
        value: 'claude-sonnet-4-20250514',
        description: 'LLM model identifier',
        type: 'string',
        private: false,
        ignore_cache: false,
        is_private: false,
    },
})

Record({
    $id: Now.ID['prop_llm_system_prompt'],
    table: 'sys_properties',
    data: {
        name: 'cmdb_health.llm.system_prompt',
        value: '',
        description: 'Combined CCC system prompt. Paste full prompt here after deploy.',
        type: 'string',
        private: false,
        ignore_cache: false,
        is_private: false,
    },
})

// ── Governance Configuration ──────────────────────────────────────────────────

Record({
    $id: Now.ID['prop_restricted_fields'],
    table: 'sys_properties',
    data: {
        name: 'cmdb_health.governance.restricted_fields',
        value: 'owned_by,business_criticality',
        description: 'Comma-separated fields the LLM must never recommend modifying',
        type: 'string',
        private: false,
        ignore_cache: false,
        is_private: false,
    },
})

Record({
    $id: Now.ID['prop_safe_autofix_fields'],
    table: 'sys_properties',
    data: {
        name: 'cmdb_health.governance.safe_autofix_fields',
        value: 'operational_status',
        description: 'Comma-separated fields where AUTO_FIX is permitted',
        type: 'string',
        private: false,
        ignore_cache: false,
        is_private: false,
    },
})

Record({
    $id: Now.ID['prop_allow_retirement'],
    table: 'sys_properties',
    data: {
        name: 'cmdb_health.governance.allow_retirement',
        value: 'true',
        description: 'If false, LLM must never recommend retiring a CI',
        type: 'string',
        private: false,
        ignore_cache: false,
        is_private: false,
    },
})

Record({
    $id: Now.ID['prop_allow_merge'],
    table: 'sys_properties',
    data: {
        name: 'cmdb_health.governance.allow_merge',
        value: 'true',
        description: 'If false, LLM must never recommend merging CIs',
        type: 'string',
        private: false,
        ignore_cache: false,
        is_private: false,
    },
})
