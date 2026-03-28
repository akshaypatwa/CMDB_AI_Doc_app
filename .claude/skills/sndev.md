---
name: sndev
description: >
  Build the CMDB Health Doctor ServiceNow application using the ServiceNow SDK and Fluent API (TypeScript).
  Use this skill for ALL tasks in this project: creating tables, script includes, ACLs, app menu,
  system properties, and any other metadata for the CMDB Health Doctor scoped app.
  Trigger on any mention of: "CMDB Health", "health record", "CMDBHealthEvaluator",
  "CMDBHealthLLM", "CMDBHealthWriter", "u_cmdb_health_record", "ServiceNow SDK",
  "now-sdk", "Fluent API", or any task involving building or deploying this app.
---

# CMDB Health Doctor — ServiceNow SDK Application Builder

This skill enables Claude Code to generate the CMDB Health Doctor application using the
ServiceNow SDK (now-sdk) and the Fluent DSL. Every file, field name, and pattern in this
skill is specific to this project. Do not use generic patterns — use the exact names,
field structures, and logic defined below.

---

## Project Identity

| Property      | Value                                      |
|---------------|--------------------------------------------|
| App Name      | CMDB Health Doctor                         |
| Scope         | `x_<vendor>_cmdbh` (confirm from now.config.json before generating any code) |
| Table         | `x_<scope>_health_record`                  |
| Purpose       | Nightly CI health evaluation across Correctness, Completeness, Compliance (CCC) |

**ALWAYS** read `now.config.json` first to get the exact scope prefix before writing any
table name, column name, or $id. Never guess the scope.

---

## Authentication — Already Handled

Auth credentials are stored in the system keychain. Do NOT create `.env` files or
handle credentials in code.

If the user needs to add a new auth profile:
```bash
now-sdk auth save <alias> --host https://<instance>.service-now.com --username <user> --default
```
Do NOT run auth commands yourself.

---

## Prerequisites — Check Before Writing Any Code

1. `now.config.json` must exist:
```json
{
  "scope": "x_<vendor>_cmdbh",
  "scopeId": "<sys_id_of_app>"
}
```

2. `package.json` must have SDK dependencies:
```json
{
  "type": "module",
  "scripts": {
    "build": "now-sdk build",
    "install-app": "now-sdk install",
    "transform": "now-sdk transform",
    "dependencies": "now-sdk dependencies"
  },
  "devDependencies": {
    "@servicenow/sdk": "^4.0.0",
    "@servicenow/glide": "^27.0.0"
  }
}
```

3. Type definitions fetched (needed for cmdb_ci, sys_user references):
```bash
now-sdk dependencies --auth <alias>
```

If project does not exist yet:
```bash
npx @servicenow/sdk init
```

---

## Project File Structure

```
cmdb-health-doctor/
├── now.config.json
├── package.json
├── src/
│   ├── fluent/
│   │   ├── tables/
│   │   │   └── cmdb-health-record.now.ts       ← u_cmdb_health_record table
│   │   ├── script-includes/
│   │   │   ├── cmdb-health-evaluator.now.ts     ← CMDBHealthEvaluator wrapper
│   │   │   ├── cmdb-health-llm.now.ts           ← CMDBHealthLLM wrapper
│   │   │   └── cmdb-health-writer.now.ts        ← CMDBHealthWriter wrapper
│   │   ├── acls/
│   │   │   └── cmdb-health-acls.now.ts          ← table access control
│   │   ├── properties/
│   │   │   └── system-properties.now.ts         ← sys_properties records
│   │   ├── navigation/
│   │   │   └── app-menu.now.ts                  ← app navigator menu
│   │   └── index.now.ts                         ← barrel exports
│   └── server/
│       ├── CMDBHealthEvaluator.server.js         ← full CCC evaluation logic
│       ├── CMDBHealthLLM.server.js               ← LLM REST call logic
│       └── CMDBHealthWriter.server.js            ← table write logic
└── metadata/                                     ← auto-generated, do not edit
```

---

## SDK CLI Commands

| Command | Purpose |
|---------|---------|
| `now-sdk build` | Compile Fluent TypeScript → metadata XML |
| `now-sdk install --auth <alias>` | Build + pack + deploy to instance |
| `now-sdk transform --auth <alias>` | Pull metadata from instance to local |
| `now-sdk dependencies --auth <alias>` | Fetch type defs for cmdb_ci, sys_user etc. |

Development cycle:
```bash
# 1. Write or modify Fluent code in src/fluent/*.now.ts
# 2. Build
now-sdk build
# 3. Deploy
now-sdk install --auth <alias>
```

---

## THE MAIN TABLE — `u_cmdb_health_record`

