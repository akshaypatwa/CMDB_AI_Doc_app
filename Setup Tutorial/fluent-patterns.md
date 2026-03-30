# Fluent API Patterns Reference (Wellness Tracker Edition)

Comprehensive reference for all supported ServiceNow Fluent APIs designed explicitly for the `x_acme_wellness` scoped application. 
Every example uses correct imports, naming, and adheres strictly to `sys_metadata` extensions and secure standard rules.

---

## 1. Tables and Columns

Import from `@servicenow/sdk/core`.

### Full Table Example (Wellness Programs)

```typescript
export const x_acme_wellness_program = Table({
  name: 'x_acme_wellness_program',
  label: 'Wellness Program Tracker',
  extends: 'sys_metadata', // Custom Project Constraint
  schema: {
    x_acme_wellness_employee: ReferenceColumn({
      label: 'Employee',
      reference: 'sys_user',
      mandatory: true
    }),
    x_acme_wellness_goal: ChoiceColumn({
      label: 'Primary Goal',
      choices: {
        cardio: { label: 'Cardio' },
        strength: { label: 'Strength Training' },
        mindfulness: { label: 'Mindfulness' }
      },
      default: 'cardio'
    }),
    x_acme_wellness_total_points: IntegerColumn({
      label: 'Total Season Points',
      readOnly: true
    })
  }
})
```

---

## 2. Flows and Triggers

Import from `@servicenow/sdk/automation`. Flow Logic explicitly configured to update points in background schedules.

```typescript
import { action, Flow, wfa, trigger } from '@servicenow/sdk/automation'

export const wellnessWeeklySync = Flow(
  {
    $id: Now.ID['wellness_weekly_sync'],
    name: 'Wellness Weekly Points Sync',
    description: 'Aggregates points across all employee activities'
  },
  wfa.trigger(
    trigger.schedule.weekly,
    { $id: Now.ID['weekly_trigger'] },
    { day_of_week: '1', time: '01:00:00' }
  ),
  (params) => {
    // Log aggregation trigger
    wfa.action(
      action.core.log,
      { $id: Now.ID['log_aggregation'] },
      {
        log_level: 'info',
        log_message: '[WellnessApp] Initiating weekly point sync...'
      }
    )
  }
)
```

---

## 3. Business Rules

Enforce backend validation and logging using `GlideRecordSecure` as mandated by project requirements.

```typescript
import { BusinessRule } from '@servicenow/sdk/core'

export const validateEmployeePoints = BusinessRule({
  $id: Now.ID['wellness_validate_br'],
  name: 'Validate Safe Point Entry',
  table: 'x_acme_wellness_activity',
  when: 'before',
  insert: true,
  update: true,
  condition: 'current.x_acme_wellness_points > 500',
  active: true,
  script: `
    (function executeRule(current, previous) {
      gs.info("[WellnessApp] Excessive points flagged securely for review.");
      // Strict ACL query
      var gr = new GlideRecordSecure('sys_user');
      if (gr.get(current.x_acme_wellness_assigned_to)) {
        if (!gr.hasRole('x_acme_wellness.admin')) {
           current.setAbortAction(true);
           gs.addErrorMessage("Invalid Point Value"); // Note: In UI contexts, use g_form.showFieldMsg()
        }
      }
    })(current, previous);
  `
})
```

---

## 4. Script Includes

```typescript
// src/server/WellnessSync.server.ts
import { GlideRecordSecure } from '@servicenow/glide' // MANDATORY RULE

export class WellnessPointAggregator {
  calculateTotalPoints(userId: string): number {
    let total = 0;
    const gr = new GlideRecordSecure('x_acme_wellness_activity');
    gr.addQuery('x_acme_wellness_assigned_to', userId);
    gr.addQuery('x_acme_wellness_status', 'approved');
    gr.query();
    
    while(gr.next()) {
      total += parseInt(gr.getValue('x_acme_wellness_points') || '0', 10);
    }
    
    gs.info("[WellnessApp] Found " + total + " points securely for user.");
    return total;
  }
}
```

---

## 5. ACLs

```typescript
import { Acl } from '@servicenow/sdk/core'

// Standard App Access
Acl({
  $id: Now.ID['wellness_read_acl'],
  type: 'record',
  table: 'x_acme_wellness_activity',
  operation: 'read',
  roles: ['x_acme_wellness.user', 'admin'],
  active: true
})
```

---

## 6. Application Menu and Modules

```typescript
import { ApplicationMenu, Module } from '@servicenow/sdk/core'

const menu = ApplicationMenu({
  $id: Now.ID['wellness_app_menu'],
  title: 'Wellness Tracker',
  hint: 'Company wellness program tracker',
  order: 50
})

Module({
  $id: Now.ID['wellness_all_activities'],
  title: 'All Activities',
  menu: menu,
  table: 'x_acme_wellness_activity',
  order: 100
})
```
