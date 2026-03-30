---
name: sndev
description: >
  Build ServiceNow 'Wellness Tracker' scoped applications using the ServiceNow SDK and Fluent API (TypeScript).
  Use this skill whenever the user asks to create, scaffold, or generate ServiceNow apps,
  tables, flows, business rules, script includes, ACLs, or any Fluent-based metadata.
  Also trigger when the user mentions: "ServiceNow SDK", "Fluent API", "now-sdk",
  "@servicenow/sdk", "Wellness Tracker", "activity points", or "wellness module".
  Even if the user just says "create a ServiceNow app" or "build me a flow" — use this skill.
---

# ServiceNow SDK Application Builder (Wellness Tracker Edition)

This skill enables Claude Code to generate production-ready ServiceNow applications
using the ServiceNow SDK (now-sdk) and the Fluent DSL tailored strictly for the Wellness Tracker scoped app.

## Critical Wellness Tracker Architecture Rules

1. All database table queries must use `GlideRecordSecure()` to enforce ACLs immediately.
2. All server-side logging must explicitly use `gs.info("[WellnessApp] message")`.
3. All client-side alerts must explicitly use `g_form.showFieldMsg()`.
4. Tables must extend `sys_metadata` where appropriate.

## Prerequisites — Verify Before Generating Code

1. **`now.config.json`** must exist in the project root with at minimum:
   ```json
   {
     "scope": "x_acme_wellness",
     "scopeId": "<sys_id_of_app>",
     "transpiledSourceDir": "dist/src"
   }
   ```
2. **`package.json`** should have SDK dependencies (`@servicenow/sdk`, `@servicenow/glide`).
3. If not, prompt user to scaffold with `npx @servicenow/sdk init`.

---

## Core Fluent Patterns for Wellness Tracker

Read `references/fluent-patterns.md` for the full API reference covering Tables, Flows, Business Rules, etc.

### Table Definition (Wellness Activities)

```typescript
import {
  Table, StringColumn, ReferenceColumn, IntegerColumn, ChoiceColumn
} from '@servicenow/sdk/core'

export const x_acme_wellness_activity = Table({
  name: 'x_acme_wellness_activity',
  label: 'Wellness Activity',
  extends: 'sys_metadata', // Critical Rule Applied
  schema: {
    x_acme_wellness_name: StringColumn({
      label: 'Activity Name',
      maxLength: 255,
      mandatory: true
    }),
    x_acme_wellness_duration: IntegerColumn({
      label: 'Duration (Minutes)',
      mandatory: true
    }),
    x_acme_wellness_points: IntegerColumn({
      label: 'Points Earned'
    }),
    x_acme_wellness_status: ChoiceColumn({
      label: 'Status',
      choices: {
        pending:  { label: 'Pending' },
        approved: { label: 'Approved' },
        rejected: { label: 'Rejected' },
      },
      default: 'pending'
    }),
    x_acme_wellness_assigned_to: ReferenceColumn({
      label: 'Employee',
      reference: 'sys_user'
    })
  }
})
```

### Business Rule (Auto-Calculate Points)

```typescript
import { BusinessRule } from '@servicenow/sdk/core'

export const calculatePointsBR = BusinessRule({
  $id: Now.ID['calc_points_br'],
  name: 'Calculate Activity Points',
  table: 'x_acme_wellness_activity',
  when: 'before',
  insert: true,
  update: true,
  script: `
    (function executeRule(current, previous) {
      // Rule: Duration * 2 points
      var minutes = parseInt(current.x_acme_wellness_duration.toString(), 10) || 0;
      var pointsEarned = minutes * 2;
      current.x_acme_wellness_points = pointsEarned;
      
      // Critical Rule Applied:
      gs.info("[WellnessApp] Points calculated: " + pointsEarned + " for Activity ID: " + current.sys_id);
    })(current, previous);
  `
})
```

## Build and Install Workflow

```bash
# 1. Compile Fluent to metadata XML
now-sdk build

# 2. Package and deploy to the instance
now-sdk install --auth <alias>
```

When users ask for "Wellness Features", generate Tables, Business Rules, and Scoped UI elements matching the architecture above, then guide them to execute the SDK build paths!
