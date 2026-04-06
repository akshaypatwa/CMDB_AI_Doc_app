# Script Includes

Script Includes are defined in Fluent TypeScript wrappers, but their logic lives in `.server.js` files in `src/server/`. The Fluent wrapper registers the Script Include metadata; the `.server.js` file contains the actual ServiceNow JavaScript.

## Fluent Wrapper Pattern

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

Repeat this pattern for `CMDBHealthLLM` and `CMDBHealthWriter`, importing their respective `.server.js` files.

---

## CMDBHealthEvaluator — Contract

- **File:** `src/server/CMDBHealthEvaluator.server.js`
- **Input:** `ciSysId` (string)
- **Returns:** `{ mergedPayload, scores }` — does NOT write to table, does NOT call LLM

**Key logic:**
- Completeness runs first — its score feeds Correctness quality calculation
- Peer analysis runs on missing recommended fields (4-step class hierarchy fallback via `sys_db_object`)
- Compliance violations include `peer_benchmark` block for each violated field
- Overall score = (Correctness × 0.40) + (Completeness × 0.30) + (Compliance × 0.30)
- CRITICAL regulatory violation hard-caps overall score at 40
- Governance rules loaded from System Properties (not hardcoded)

---

## CMDBHealthLLM — Contract

- **File:** `src/server/CMDBHealthLLM.server.js`
- **Input:** `mergedPayload` (JSON object)
- **Returns:** parsed LLM response object
- **Does NOT write to table**

**All connection config from System Properties — never hardcoded:**
- `cmdb_health.llm.endpoint`
- `cmdb_health.llm.api_key`
- `cmdb_health.llm.model`
- `cmdb_health.llm.system_prompt`

Uses `sn_ws.RESTMessageV2` for the REST call.

---

## CMDBHealthWriter — Contract

- **File:** `src/server/CMDBHealthWriter.server.js`
- **Input:** `ciSysId`, `mergedPayload`, `llmResponse`, `targetStatus`
- **What it does:** writes all fields to `x_<scope>_health_record`

**Score delta logic (critical — must happen before write):**
1. Query existing record for this CI: `addQuery('x_<scope>_ci', ciSysId)`
2. Read `x_<scope>_overall_health_score` → store as `x_<scope>_previous_score`
3. Compute `x_<scope>_score_delta` = new score - previous score
4. Then overwrite all fields

**Sets `x_<scope>_run_status`** to whatever `targetStatus` is passed (`EVALUATED` or `COMPLETE`).

If no previous record exists: `previous_score = null`, `score_delta = null`.
