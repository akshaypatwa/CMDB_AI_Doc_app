# Complete Guide: Building & Deploying a ServiceNow App with Claude Code + ServiceNow SDK

## FOR THE ABSOLUTE BEGINNER — No Prior Knowledge Assumed

---

## SECTION 0: UNDERSTANDING THE BIG PICTURE FIRST

Before touching any tool, understand what we are building and why.

### What is ServiceNow?

ServiceNow is an enterprise software platform used by large companies to manage IT operations — tracking servers, managing incidents, handling service requests, and automating workflows. Think of it as the "operating system" for an IT department.

### What is a ServiceNow App?

Just like your phone has apps from the App Store, ServiceNow has apps built on top of the platform. You can build custom apps that add new tables (databases), new screens, new automation, and new logic — all running inside your company's ServiceNow instance.

### What is the ServiceNow SDK?

SDK stands for "Software Development Kit." Normally, building a ServiceNow app means clicking around in a browser inside ServiceNow's UI, which is slow, hard to version-control, and difficult to automate. The ServiceNow SDK lets you write your app as code on your laptop using modern tools (TypeScript, npm) and then deploy it to ServiceNow automatically. It is professional-grade development.

### What is Claude Code?

Claude Code is an AI assistant that lives in your terminal (command line). Instead of writing code yourself, you describe what you want in plain English and Claude Code writes the code for you. It understands your project, reads your files, and makes intelligent decisions. It is not just a chatbot — it can actually read, write, edit, and run files on your computer.

### What is a Skill in Claude Code?

A Skill is a Markdown document (a text file with formatting) that you write once and store in your project. It teaches Claude Code about your specific project — your table names, your rules, your preferences, your architecture. Without skills, you would have to re-explain your project every time you start a new Claude session. With skills, Claude Code remembers your project context automatically.

### What is a Reference File?

A Reference File is another Markdown document — but while a Skill teaches Claude how to behave and what rules to follow, a Reference File is a dictionary or data sheet. It contains facts Claude needs to look up: field names, data structures, API contracts, configuration values. Think of a Skill as the "training manual" and a Reference File as the "product catalog."

### Why Use Claude Code + SDK Together?

Without Claude Code: You write all the TypeScript, all the server-side JavaScript, set up all the structures yourself — requires expert knowledge.

With Claude Code: You describe what you want in plain English. Claude writes the code. You review it. You deploy it. The SDK handles the actual push to ServiceNow.

This guide covers BOTH: the SDK setup AND how to use Claude Code to write all the code for you using prompts.

---

## SECTION 1: WHAT YOU NEED TO INSTALL

Think of this section as "setting up your workbench." Before you build anything, you need the right tools on your laptop.

### Tool 1: Node.js

**What it is:** Node.js is a runtime that lets your laptop run JavaScript programs. The ServiceNow SDK and Claude Code CLI are both Node.js programs.

**Why you need it:** Without Node.js, you cannot run npm commands or the SDK.

**How to install:**

Step 1 — Open your Terminal application. On Mac: press Cmd+Space, type "Terminal", press Enter.

Step 2 — Check if Node.js is already installed:
```
node --version
```
If you see something like v18.17.0, you are good. If you see "command not found," continue below.

Step 3 — Install nvm (Node Version Manager). nvm lets you install and switch between Node versions easily:
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Step 4 — Close and reopen your Terminal window. This is important — nvm will not work until you do this.

Step 5 — Install Node.js version 18:
```
nvm install 18
nvm use 18
```

Step 6 — Verify it worked:
```
node --version
npm --version
```
You should see version numbers for both.

---

### Tool 2: The ServiceNow SDK CLI

**What it is:** A command-line tool made by ServiceNow that handles building and deploying your app. CLI stands for Command Line Interface.

**Why you need it:** The SDK does the heavy lifting — it compiles your TypeScript code, packages it, connects to your ServiceNow instance, and uploads everything.

**How to install:**
```
npm install -g @servicenow/sdk
```

The -g flag means "global" — install it so you can use it from any folder on your computer.

**Verify:**
```
now-sdk --version
```
You should see a version number like 4.4.1.

---

### Tool 3: Claude Code CLI

