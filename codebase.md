# ralph-teams-plugin — Codebase Reference

**Version:** 1.3.1 | **Type:** Claude Code Plugin (Markdown-based, no compiled code)

---

## File Map

```
ralph-teams-plugin/
├── .claude-plugin/
│   └── marketplace.json          # Plugin registry metadata
├── agents/
│   ├── teams-builder.md          # Sonnet builder subagent (implements tasks + applies review fixes)
│   └── teams-reviewer.md         # Opus reviewer subagent (reviews full implementation)
├── skills/
│   ├── teams-plan/SKILL.md       # /teams:plan — discuss → plan → build → review → fix
│   ├── teams-run/SKILL.md        # /teams:run  — resume an existing plan
│   ├── teams-verify/SKILL.md     # /teams:verify — manual E2E verification walkthrough
│   ├── loop-plan/SKILL.md        # /teams:loop-plan — phased plan + execute
├── README.md
├── FLOW.md                       # Mermaid execution flow diagram
└── codebase.md                   # This file
```

---

## Plugin Architecture

All files are **Markdown with YAML frontmatter** — no build step, no package manager.

### Agent Files (`agents/`)

Frontmatter fields: `name`, `description`, `model` (sonnet/opus/haiku).

| Agent | Model | Role |
|-------|-------|------|
| `teams-builder.md` | Sonnet | Implements a single task or applies review fixes. Verifies with Playwright (web) or Maestro (mobile) before committing. |
| `teams-reviewer.md` | Opus | Reviews the full implementation against acceptance criteria. Runs tests. Optionally consults Codex via Multi-CLI MCP. Writes `.build/REVIEW.md`. |

### Skill Files (`skills/`)

Frontmatter fields: `name`, `description`, `user-invocable: true`.

| Skill file | Command | Purpose |
|------------|---------|---------|
| `teams-plan/SKILL.md` | `/teams:plan` | 6-step flow: discuss → plan → optional AI review → approve → sequential builders → Opus review → apply fixes |
| `teams-run/SKILL.md` | `/teams:run` | Resume a plan; runs incomplete tasks, then review + fix |
| `teams-verify/SKILL.md` | `/teams:verify` | Walk user through manual E2E verification scenario by scenario |
| `loop-plan/SKILL.md` | `/teams:loop-plan` | Phased plan + execute (multi-phase mode) |

---

## Execution Model

```
Orchestrator (plan or run skill)
  ├── Agent(teams-builder, sonnet) → Task 1 → verify → commit
  ├── Agent(teams-builder, sonnet) → Task 2 → verify → commit
  ├── ...
  ├── Agent(teams-reviewer, opus)  → review all changes → .build/REVIEW.md
  └── Agent(teams-builder, sonnet) → apply review fixes → commit
```

- Builders are spawned **sequentially** — one per task, one at a time
- Each builder verifies its work with **Playwright** (web) or **Maestro** (mobile) before committing
- If verification tools are unavailable, builders fall back to running tests/lint
- The Opus reviewer runs after all tasks complete, reviewing the full diff from `BASE_SHA`
- The reviewer optionally uses `mcp__Multi-CLI__Ask-Codex` for a second opinion
- If blocking findings exist, a final builder is spawned to apply fixes

---

## Key Contracts

### Builder subagent
1. Receives assignment from orchestrator (task + subtasks, or review fixes)
2. Reads `.build/PLAN.md` for context
3. Implements the work, completing all subtasks in order
4. Verifies with Playwright/Maestro (or falls back to tests if unavailable)
5. Commits with descriptive message
6. Returns summary with commit SHA

### Reviewer subagent
1. Receives `BASE_SHA` and plan from orchestrator
2. Runs `git diff <BASE_SHA>..HEAD` to see all changes
3. Reviews against acceptance criteria
4. Runs project build/tests
5. Optionally consults Codex via Multi-CLI MCP
6. Writes `.build/REVIEW.md` with blocking/non-blocking findings

### .build/ directory

| File | Written by | Purpose |
|------|-----------|---------|
| `PLAN.md` | Orchestrator | Tasks, acceptance criteria, verification scenarios |
| `REVIEW.md` | Reviewer | Code review findings |
| `VERIFY.md` | Verify skill | Manual E2E verification results |

Created by the orchestrator (`mkdir -p .build`) at the start of `/teams:plan`.

### PLAN.md format

```markdown
# Plan: [Feature Name]

Generated: [date]
Platform: web | mobile
Status: draft | approved

## Tasks
1. [ ] Task 1: [Description] — complexity: simple
   - [Subtask 1 description]
   - [Subtask 2 description]
2. [x] Task 2: [Description] — complexity: standard  ← completed
   - [Subtask 1 description]
3. [!] Task 3: [Description] — complexity: standard  ← failed
   - [Subtask 1 description]
   - [Subtask 2 description]

## Acceptance Criteria
- [Criterion 1]

## Verification
Tool: Playwright | Maestro
Scenarios:
- [Scenario: name — steps — expected result]
```

Task status is tracked at the task level only (`[ ]` pending, `[x]` done, `[!]` failed). Subtasks are guidance for the builder — no individual status tracking.

---

## Orchestrator Progress Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TEAMS  [N of M tasks complete]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Task 1: ...          [done]
  ►  Task 2: ...          [building...]
  ○  Task 3: ...          [pending]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Status symbols: `✓` done · `►` building · `✗` failed · `○` pending

---

## marketplace.json Schema

```json
{
  "name": "ralph-teams-claude-plugin",
  "owner": { "name": "<github-handle>" },
  "metadata": { "description": "...", "version": "X.Y.Z" },
  "plugins": [{
    "name": "teams",
    "source": "./",
    "description": "...",
    "version": "X.Y.Z",
    "keywords": [...],
    "category": "productivity",
    "skills": "./skills/"
  }]
}
```

Plugin `version` must always match `metadata.version`.
