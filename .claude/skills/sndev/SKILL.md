---
name: sndev
description: This skill should be used when the user asks to "build the CMDB Health Doctor app", "create a Fluent table", "add a script include", "deploy with now-sdk", "install to ServiceNow", "create ACLs", "add system properties", "build the app menu", or mentions "CMDBHealthEvaluator", "CMDBHealthLLM", "CMDBHealthWriter", "u_cmdb_health_record", "ServiceNow SDK", "now-sdk", "Fluent API", or any task involving building or deploying the CMDB Health Doctor scoped application.
version: 1.0.0
---

# CMDB Health Doctor — ServiceNow SDK Application Builder

Build the CMDB Health Doctor scoped application using the ServiceNow SDK (now-sdk) and Fluent DSL. Every file, field name, and pattern in this skill is specific to this project. Use the exact names, field structures, and logic defined here and in the `references/` files.

---

## Project Identity

| Property    | Value                                                                 |
|-------------|-----------------------------------------------------------------------|
| App Name    | CMDB Health Doctor                                                    |
| Scope       | Read from `now.config.json` before writing any code — never guess    |
| Table       | `x_<scope>_health_record`                                             |
| Purpose     | Nightly CI health evaluation across Correctness, Completeness, Compliance (CCC) |

**ALWAYS** read `now.config.json` first to get the exact scope prefix before writing any table name, column name, or `$id`.

---

## Authentication — Already Handled

Auth credentials are stored in the system keychain. Do NOT create `.env` files or handle credentials in code.

To add a new auth profile (do NOT run this yourself — instruct the user):
```bash
now-sdk auth save <alias> --host https://<instance>.service-now.com --username <user> --default
```

---

## Prerequisites — Check Before Writing Any Code

1. `now.config.json` must exist with `scope` and `scopeId`.
2. `package.json` must have `@servicenow/sdk` and `@servicenow/glide` dev dependencies with `"type": "module"`.
3. Type definitions fetched: `now-sdk dependencies --auth <alias>` (required for `cmdb_ci`, `sys_user` references).

If project does not exist yet: `npx @servicenow/sdk init`

---

## Project File Structure

```
cmdb-health-doctor/
├── now.config.json
├── package.json
├── src/
│   ├── fluent/
│   │   ├── tables/
│   │   │   └── cmdb-health-record.now.ts
│   │   ├── script-includes/
│   │   │   ├── cmdb-health-evaluator.now.ts
│   │   │   ├── cmdb-health-llm.now.ts
│   │   │   └── cmdb-health-writer.now.ts
│   │   ├── acls/
│   │   │   └── cmdb-health-acls.now.ts
│   │   ├── properties/
│   │   │   └── system-properties.now.ts
│   │   ├── navigation/
│   │   │   └── app-menu.now.ts
│   │   └── index.now.ts
│   └── server/
│       ├── CMDBHealthEvaluator.server.js
│       ├── CMDBHealthLLM.server.js
│       └── CMDBHealthWriter.server.js
└── metadata/                    ← auto-generated, do not edit
```

---

## SDK CLI Commands

| Command | Purpose |
|---------|---------|
| `now-sdk build` | Compile Fluent TypeScript → metadata XML |
| `now-sdk install --auth <alias>` | Build + pack + deploy to instance |
| `now-sdk transform --auth <alias>` | Pull metadata from instance to local |
| `now-sdk dependencies --auth <alias>` | Fetch type defs for `cmdb_ci`, `sys_user` |

Development cycle: write Fluent code → `now-sdk build` → `now-sdk install --auth <alias>`

---

## Naming Conventions — Mandatory

| Element | Pattern | Example |
|---------|---------|---------|
| Table name | `x_<scope>_health_record` | `x_acme_cmdbh_health_record` |
| Column name | `x_<scope>_<field>` | `x_acme_cmdbh_run_status` |
| Script Include name | PascalCase, no prefix | `CMDBHealthEvaluator` |
| Fluent `$id` | unique snake_case | `cmdb_health_evaluator_si` |
| File name | kebab-case `.now.ts` | `cmdb-health-record.now.ts` |
| Server file | PascalCase `.server.js` | `CMDBHealthEvaluator.server.js` |

Always derive scope from `now.config.json`. Never hardcode a scope value.

---

## What Is NOT Deployed via SDK — Do Manually After Install

1. **Scheduled Job** — create in System Definition → Scheduled Jobs after deploy
2. **System Property values** — properties are created by deploy, but LLM endpoint, API key, and system prompt must be filled in by admin post-deploy
3. **Service Portal dashboard** — built separately in a later phase

---

## Security Reminders

- Never put LLM API keys in source files — they go in System Properties after deploy
- Ensure `.gitignore` includes `metadata/`, `dist/`, `node_modules/`, `.now/`
- `cmdb_health.llm.api_key` uses `type: 'password2'` for encrypted storage
- ACLs deploy with the app — do not skip them
- Scheduled Job runs as System — bypasses ACLs by design (correct for batch write)

---

## References

Load these when working on the corresponding area:

- **`references/table-definition.md`** — Complete TypeScript table schema for `u_cmdb_health_record` with all columns, types, and critical rules
- **`references/script-includes.md`** — Fluent wrapper pattern + contracts for CMDBHealthEvaluator, CMDBHealthLLM, CMDBHealthWriter
- **`references/system-properties.md`** — All `Record()` definitions for `sys_properties` (LLM config + governance)
- **`references/acls-navigation.md`** — ACL definitions, Application Menu/Module setup, and Scheduled Job two-phase logic
- **`references/build-gotchas.md`** — Common build errors with causes and fixes, official SDK example URLs to fetch on failure