This is the only custom table in the app. It serves as both CI registry and health results store.
One record per CI. Overwritten on each nightly run. Never pre-populate with blank rows —
a row is only created when the Scheduled Job processes a CI.

### Complete Table Definition

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

    // ── Score History (for trend / delta) ────────────────────────────
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
    // These are populated in Phase 2 (LLM phase) of the Scheduled Job.
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

### Critical Table Rules

- `x_<scope>_run_status` choices use `default: 'new'` — NOT `defaultValue`
- `x_<scope>_ci` references `cmdb_ci` — run `now-sdk dependencies` first so the type is available
- `x_<scope>_reviewed_by` references `sys_user` — also needs type defs
- All JSON-stored fields (`autofix_actions`, `review_actions`, `full_llm_response`, `raw_payload_json`) use `StringColumn` with high `maxLength` — ServiceNow does not have a native JSON column type in Fluent
- Violations and recommendations live inside those JSON fields — NOT in separate rows

---

## THREE SCRIPT INCLUDES

Script Includes are defined in Fluent TypeScript wrappers but their logic lives in `.server.js`
files in `src/server/`. The Fluent wrapper registers the Script Include metadata; the `.server.js`
file contains the actual ServiceNow JavaScript.

### How Script Include Fluent Wrappers Work

```typescript
import { ScriptInclude } from '@servicenow/sdk/core'
import evaluatorScript from '../../server/CMDBHealthEvaluator.server.js'

export const cmdbHealthEvaluator = ScriptInclude({
  $id: Now.ID['cmdb_health_evaluator_si'],
  name: 'CMDBHealthEvaluator',
  description: 'Runs CCC evaluation for a single CI and returns merged JSON payload with scores',
  script: evaluatorScript,
  client_callable: false
})
```

Repeat this pattern for `CMDBHealthLLM` and `CMDBHealthWriter`.

### CMDBHealthEvaluator — Contract

- **Input**: `ciSysId` (string)
- **What it does**: runs full Correctness + Completeness + Compliance evaluation for one CI
- **Returns**: object with `{ mergedPayload, scores }` — does NOT write to table, does NOT call LLM
- **Key logic**:
  - Completeness runs first — its score feeds Correctness quality calculation
  - Peer analysis runs on missing recommended fields (4-step class hierarchy fallback via `sys_db_object`)
  - Compliance violations include `peer_benchmark` block for each violated field
  - Overall score = (Correctness × 0.40) + (Completeness × 0.30) + (Compliance × 0.30)
  - CRITICAL regulatory violation hard-caps overall score at 40
  - Governance rules loaded from System Properties (not hardcoded)

### CMDBHealthLLM — Contract

- **Input**: `mergedPayload` (JSON object)
- **What it does**: fires REST call to LLM, returns parsed response
- **Returns**: parsed LLM response object
- **Does NOT write to table**
- **All connection config from System Properties** — never hardcoded:
  - `cmdb_health.llm.endpoint`
  - `cmdb_health.llm.api_key`
  - `cmdb_health.llm.model`
  - `cmdb_health.llm.system_prompt`
- Uses `sn_ws.RESTMessageV2` for the REST call

### CMDBHealthWriter — Contract

- **Input**: `ciSysId`, `mergedPayload`, `llmResponse`, `targetStatus`
- **What it does**: writes all fields to `x_<scope>_health_record`
- **Score delta logic** (critical — must happen before write):
  1. Query existing record for this CI: `addQuery('x_<scope>_ci', ciSysId)`
  2. Read `x_<scope>_overall_health_score` → store as `x_<scope>_previous_score`
  3. Compute `x_<scope>_score_delta` = new score - previous score
  4. Then overwrite all fields
- **Sets `x_<scope>_run_status`** to whatever `targetStatus` is passed (EVALUATED or COMPLETE)
- If no previous record exists: `previous_score = null`, `score_delta = null`

---

## SYSTEM PROPERTIES

These must exist on the instance before the Scheduled Job runs. Create them as static
records via Fluent so they deploy with the app (with empty/default values that the admin
fills in post-deploy).

