# Build Gotchas and Official Examples

## Common Build Errors

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

## Official SDK Examples — Fetch Before Guessing at a Fix

Before guessing at a fix, fetch the relevant official SDK example:

| What you're building | URL to fetch |
|---|---|
| Table definition | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/table-sample/src/fluent/table-simple.now.ts` |
| Table with references | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/table-sample/src/fluent/table-custom-column.now.ts` |
| Business rule | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/businessrule-sample/src/fluent/business-rule-1.now.ts` |
| ACL | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/acl-sample/src/fluent/index.now.ts` |

Full examples index: `https://github.com/ServiceNow/sdk-examples`

## Official Documentation

- ServiceNow SDK Docs: https://www.servicenow.com/docs/r/application-development/servicenow-sdk/define-metadata-code-fluent-sdk.html
- Build & Deploy Docs: https://www.servicenow.com/docs/r/application-development/servicenow-sdk/build-deploy-application-now-sdk.html
- Fluent MCP Server: https://github.com/modesty/fluent-mcp
