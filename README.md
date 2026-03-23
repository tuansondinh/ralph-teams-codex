# ralph-teams-codex

A Codex skill pack for planning and building features with sequential builder subagents (gpt-5.4-mini or gpt-5.4 based on task complexity), automated E2E verification, a review pass, and integrated debug and documentation skills.

## Does Codex Support Plugins?

Not in the Claude marketplace sense. Codex is extended through:

- `skills/` with `SKILL.md` metadata and instructions
- `AGENTS.md` for repo-level behavior
- MCP tools such as Playwright and Maestro
- subagents started with `spawn_agent`

This repo packages the original workflow in that Codex-native form.

## Quick Start

```text
teams-plan
```

Describe what you want to build. Codex handles planning, sequential task execution, review, and verification.

## Install

This repo now includes a Codex installer CLI, following the same basic model as GSD: runtime-specific assets are copied into Codex's config directory.

When published, the intended install flow is:

```bash
npx ralph-teams-codex --global
```

Local install into the current project:

```bash
npx ralph-teams-codex --local
```

Until the package is published, you can run the installer from this repo:

```bash
node bin/ralph-teams-codex.js --global
node bin/ralph-teams-codex.js --local
```

Install only specific skills:

```bash
node bin/ralph-teams-codex.js --global --skills teams-plan,teams-run,teams-verify
```

Uninstall:

```bash
node bin/ralph-teams-codex.js --global --uninstall
node bin/ralph-teams-codex.js --local --uninstall
```

Global installs target `~/.codex/skills` by default, or `$CODEX_HOME/skills` if `CODEX_HOME` is set. Local installs target `./.codex/skills`.

Restart Codex after installing or uninstalling skills.

## How It Works

```mermaid
flowchart TD
    classDef user fill:#ffdfba,stroke:#ffb347,stroke-width:2px,color:#333
    classDef orch fill:#bae1ff,stroke:#5facff,stroke-width:2px,color:#333
    classDef agent fill:#baffc9,stroke:#42d669,stroke-width:2px,color:#333
    classDef doc fill:#ffffba,stroke:#e6e65a,stroke-width:2px,color:#333
    classDef cmd fill:#f3e8ff,stroke:#c084fc,stroke-width:2px,color:#333
    classDef optional fill:#ffe4e1,stroke:#ff9999,stroke-width:1px,stroke-dasharray:4,color:#333

    P1["teams-plan - Discuss feature, write plan, get approval"]:::cmd
    P["ralph-teams/PLAN.md"]:::doc
    CX1["Codex second opinion on plan (optional)"]:::optional

    P1 --> P
    P --> CX1

    P2["teams-run - Build each task sequentially"]:::cmd

    CX1 -->|"approved"| P2

    subgraph Build[" "]
        direction TB
        B1["mini/5.4 Builder - Task 1"]:::agent
        B2["mini/5.4 Builder - Task 2"]:::agent
        BN["mini/5.4 Builder - Task N"]:::agent
        B1 --> B2 --> BN
    end

    P2 -->|"one fresh agent per task"| Build

    R["Reviewer Agent - Reviews all changes"]:::agent
    CX2["Codex second opinion on review (optional)"]:::optional
    REV["ralph-teams/REVIEW.md"]:::doc
    BF["Builder Agent - Fixes"]:::agent
    DOCS["Scribe Agent - Updates docs (optional)"]:::optional

    Build --> R
    R --> CX2
    CX2 --> REV
    REV --> BF
    BF --> DOCS

    P3["teams-verify - Walk through scenarios manually"]:::cmd
    DBG["teams-debug - Fix bugs against the plan"]:::optional
    DOCS --> P3
    P3 --> DBG
```

Each task runs in its own isolated subagent with a clean 200k token context window. Results are committed after each task so you can always resume with `teams-run`.

## Skills

| Skill | Description |
|-------|-------------|
| `teams-plan` | Discuss, plan, optionally review the plan, execute tasks sequentially, review, then apply fixes if needed |
| `teams-run` | Resume an existing plan from where it left off |
| `teams-verify` | Walk through manual E2E verification scenario by scenario |
| `teams-debug` | Fix a bug in relation to the active plan — usable anytime |
| `teams-document` | Update existing docs (README, ARCHITECTURE.md, etc.) for the latest plan |
| `loop-run` | Resume phased execution |

## Output

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #3 — 2 of 4 tasks complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Task 1: Project Setup          [done]        (mini)
  ✓  Task 2: Auth System            [done]        (5.4)
  ►  Task 3: API Routes             [building...]  (5.4)
  ○  Task 4: Frontend               [pending]      (mini)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Status symbols: `✓` done · `►` building · `✗` failed · `○` pending · `(mini)` simple task · `(5.4)` standard task

## Output Files

All build artifacts are written to `./ralph-teams/` in your project:

| File | Contents |
|------|----------|
| `ralph-teams/PLAN.md` | Plan ID, tasks with complexity, acceptance criteria, verification scenarios |
| `ralph-teams/REVIEW.md` | Reviewer findings |
| `ralph-teams/VERIFY.md` | Manual verification results |