```typescript
import { Record } from '@servicenow/sdk/core'

// LLM Configuration
Record({
  $id: Now.ID['prop_llm_endpoint'],
  table: 'sys_properties',
  data: {
    name: 'cmdb_health.llm.endpoint',
    value: '',
    description: 'REST endpoint for the LLM API (e.g. https://api.anthropic.com/v1/messages)',
    type: 'string',
    private: false
  }
})

Record({
  $id: Now.ID['prop_llm_api_key'],
  table: 'sys_properties',
  data: {
    name: 'cmdb_health.llm.api_key',
    value: '',
    description: 'Bearer token / API key for LLM authentication',
    type: 'password2',    // encrypted storage
    private: true
  }
})

Record({
  $id: Now.ID['prop_llm_model'],
  table: 'sys_properties',
  data: {
    name: 'cmdb_health.llm.model',
    value: 'claude-sonnet-4-20250514',
    description: 'LLM model identifier',
    type: 'string',
    private: false
  }
})

Record({
  $id: Now.ID['prop_llm_system_prompt'],
  table: 'sys_properties',
  data: {
    name: 'cmdb_health.llm.system_prompt',
    value: '',
    description: 'Combined CCC system prompt for CMDB Health LLM. Paste full prompt here.',
    type: 'string',
    private: false
  }
})

// Governance Configuration
Record({
  $id: Now.ID['prop_restricted_fields'],
  table: 'sys_properties',
  data: {
    name: 'cmdb_health.governance.restricted_fields',
    value: 'owned_by,business_criticality',
    description: 'Comma-separated field names the LLM must never recommend modifying',
    type: 'string',
    private: false
  }
})

Record({
  $id: Now.ID['prop_safe_autofix_fields'],
  table: 'sys_properties',
  data: {
    name: 'cmdb_health.governance.safe_autofix_fields',
    value: 'operational_status',
    description: 'Comma-separated field names where AUTO_FIX recommendations are permitted',
    type: 'string',
    private: false
  }
})

Record({
  $id: Now.ID['prop_allow_retirement'],
  table: 'sys_properties',
  data: {
    name: 'cmdb_health.governance.allow_retirement',
    value: 'true',
    description: 'If false, LLM must never recommend retiring a CI',
    type: 'string',
    private: false
  }
})

Record({
  $id: Now.ID['prop_allow_merge'],
  table: 'sys_properties',
  data: {
    name: 'cmdb_health.governance.allow_merge',
    value: 'true',
    description: 'If false, LLM must never recommend merging CIs',
    type: 'string',
    private: false
  }
})
```

---

## ACLs

```typescript
import { Acl } from '@servicenow/sdk/core'

// CMDB admins and itil users can read health records
Acl({
  $id: Now.ID['health_record_read_acl'],
  type: 'record',
  table: 'x_<scope>_health_record',
  operation: 'read',
  roles: ['itil', 'admin', 'cmdb_read'],
  active: true
})

// Only admins can write (Scheduled Job runs as system, no ACL needed)
Acl({
  $id: Now.ID['health_record_write_acl'],
  type: 'record',
  table: 'x_<scope>_health_record',
  operation: 'write',
  roles: ['admin'],
  active: true
})

// Only admins can create records directly (portal widget uses admin context)
Acl({
  $id: Now.ID['health_record_create_acl'],
  type: 'record',
  table: 'x_<scope>_health_record',
  operation: 'create',
  roles: ['admin'],
  active: true
})
```

---

## APPLICATION MENU

```typescript
import { ApplicationMenu, Module } from '@servicenow/sdk/core'

const menu = ApplicationMenu({
  $id: Now.ID['cmdb_health_app_menu'],
  title: 'CMDB Health Doctor',
  hint: 'AI-powered CMDB health analysis and recommendations',
  order: 100
})

// All health records
Module({
  $id: Now.ID['all_health_records_module'],
  title: 'All Health Records',
  menu: menu,
  table: 'x_<scope>_health_record',
  order: 100
})

// Critical CIs only
Module({
  $id: Now.ID['critical_ci_module'],
  title: 'Critical CIs',
  menu: menu,
  table: 'x_<scope>_health_record',
  order: 200
  // filter: x_<scope>_health_status=critical applied via list filter, not in Fluent
})

// Pending review
Module({
  $id: Now.ID['pending_review_module'],
  title: 'Pending Review',
  menu: menu,
  table: 'x_<scope>_health_record',
  order: 300
})
```

---

## SCHEDULED JOB — NOT DEPLOYED VIA SDK

**Important:** The Fluent SDK does not support Scheduled Jobs as a metadata type.
The Scheduled Job must be created manually on the ServiceNow instance after deployment.

After `now-sdk install` completes, instruct the user to:

1. Navigate to **System Definition → Scheduled Jobs → New**
2. Set **Name**: `CMDB Health Doctor — Nightly Run`
3. Set **Run**: `Daily` at desired time (e.g. 02:00 AM)
4. Set **Script** to the two-phase orchestration script (see logic below)
5. Save and activate

### Scheduled Job Logic Summary (for reference when writing the server script)

