# ACLs, Navigation, and Scheduled Job

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

## Application Menu

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

## Scheduled Job — Manual Setup After Deploy

The Fluent SDK does not support Scheduled Jobs as a metadata type. After `now-sdk install` completes, instruct the user to:

1. Navigate to **System Definition → Scheduled Jobs → New**
2. Set **Name**: `CMDB Health Doctor — Nightly Run`
3. Set **Run**: `Daily` at desired time (e.g. 02:00 AM)
4. Set **Script** to the two-phase orchestration script below
5. Save and activate

### Scheduled Job Two-Phase Logic

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