**What it is:** The command-line version of Claude (Anthropic's AI). It runs directly in your terminal and has access to your files.

**Why you need it:** This is your AI coding assistant. Instead of writing code, you describe what you want and Claude Code builds it.

**How to install:**
```
npm install -g @anthropic-ai/claude-code
```

**Verify:**
```
claude --version
```

**First-time login:** When you first run `claude`, it will ask you to log in with your Anthropic account. Follow the prompts — it opens a browser for authentication.

---

### Tool 4: Git (Version Control)

**What it is:** Git is a tool that tracks changes to your code over time. It is like "Track Changes" in Microsoft Word but for code.

**Why you need it:** The SDK and Claude Code work best in Git repositories. It lets you see what changed and roll back mistakes.

**Check if installed:**
```
git --version
```

Most Macs come with Git pre-installed. If not, install Xcode Command Line Tools:
```
xcode-select --install
```

---

### Tool 5: A Code Editor — VS Code (Recommended)

**What it is:** A text editor designed for writing code. VS Code (Visual Studio Code) is free and made by Microsoft.

**Why you need it:** While Claude Code writes most of your code, you will still want to read and review files in a proper editor.

**How to get it:** Search "VS Code download" and download from the official Microsoft site for your operating system.

---

## SECTION 2: SETTING UP YOUR SERVICENOW INSTANCE CONNECTION

Your ServiceNow instance is the live environment where your app will run. You need to tell the SDK how to connect to it.

### What is an Instance?

When a company uses ServiceNow, they get their own private copy of the platform at a unique URL like https://companyname.service-now.com. This is called an "instance." You can get a free personal developer instance for testing from ServiceNow's developer program.

### Setting Up a Free Developer Instance

1. Go to developer.servicenow.com
2. Create a free account
3. Click "Request Instance"
4. Choose the latest ServiceNow version
5. Your instance URL will be something like https://dev123456.service-now.com
6. Note your admin username and password

### Connecting the SDK to Your Instance

The SDK stores your credentials securely in your computer's keychain — the same place your Mac stores Wi-Fi passwords. You never hardcode passwords into your project files.

Run this command:
```
now-sdk auth add
```

You will be asked a series of questions:

**"What alias would you like to use?"**
Type a short nickname for this connection. Example: my-dev-instance
This alias is just for YOUR laptop — it is how you will refer to this connection in future commands.

**"What is your instance URL?"**
Type your full instance URL. Example: https://dev123456.service-now.com

**"What is your username?"**
Type: admin

**"What is your password?"**
Type your password. It will not show as you type — that is normal and means it is secure.

**Verify it saved:**
```
now-sdk auth list
```
You should see your alias listed.

---

## SECTION 3: CREATING YOUR PROJECT FROM SCRATCH

### Step 3.1: Create a Project Folder

In your Terminal, decide where on your computer you want this project to live. Then:
```
mkdir MyServiceNowApp
cd MyServiceNowApp
```

mkdir creates a new folder. cd moves you into it. All future commands should be run from inside this folder.

### Step 3.2: Initialize the SDK Project

```
now-sdk init
```

This is the most important setup command. It will ask you several questions:

**"App Name"** — The human-readable name of your app. Example: CMDB Health Doctor

**"Scope prefix"** — A short unique identifier for your app. ServiceNow uses this prefix on all your table names and fields to avoid conflicts with other apps. Example: x_mycompany_myapp
Rules: must start with x_, lowercase letters and underscores only, maximum 18 characters total.

**"Auth alias"** — Type the alias you created in Section 2. Example: my-dev-instance

What happens after you answer:
- The SDK logs into your ServiceNow instance
- It creates a scoped application record on your instance
- It writes a now.config.json file with your app's identity
- It creates the basic project folder structure

### Step 3.3: Install Project Dependencies

```
npm install
```

This reads the package.json file created by now-sdk init and downloads all the code libraries your project needs into a node_modules folder. This takes 1 to 2 minutes.

### Step 3.4: Fetch Type Definitions

```
npm run types
```

This connects to your ServiceNow instance and downloads descriptions of all its built-in tables — like cmdb_ci, sys_user, incident. This gives Claude Code and TypeScript accurate information about what already exists in ServiceNow. Output goes to src/fluent/generated/ — never edit files in that folder because they get overwritten every time you run this command.

### Step 3.5: Initialize Git

```
git init
git add .
git commit -m "Initial project setup"
```

This creates a Git repository so your changes are tracked from the very beginning.

### Step 3.6: Open the Project in VS Code

```
code .
```

The dot means "open the current folder." VS Code will open and you will see your project structure in the sidebar.

---

## SECTION 4: UNDERSTANDING YOUR PROJECT STRUCTURE

After now-sdk init and npm install, your project looks like this:

```
MyServiceNowApp/
│
├── src/                         ← All your source code lives here
│   └── fluent/                  ← TypeScript files that DEFINE your app structure
│       └── index.now.ts         ← The master list of everything in your app
│
├── node_modules/                ← Downloaded libraries (never touch this)
│
├── package.json                 ← Project settings and build commands
├── now.config.json              ← Your app identity (scope, name, scopeId)
└── .eslintrc                    ← Code quality rules
```

As you build your app, you will add these folders:

```
src/
├── fluent/                      ← Structure definitions (TypeScript .now.ts files)
│   ├── tables/                  ← Your database tables
│   ├── script-includes/         ← Reusable server-side code modules
│   ├── scheduled-job/           ← Automated background jobs
│   ├── acls/                    ← Security rules (who can see and edit what)
│   ├── properties/              ← App configuration settings
│   └── navigation/              ← Menu items in the ServiceNow sidebar
└── server/                      ← The actual logic (JavaScript .server.js files)
    ├── MyEvaluator.server.js
    ├── MyWriter.server.js
    └── MyJob.server.js
```

**The key concept:** Fluent files (.now.ts) are blueprints — they describe the shape of your app. Server files (.server.js) are the engine — they contain the actual business logic. Think of Fluent as the architect's drawings and Server as the actual construction.

**The barrel file (index.now.ts):** This single file must export everything else in the fluent folder. Think of it as a table of contents. If you create a new Fluent file but forget to add it here, that piece of your app will not get deployed.

---

## SECTION 5: STARTING CLAUDE CODE

### Step 5.1: Launch Claude Code

From your project folder in the terminal:
```
claude
```

Claude Code starts up and shows you a prompt. It automatically reads your project files to understand what you are working with.

### Step 5.2: Understanding the Claude Code Interface

When you type a message and press Enter, Claude Code:
1. Reads your request
2. Decides what files to read, create, or edit
3. Shows you what it plans to do and asks for permission
4. Makes the changes after you approve
5. Shows you a summary of what it did

You interact with it entirely in plain English. No coding required on your part.

### Step 5.3: How Prompts Work

A prompt is simply what you type to Claude Code to tell it what to do. Good prompts are:

- **Specific** — "Create a table with these exact fields" not just "make a table"
- **Contextual** — Reference your app's actual names and requirements
- **Purposeful** — Explain what the thing should DO, not just what it should BE named
- **Scoped** — Tell Claude where to put the file and what other files to update

---

## SECTION 6: CREATING YOUR SKILL FILE

### What Is a Skill and Why Create It First?

A Skill file is like giving Claude Code a project briefing document. Without it, Claude Code is a smart but uninformed assistant — it knows how to code but does not know your specific requirements, table names, rules, or architecture.

With a Skill file, every time you start a new Claude Code session, it automatically loads this context. Claude behaves like an expert on your specific project from the very first message.

Real-world analogy: Imagine hiring a contractor. Without a briefing, they would ask you basic questions every single day. With a proper briefing document, they show up already knowing your requirements, preferences, and constraints.

### Where Skills Are Stored

Skills go in a hidden folder in your project:
```
.claude/
└── skills/
    └── your-skill-name.md
```

The .claude/ folder is created automatically when you first run `claude` in your project.

### Prompt to Create Your Core SDK Skill

Start Claude Code and type this:

```
Create a skill file at .claude/skills/sndev.md for this ServiceNow SDK project.
The skill should teach future Claude sessions everything they need to know to
work on this app effectively. Include:

1. Project identity section: app name, scope prefix from now.config.json,
   SDK version from package.json, auth alias name

2. SDK command reference: what each npm script does (build, deploy, transform, types)
   with plain English explanation of when to use each one

3. Critical coding rules for server-side JavaScript:
   - Must be ES5 only (no arrow functions, no const/let, no template literals)
   - All variables must use var
   - Class pattern must use Class.create() with prototype object
   - Explain WHY: ServiceNow server-side engine is Rhino which only supports ES5

4. File structure rules:
   - Fluent files (.now.ts) are for structure/metadata only
   - Server files (.server.js) are for business logic
   - Every fluent file MUST be exported from src/fluent/index.now.ts

5. The table and field naming convention using the scope prefix

6. A section referencing the docs/ folder for field reference and other documentation
```

**What Claude Code will do:** Read your package.json and now.config.json, extract the real values from YOUR project, and generate a complete skill file with accurate project-specific information.

### How to Activate a Skill

Skills in .claude/skills/ are loaded automatically in every session. You can also explicitly reference one:

```
Use the sndev skill for this session
```

Or reference it inline in a prompt:

```
Following the rules in my sndev skill, create a script include for...
```

---

## SECTION 7: CREATING YOUR REFERENCE FILES

### What Is a Reference File and How Is It Different from a Skill?

| Skill File | Reference File |
|---|---|
| Teaches Claude HOW to work | Gives Claude FACTS to look up |
| Contains rules and instructions | Contains data: field names, schemas, structures |
| Behavioral guidance | Technical specifications |
| Example: "Always use ES5" | Example: "The table has these 40 fields" |

Reference files go in the docs/ folder and are plain Markdown files. You create them once, keep them updated as your project grows, and reference them in prompts using @docs/filename.md.

### Prompt to Create a Field Reference Document

```
Based on the table definition in src/fluent/tables/ and the server scripts
in src/server/, create a comprehensive field reference document at
docs/field-reference.md.

Organize into clear sections:

1. Table identity: full table name, scope prefix, purpose of the table

2. For each field category (Identity, Run Lifecycle, Health Scores,
   LLM Output, Action Tracking, Review Status), create a table showing:
   - Short field name without prefix
   - Full field name with prefix
   - Data type
   - Allowed values or max length
   - Plain English description of what this field stores

3. The complete JSON structure for action objects stored in
   autofix_actions and review_actions fields — show every property
   with its type and allowed values

4. The scoring formula: how overall score is calculated from the
   three dimension scores, including the weights

5. The health status thresholds: what score range maps to each status label

Format everything as clean Markdown tables for easy scanning.
```

### Prompt to Create a System Properties Reference

```
Create a reference document at docs/system-properties-reference.md that
documents every system property used by this app.

For each property include:
- The full property name
- Data type (string, password2, boolean, etc.)
- Default value if any
- Plain English explanation of what it controls
- Example valid values
- Whether it is required or optional
- Security notes (e.g., which ones are sensitive and should use password2 type)

Also add a section explaining HOW to set these properties in ServiceNow after
deployment: the navigation path and what to look for in the UI.
```

### Prompt to Create an LLM Integration Reference

```
Create a reference document at docs/llm-integration-reference.md that
documents the LLM integration for this app.

Include:
1. The exact JSON request payload structure sent to the LLM
2. The exact JSON response structure expected back from the LLM
3. What each field in the response means and how it is used by the app
4. The system prompt structure and what each part instructs the LLM to do
5. Error handling: what happens if the LLM call fails
6. The retry logic: how many times it retries and under what conditions

Base this on the actual code in src/server/CMDBHealthLLM.server.js
```

### How to Reference These Documents in Prompts

Once created, reference them naturally in any future prompt:

```
Looking at @docs/field-reference.md, add a new field called assessment_notes
to the health record table
```

```
Using the LLM response structure in @docs/llm-integration-reference.md,
update the writer to also save the new confidence_score field
```

---

## SECTION 8: BUILDING YOUR APP WITH CLAUDE CODE PROMPTS

This is the core section. Instead of writing any code yourself, you use prompts to have Claude Code build everything. Here is the complete sequence of prompts in the order you would use them.

---

### Prompt A — Create the Main Database Table

```
Create the main database table for this app following the sndev skill rules.

Table purpose: Store one health evaluation record per Configuration Item (CI)
in ServiceNow's CMDB. Each CI gets evaluated for health across three dimensions:
Correctness (is the data accurate?), Completeness (is all required data present?),
and Compliance (does it meet IT governance rules?).

Create the Fluent table definition at src/fluent/tables/health-record.now.ts
with these field groups:

GROUP 1 - CI Identity:
- ci: Reference to cmdb_ci table, mandatory
- ci_class: String, the class of the CI like "cmdb_ci_server"
- environment: String, like "Production" or "Development"
- analysis_date: DateTime, when this record was last evaluated

GROUP 2 - Job Lifecycle:
- run_status: Choice field with options: new, evaluating, evaluated, complete, failed
- retry_count: Integer, how many times we retried a failed evaluation
- error_log: String max 4000 chars, error details if something went wrong
- last_stage: String max 500 chars, which step were we on when it stopped
- job_started_at: DateTime
- job_completed_at: DateTime

GROUP 3 - Health Scores (all Integer, 0-100 range):
- overall_health_score
- correctness_score
- completeness_score
- compliance_score
- health_status: Choice with options: critical, moderate, minor, healthy
- previous_score: Integer, score from the previous evaluation run
- score_delta: Integer, difference between current and previous score (can be negative)

GROUP 4 - Quick Problem Flags (all Boolean):
- is_stale: Has this CI not been updated in 30 or more days?
- is_orphan: Does this CI have no relationships to other CIs?
- has_duplicates: Are there other CIs that appear to be the same item?
- duplicate_count: Integer, how many duplicates were found

GROUP 5 - LLM Output (all String):
- llm_summary: Max 1000 chars, AI-generated plain English summary
- priority_action: Max 500 chars, the single most important thing to fix
- autofix_actions: Max 8000 chars, JSON array of automated fixes the system can apply
- review_actions: Max 8000 chars, JSON array of items needing human review
- raw_payload_json: Max 8000 chars, the full evaluation data sent to the LLM

GROUP 6 - Review Tracking:
- review_status: Choice with options: pending, in_progress, resolved
- reviewed_by: Reference to sys_user
- review_date: DateTime

Add a database index on the ci field for query performance.

After creating the table file, add the export to src/fluent/index.now.ts
```

---

### Prompt B — Create the Evaluation Engine

```
Create a ServiceNow Script Include that evaluates a single CI's CMDB health
across three dimensions. This is the core analysis engine.

Create two files:
1. src/server/CMDBHealthEvaluator.server.js — the actual logic
2. src/fluent/script-includes/cmdb-health-evaluator.now.ts — the Fluent wrapper

STRICT REQUIREMENT: The server.js file must be ES5 only. Use var not const/let.
Use function() {} not arrow functions. Use string concatenation not template literals.
Use the Class.create() pattern.

The class is named CMDBHealthEvaluator with these methods:

METHOD: initialize()
Sets up configuration constants:
- STALE_THRESHOLD_DAYS = 30 (a CI not updated in 30+ days is considered stale)
- INCIDENT_LOOKBACK_DAYS = 365 (look back 1 year for related incidents)
- W_CORRECTNESS = 0.40 (correctness contributes 40% to overall score)
- W_COMPLETENESS = 0.30 (completeness contributes 30%)
- W_COMPLIANCE = 0.30 (compliance contributes 30%)

METHOD: evaluate(ciSysId)
Main entry point. Takes a CI sys_id and returns an object with:
- scores: { overall, correctness, completeness, compliance, healthStatus }
- mergedPayload: all the detailed data from each dimension for sending to LLM

Calls the three private methods below and combines results.
Overall score formula: (correctness * 0.40) + (completeness * 0.30) + (compliance * 0.30)
If a regulatory violation is found, cap the overall score at 40.

METHOD: _runCompleteness(ciSysId)
Checks if all recommended fields are populated.
- Query ServiceNow's cmdb_recommended_fields table for this CI's class
- For each recommended field, check if it has a value on the actual CI record
- Calculate score as: (fields_with_values / total_recommended_fields) * 100
- Return the score and list of missing fields

METHOD: _runCorrectness(ciSysId)
Checks if the data is accurate and up-to-date.
- STALENESS: Check the sys_updated_on field. If older than STALE_THRESHOLD_DAYS,
  subtract 25 points from starting score of 100.
- ORPHAN: Check if this CI has any relationships in cmdb_rel_ci table.
  A CI with no relationships is suspicious. Subtract 20 points.
- DUPLICATES: Look for other CIs with the same serial_number or fqdn or ip_address.
  Subtract 10 points per duplicate found, maximum -30 points.
- Return the score plus flags: isStale, isOrphan, hasDuplicates, duplicateCount

METHOD: _runCompliance(ciSysId)
Checks against IT governance certification templates.
- Query cert_template table for templates that apply to this CI's class
- For each template, evaluate all conditions from cert_attr_cond table
- Count how many conditions are violated
- Check if any violation involves these regulatory keywords: pci, sox, hipaa, gdpr
- If regulatory violation found, set a regulatoryRisk flag to true
- Return score, violations list, and regulatory risk flag

IMPORTANT: This class must NOT write to the database and must NOT call the LLM.
It only evaluates and returns data. Other classes handle saving and LLM calls.

After creating both files, add the script include export to src/fluent/index.now.ts
```

---

### Prompt C — Create the LLM Integration Module

```
Create a ServiceNow Script Include that handles all communication with an
external AI/LLM service.

Create two files:
1. src/server/CMDBHealthLLM.server.js — the actual logic
2. src/fluent/script-includes/cmdb-health-llm.now.ts — the Fluent wrapper

ES5 rules apply strictly. Class name: CMDBHealthLLM

METHOD: initialize()
No setup needed. Configuration is read from system properties at call time.

METHOD: call(mergedPayload)
Takes the evaluation payload from the Evaluator and sends it to an LLM API.

Steps:
1. Read configuration from ServiceNow system properties using gs.getProperty():
   - cmdb_health.llm.endpoint (the API URL)
   - cmdb_health.llm.api_key (the bearer token)
   - cmdb_health.llm.system_prompt (instructions for the LLM)
   - cmdb_health.llm.model (model identifier)

2. Build the request body:
   - contents array with the system prompt and JSON-stringified payload as text parts
   - generationConfig with temperature 0.1 (low = more deterministic) and maxOutputTokens 16384

3. Make the HTTP REST call:
   - Use ServiceNow's RESTMessageV2 API
   - Set Authorization header as "Bearer " + api_key
   - Set Content-Type as application/json
   - POST the request body to the endpoint

4. Parse the response:
   - Extract text from candidates[0].content.parts[0].text
   - Strip any markdown code fences such as ```json and ```
   - Parse the cleaned string as JSON
   - Return the parsed object

5. Error handling:
   - If HTTP status is not 200, log the error with gs.error() and throw an exception
   - If JSON parsing fails, log the raw response and throw an exception

Expected LLM response structure that the LLM must return:
{
  "llm_summary": "2-3 sentence summary of CI health",
  "priority_action": "The single most important fix",
  "review_required": [array of action objects needing human approval],
  "auto_fix_actions": [array of action objects that can be automated],
  "correctness_notes": { staleness and duplicate details },
  "completeness_notes": { missing fields summary },
  "compliance_notes": { violations summary, regulatory_risk boolean }
}

Each action object has:
dimension, title, target_ci_sys_id, action, risk (MEDIUM/HIGH/CRITICAL),
reason, requires_approval (boolean)

After creating both files, add to src/fluent/index.now.ts
```

---

### Prompt D — Create the Database Writer

```
Create a ServiceNow Script Include that handles all database writes for
health evaluation results.

Create two files:
1. src/server/CMDBHealthWriter.server.js — the actual logic
2. src/fluent/script-includes/cmdb-health-writer.now.ts — the Fluent wrapper

ES5 rules apply strictly. Class name: CMDBHealthWriter

METHOD: initialize()
Read the app scope from gs.getCurrentScopeName() and store as this.scope.
Set the table name and field prefix as class properties.

METHOD: save(ciSysId, mergedPayload, llmResponse, targetStatus)
The main write method. Does an upsert: updates existing record or inserts new one.

PHASE 1 DATA from mergedPayload — write these fields:
- ci reference, ci_class, environment
- analysis_date set to now
- all three dimension scores (correctness, completeness, compliance)
- calculated overall score: (correctness*0.4) + (completeness*0.3) + (compliance*0.3)
- health_status mapped from score: 80+ = healthy, 60-79 = minor, 40-59 = moderate, 0-39 = critical
- is_stale, is_orphan, has_duplicates, duplicate_count flags
- raw_payload_json: store the JSON-stringified mergedPayload for LLM retry capability
- SCORE DELTA: before writing the new score, read the current overall_health_score from
  the existing record. Set previous_score = that old value. Set score_delta = new - old.

PHASE 2 DATA from llmResponse — write these fields:
- llm_summary and priority_action
- autofix_actions: JSON.stringify(llmResponse.auto_fix_actions)
- review_actions: JSON.stringify(llmResponse.review_required)
- Count review_required array length and store as review_actions_count
- Count auto_fix_actions length and store as autofix_actions_count
- Count items where risk is CRITICAL or HIGH and store as high_risk_count
- compliance_notes.regulatory_risk stores to the regulatory_risk boolean field
- run_status = targetStatus (passed in as parameter)
- job_completed_at = now if targetStatus equals complete

METHOD: markFailed(ciSysId, errorMessage)
Set run_status to failed, write errorMessage to error_log, increment retry_count by 1.

METHOD: markEvaluating(ciSysId)
Set run_status to evaluating, set job_started_at to now, clear error_log.

METHOD: updateStage(ciSysId, stage)
Set last_stage to the stage value and set stage_updated_at to now.
Use this to track progress at key checkpoints during evaluation.

After creating both files, add to src/fluent/index.now.ts
```

---

### Prompt E — Create the Scheduled Job

```
Create a ServiceNow Scheduled Script Execution that orchestrates the nightly
health evaluation for all CIs.

Create two files:
1. src/server/CMDBHealthJob.server.js — the job logic (standalone script, not a class)
2. src/fluent/scheduled-job/cmdb-health-job.now.ts — the Fluent wrapper

ES5 rules apply strictly.

The job runs in two sequential phases:

PHASE 1 — EVALUATION:
Query the health record table for records matching these conditions:
- run_status equals new
- OR run_status equals failed AND retry_count is less than 3
- OR run_status equals complete AND today is Sunday (weekly full re-evaluation)

For each record found:
1. Log with gs.info(): "Starting evaluation for CI: " + ciName
2. Call writer.markEvaluating(ciSysId)
3. Call writer.updateStage(ciSysId, 'phase1_evaluating')
4. Instantiate CMDBHealthEvaluator and call evaluate(ciSysId)
5. If evaluate() succeeds: call writer.save() with status 'evaluated'
6. If evaluate() throws: call writer.markFailed() with the error message
7. Log the result (success or failure) with timing

After all records: log "Phase 1 complete: X succeeded, Y failed out of Z total"

PHASE 2 — LLM ENRICHMENT:
Query for records where run_status equals evaluated.

For each record found:
1. Log: "Starting LLM enrichment for CI: " + ciName
2. Call writer.updateStage(ciSysId, 'phase2_llm')
3. Parse the raw_payload_json field back into an object using JSON.parse
4. Instantiate CMDBHealthLLM and call llm.call(mergedPayload)
5. If call() succeeds: call writer.save() with the LLM response and status 'complete'
6. If call() throws: call writer.markFailed() with error message (will retry next run)
7. Log the result

After all records: log "Phase 2 complete: X succeeded, Y failed out of Z total"

At the very end: log total elapsed time for the entire job.

For the Fluent wrapper:
- Name: "CMDB Health Doctor — Nightly Run"
- Schedule: daily at 2:00 AM
- active: true

After creating both files, add the job export to src/fluent/index.now.ts
```

---

### Prompt F — Create Security Rules (ACLs)

```
Create Access Control Lists (ACLs) for the health record table.

Create: src/fluent/acls/health-record-acls.now.ts

ACLs to create:
1. READ permission: Users with roles itil, admin, or cmdb_read can read records
   Plain English: ITIL practitioners like helpdesk and service desk staff can VIEW
   health data to understand CI status during incident handling.

2. WRITE permission: Only users with admin role can update records
   Plain English: Only administrators can modify health records to prevent
   accidental data tampering.

3. CREATE permission: Only users with admin role can create records
   Plain English: Only admins can create new health records. The scheduled job
   runs as admin and creates records programmatically.

Add the ACL export to src/fluent/index.now.ts
```

---

### Prompt G — Create System Properties

```
Create System Properties for configuring this app after deployment.

Create: src/fluent/properties/system-properties.now.ts

Properties to create:

LLM CONFIGURATION GROUP (title: "CMDB Health Doctor - LLM Configuration"):

1. cmdb_health.llm.endpoint
   Type: string
   Description: "Full URL of the LLM API endpoint"
   Default: empty

2. cmdb_health.llm.api_key
   Type: password2 (this type encrypts the value in the database automatically)
   Description: "API key or bearer token for LLM authentication"
   Default: empty

3. cmdb_health.llm.model
   Type: string
   Description: "Model identifier to use"
   Default: "claude-sonnet-4-6"

4. cmdb_health.llm.system_prompt
   Type: string
   Description: "System prompt that instructs the LLM on how to evaluate CMDB health"
   Default: empty

GOVERNANCE CONFIGURATION GROUP (title: "CMDB Health Doctor - Governance"):

5. cmdb_health.governance.restricted_fields
   Type: string
   Description: "Comma-separated field names the LLM cannot auto-fix, require human approval"
   Default: "owned_by,business_criticality"

6. cmdb_health.governance.safe_autofix_fields
   Type: string
   Description: "Comma-separated field names the LLM is allowed to auto-fix without approval"
   Default: "operational_status"

Add the properties export to src/fluent/index.now.ts
```

---

### Prompt H — Create Navigation Menus

```
Create the application navigation menu so users can find this app in
ServiceNow's left sidebar.

Create: src/fluent/navigation/app-menu.now.ts

Application menu settings:
- Title: "CMDB Health Doctor"
- Roles required to see it: itil, admin

Menu items to create:
1. "All Health Records" at order 100
   Shows all records in the health record table as a list view

2. "Critical CIs" at order 200
   Shows only records where health_status equals critical
   This helps users immediately see the most urgent problems

3. "Pending Review" at order 300
   Shows records where review_status equals pending
   This is the queue for human review and approval tasks

Add the navigation export to src/fluent/index.now.ts
```

---

## SECTION 9: UNDERSTANDING THE BUILD AND DEPLOY COMMANDS

Now that your code is written, here is exactly what each command does and when to use it.

### Command: npm run build

**What it does:** Compiles your TypeScript Fluent files (.now.ts) into ServiceNow XML format. Checks for errors. Does NOT touch your instance — nothing is sent anywhere.

**When to use it:** Every time before deploying. Think of it as proofreading before sending an email. It catches mistakes locally before they fail on the server.

**What success looks like:**
```
✔ Compiled 8 modules
✔ No errors found
Build completed in 3.2s
```

**What failure looks like:**
```
✗ Error in src/fluent/tables/health-record.now.ts line 45
  Unknown column type 'blob' — did you mean 'string'?
```
Fix the error in the indicated file, then build again.

---

### Command: npm run types

**What it does:** Connects to your ServiceNow instance and downloads descriptions of all existing tables and fields. Updates files in src/fluent/generated/.

**When to use it:**
- After someone adds a new table or field directly on the instance
- When you get TypeScript errors about unknown table names
- At the start of a new project to get the latest metadata
- After a ServiceNow platform upgrade

**Important:** Never edit files in src/fluent/generated/ — they are always overwritten by this command.

---

### Command: npm run transform

**What it does:** Pulls the CURRENT STATE of your app from the ServiceNow instance and converts it to local Fluent files. This is the reverse of deploy.

**When to use it:**
- When you or a colleague made changes directly on the ServiceNow instance via the browser
- When you want to start local development from the current instance state
- To keep your local code in sync with any instance changes

**Warning:** This will overwrite your local files with what is on the instance. Always commit your local changes to Git first before running this command.

---

### Command: npm run deploy

**What it does:** The main deployment command. Internally it:
1. Runs npm run build to compile everything
2. Packages the compiled output into a ServiceNow Update Set
3. Authenticates to your instance using the stored keychain credentials
4. Uploads and commits the Update Set to your instance
5. Your app changes are now live

**When to use it:** When you are ready to push your changes to ServiceNow.

**What success looks like:**
```
✔ Table:           x_myapp_health_record
✔ ScriptInclude:   CMDBHealthEvaluator
✔ ScriptInclude:   CMDBHealthLLM
✔ ScriptInclude:   CMDBHealthWriter
✔ ScheduledJob:    CMDB Health Doctor — Nightly Run
✔ SystemProperty:  cmdb_health.llm.endpoint (4 properties)
✔ ACL:             x_myapp_health_record.read
✔ AppMenu:         CMDB Health Doctor
✔ Deployed successfully in 18.4s
```

---

## SECTION 10: AFTER DEPLOYMENT — FINAL CONFIGURATION ON THE INSTANCE

After your first successful deploy, you need to configure the app on ServiceNow itself.

### Step 10.1: Navigate to Your App

In ServiceNow, look at the left sidebar. You should now see "CMDB Health Doctor" as a navigation group with the three menu items you defined. If you do not see it, type your app name in the Navigator search bar at the top of the sidebar.

### Step 10.2: Set the LLM System Properties

1. In the ServiceNow Navigator search bar, type: sys_properties.list and press Enter
2. In the search filter, type cmdb_health
3. You will see all 6 properties you defined

Set these values by clicking each one and editing the Value field:

**cmdb_health.llm.endpoint:** The URL of your LLM API. Example for Google Gemini: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

**cmdb_health.llm.api_key:** Your actual API key. This will be encrypted immediately because you defined it as password2 type. Once saved you will not be able to read it back — only the system can use it.

**cmdb_health.llm.model:** The model identifier. Example: claude-sonnet-4-6

**cmdb_health.llm.system_prompt:** A detailed prompt that tells the AI how to analyze CMDB health data. This should explain what good data looks like, what to check for, and how to format its response.

### Step 10.3: Seed Initial Health Records

The scheduled job only processes CIs that already have a health record with run_status = new. For the very first run, you need to create these records. Use this prompt in Claude Code to generate a seeding script:

```
Create a one-time setup script (just show me the JavaScript code to copy,
do not create a permanent file) that I can run in ServiceNow's
Scripts - Background tool.

The script should:
1. Query the top 50 servers from cmdb_ci_server table
2. For each server, check if a health record already exists for it
3. If not, create a health record with run_status = 'new'
4. Log how many records were created

I will copy this code and paste it into ServiceNow's Scripts - Background
tool (navigate there via: System Definition > Scripts - Background).
```

### Step 10.4: Test the Job Manually

Do not wait for 2:00 AM on the first test. Trigger it immediately:

1. Navigate to: System Definition > Scheduled Jobs
2. Search for: CMDB Health Doctor — Nightly Run
3. Open the record
4. Click the Execute Now button at the top
5. Watch progress in real time: System Log > All (filter by Source = CMDB Health Doctor)

---

## SECTION 11: UNDERSTANDING THE TWO-PHASE ARCHITECTURE

This section explains WHY the job is split into two phases, for anyone who wants to understand the design.

### Why Phase 1 and Phase 2 are separate

**Phase 1 — Pure Data Evaluation:** The Evaluator reads CI data from ServiceNow tables (cmdb_ci, cmdb_rel_ci, cert_template, etc.) and calculates scores using pure logic. This is fast, reliable, and deterministic — it always gives the same answer for the same input. If this phase fails, it is usually a data or query issue and is safe to retry immediately.

**Phase 2 — AI Enrichment:** The LLM call sends the Phase 1 results to an external AI service and gets back human-readable summaries, specific action recommendations, and risk assessments. This involves a network call to an external service, which can fail due to rate limits, network issues, or API quota limits. If Phase 2 fails, the Phase 1 data is safely stored in raw_payload_json so the LLM call can be retried independently without re-running the evaluation.

**The benefit:** If 100 CIs are evaluated in Phase 1 and then the LLM service goes down, only Phase 2 needs to re-run the next day. Phase 1 results are preserved.

---

## SECTION 12: TIPS, COMMON MISTAKES, AND HOW TO FIX THEM

### Tip 1: Always Review Claude's Changes Before Approving

When Claude Code proposes a file change, read it before clicking Approve. Check:
- Does it use var not const/let in .server.js files?
- Does it reference the correct table names with the scope prefix?
- Did it remember to add the export to index.now.ts?

### Tip 2: Commit After Each Working Section

```
git add .
git commit -m "Add health evaluator and writer"
```

This gives you a restore point if something breaks later.

### Tip 3: Build Before You Deploy

Always run npm run build before npm run deploy. This catches errors locally before they fail on the instance.

### Tip 4: Reference Your Docs in Prompts

When asking Claude Code to modify something, always point it to the relevant reference file:

```
Looking at @docs/field-reference.md, add the new assessment_notes field
```

This prevents Claude from guessing field names or inventing structure that conflicts with what already exists.

---

### Common Mistake 1: ES6 Syntax in Server Files

**What went wrong:** The generated code uses const, let, arrow functions, or template literals in a .server.js file.

**What you see at runtime:** The Script Include throws vague JavaScript errors like "undefined is not a function" when the scheduled job runs.

**How to fix it:** Prompt Claude Code:
```
Review src/server/CMDBHealthEvaluator.server.js and convert any ES6 syntax
to ES5. Replace const/let with var, replace arrow functions with function() {},
replace template literals with string concatenation using the + operator.
```

---

### Common Mistake 2: Forgot to Export from index.now.ts

**What went wrong:** You created a new Fluent file but did not add it to the barrel export file.

**What you see:** The deploy succeeds without errors but the record does not appear on the instance — it was silently skipped.

**How to fix it:** Prompt Claude Code:
```
Check src/fluent/index.now.ts and compare it against all .now.ts files in
the src/fluent/ directory and its subdirectories. Add exports for any files
that are missing.
```

---

### Common Mistake 3: Credentials Not Set After Deploy

**What went wrong:** The system properties were deployed as empty strings (intentional — you never store credentials in code) but you forgot to fill them in on the instance.

**What you see:** The scheduled job runs Phase 1 successfully but Phase 2 fails immediately for every CI with a message like "LLM endpoint property is empty."

**How to fix it:** Follow Section 10.2 to set the properties on the instance.

---

### Common Mistake 4: Running transform and Losing Local Changes

**What went wrong:** You ran npm run transform without committing local changes first, and it overwrote your work with the instance state.

**How to fix it:**
```
git status       ← see what files changed
git diff         ← see the actual line-by-line differences
git checkout .   ← undo all unstaged changes and restore your files
```

---

## SECTION 13: THE FULL PROJECT LIFECYCLE — SUMMARY

### One-Time Setup
```
Install Node.js → Install SDK CLI → Install Claude Code
         ↓
now-sdk auth add  (connect to your ServiceNow instance)
         ↓
now-sdk init  (create project scaffold, register app on instance)
         ↓
npm install  (download libraries)
         ↓
npm run types  (fetch ServiceNow table type definitions)
         ↓
git init + git commit  (start tracking changes)
```

### Development Cycle (Repeated for Each Feature)
```
Launch Claude Code: claude
         ↓
Give prompts in plain English → Claude writes code → Review → Approve
         ↓
npm run build  (check for errors locally)
         ↓
npm run deploy  (push to ServiceNow)
         ↓
Test on instance
         ↓
git commit  (save your progress)
```

### Maintenance Cycle
```
npm run transform  (pull any instance-side changes back to local)
         ↓
Review what changed with git diff
         ↓
Continue with development cycle above
```

---

## APPENDIX A: COMPLETE COMMAND REFERENCE

| Command | What It Does | When to Use |
|---|---|---|
| now-sdk auth add | Save instance credentials to keychain | Once per instance |
| now-sdk auth list | Show saved credentials | To verify auth is configured |
| now-sdk init | Create new project scaffold | Once at project start |
| npm install | Download project libraries | After cloning or first setup |
| npm run types | Fetch type defs from instance | After schema changes on instance |
| npm run build | Compile TypeScript, check for errors | Before every deploy |
| npm run deploy | Build + push to instance | When ready to deploy changes |
| npm run transform | Pull instance state to local | When instance was edited directly |
| claude | Start Claude Code in current project | During development |
| git add . | Stage all changed files | Before committing |
| git commit -m "" | Save a snapshot of current state | After each working milestone |

---

## APPENDIX B: GLOSSARY OF TERMS

| Term | Plain English Meaning |
|---|---|
| Instance | Your company's copy of ServiceNow at a unique URL |
| Scope | A namespace prefix that isolates your app from others |
| Fluent API | ServiceNow's TypeScript way to define app structure |
| Script Include | A reusable server-side JavaScript module in ServiceNow |
| Scheduled Job | A script that runs automatically on a timer |
| ACL | Access Control List — defines who can see or change data |
| Update Set | A package of changes deployed as a single unit in ServiceNow |
| GlideRecord | ServiceNow's API for querying and updating database tables |
| sys_id | The unique identifier (UUID) of every record in ServiceNow |
| ES5 | An older version of JavaScript that ServiceNow's server engine uses |
| npm | Node Package Manager — installs JavaScript libraries |
| TypeScript | JavaScript with type checking — compiled to plain JavaScript |
| Barrel export | A single file that re-exports everything from a folder |
| Keychain | Your operating system's secure password storage |
| CCC | Correctness, Completeness, Compliance — the three health dimensions |
| password2 | A ServiceNow field type that automatically encrypts stored values |
| sys_properties | ServiceNow's table for storing application configuration values |
| cmdb_ci | The main ServiceNow table that stores all Configuration Items |
| cert_template | ServiceNow's compliance template table |

---

## APPENDIX C: PROJECT FILE MAP — WHERE EVERYTHING LIVES

```
MyServiceNowApp/
│
├── .claude/                         ← Claude Code project intelligence
│   └── skills/
│       └── sndev.md                 ← SDK skill: teaches Claude your project rules
│
├── docs/                            ← Reference documentation
│   ├── field-reference.md           ← All table fields documented
│   ├── system-properties-reference.md
│   └── llm-integration-reference.md
│
├── src/
│   ├── fluent/                      ← TypeScript structure definitions
│   │   ├── index.now.ts             ← BARREL: must export everything below
│   │   ├── tables/
│   │   │   └── health-record.now.ts
│   │   ├── script-includes/
│   │   │   ├── cmdb-health-evaluator.now.ts
│   │   │   ├── cmdb-health-llm.now.ts
│   │   │   └── cmdb-health-writer.now.ts
│   │   ├── scheduled-job/
│   │   │   └── cmdb-health-job.now.ts
│   │   ├── acls/
│   │   │   └── health-record-acls.now.ts
│   │   ├── properties/
│   │   │   └── system-properties.now.ts
│   │   ├── navigation/
│   │   │   └── app-menu.now.ts
│   │   └── generated/               ← Auto-generated, never edit
│   │
│   └── server/                      ← ES5 JavaScript logic
│       ├── CMDBHealthEvaluator.server.js
│       ├── CMDBHealthLLM.server.js
│       ├── CMDBHealthWriter.server.js
│       └── CMDBHealthJob.server.js
│
├── now.config.json                  ← App identity (scope, name, scopeId)
├── package.json                     ← Build scripts and dependencies
└── .eslintrc                        ← Code quality rules
```