```
Phase 1 — Evaluation:
  Query x_<scope>_health_record where run_status = NEW
  PLUS: run_status = COMPLETE AND CI's sys_updated_on or last_discovered changed in last 24h
  PLUS (Sundays only): run_status = COMPLETE regardless of delta

  For each CI:
    1. Set run_status = EVALUATING immediately (prevents duplicate execution)
    2. try {
         payload = CMDBHealthEvaluator.evaluate(ciSysId)
         CMDBHealthWriter.save(ciSysId, payload, null, 'EVALUATED')
       } catch(e) {
         set run_status = FAILED, write error to error_log
       }

Phase 2 — LLM:
  Query x_<scope>_health_record where run_status = EVALUATED
  PLUS: run_status = FAILED AND analysis_date < 2 hours ago AND retry_count < 3

  For each record:
    1. Read u_raw_payload_json (do NOT re-run evaluation)
    2. try {
         llmResponse = CMDBHealthLLM.call(rawPayload)
         CMDBHealthWriter.save(ciSysId, null, llmResponse, 'COMPLETE')
       } catch(e) {
         set run_status = FAILED, increment retry_count, write error_log
       }

Each CI is wrapped in its own try/catch.
One CI failure must NEVER kill the batch.
```

---

## NAMING CONVENTIONS — MANDATORY

| Element | Pattern | Example |
|---------|---------|---------|
| Table name | `x_<scope>_health_record` | `x_acme_cmdbh_health_record` |
| Column name | `x_<scope>_<field>` | `x_acme_cmdbh_run_status` |
| Script Include name | PascalCase, no prefix | `CMDBHealthEvaluator` |
| Fluent $id | unique snake_case | `cmdb_health_evaluator_si` |
| File name | kebab-case `.now.ts` | `cmdb-health-record.now.ts` |
| Server file | PascalCase `.server.js` | `CMDBHealthEvaluator.server.js` |

**Always derive scope from `now.config.json`. Never hardcode a scope value in code.**

---

## KNOWN BUILD GOTCHAS — CHECK THESE FIRST ON ANY BUILD ERROR

| Error | Cause | Fix |
|-------|-------|-----|
| `no exported member 'HTMLColumn'` | Wrong casing | Use `HtmlColumn` |
| `ChoiceColumn choices must be object` | Array syntax used | Use `{ key: { label } }` not array |
| `defaultValue does not exist` | Wrong property name | Use `default:` not `defaultValue:` |
| `'table' does not exist on createRecord` | Wrong property | Use `table_name:` |
| `TemplateValue is not defined` | Missing usage | `TemplateValue` is a global, no import needed |
| `params.trigger.email.subject` undefined | Wrong data pill path | Use `params.trigger.subject` directly |
| `Duplicate $id` | Reused Now.ID key | Every `Now.ID['key']` must be unique across entire app |
| `description` build error | String concatenation | `description` must be a single string literal — no `+` |
| `Install 403` | Insufficient role | User needs `admin` or `app_developer` role on instance |
| `Scope mismatch` | Prefix doesn't match config | All names must match `now.config.json` scope exactly |
| `Missing types for cmdb_ci` | Type defs not fetched | Run `now-sdk dependencies --auth <alias>` |

---

## IF BUILD FAILS — FETCH OFFICIAL EXAMPLES FIRST

Before guessing at a fix, fetch the relevant official SDK example:

| What you're building | Fetch this URL |
|---|---|
| Table definition | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/table-sample/src/fluent/table-simple.now.ts` |
| Table with references | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/table-sample/src/fluent/table-custom-column.now.ts` |
| Business rule | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/businessrule-sample/src/fluent/business-rule-1.now.ts` |
| ACL | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/acl-sample/src/fluent/index.now.ts` |

Full examples index: `https://github.com/ServiceNow/sdk-examples`

---

## WHAT IS NOT DEPLOYED VIA SDK — DO MANUALLY AFTER INSTALL

These must be configured on the instance after `now-sdk install`:

1. **Scheduled Job** — create manually in System Definition → Scheduled Jobs
2. **System Property values** — the properties are created by the deploy, but their values (LLM endpoint, API key, system prompt) must be filled in by the admin post-deploy
3. **Service Portal dashboard** — built separately in a later phase

---

## SECURITY REMINDERS

- NEVER put LLM API keys in source files — they go in System Properties after deploy
- Ensure `.gitignore` includes `metadata/`, `dist/`, `node_modules/`, `.now/`
- The `cmdb_health.llm.api_key` property uses `type: 'password2'` for encrypted storage
- ACLs are defined in code and deploy with the app — do not skip them
- The Scheduled Job runs as System — it bypasses ACLs by design, which is correct for a batch job writing health records

---

## REFERENCES

- ServiceNow SDK Docs: https://www.servicenow.com/docs/r/application-development/servicenow-sdk/define-metadata-code-fluent-sdk.html
- SDK Examples Repo: https://github.com/ServiceNow/sdk-examples
- Fluent MCP Server: https://github.com/modesty/fluent-mcp
- Build & Deploy Docs: https://www.servicenow.com/docs/r/application-development/servicenow-sdk/build-deploy-application-now-sdk.html
