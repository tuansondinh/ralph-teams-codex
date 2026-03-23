# ralph-teams-codex

A Codex skill pack for planning and building features with sequential builder subagents, automated E2E verification, a review pass, and an optional fix pass.

## Does Codex Support Plugins?

Not in the Claude marketplace sense. Codex is extended through:

- `skills/` with `SKILL.md` metadata and instructions
- `AGENTS.md` for repo-level behavior
- MCP tools such as Playwright and Maestro
- subagents started with `spawn_agent`

This repo packages the original workflow in that Codex-native form.

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

## Skills

| Skill | Description |
|-------|-------------|
| `teams-plan` | Discuss, plan, optionally review the plan, execute tasks sequentially, review, then apply fixes if needed |
| `teams-run` | Resume an existing plan from where it left off |
| `teams-verify` | Walk through manual E2E verification scenario by scenario |
| `loop-plan` | Plan a larger feature in phases |
| `loop-run` | Resume phased execution |

## How It Works

1. `teams-plan` writes `ralph-teams/PLAN.md` with tasks, acceptance criteria, and verification scenarios.
2. A builder subagent is spawned for each task in sequence.
3. Each builder verifies with Playwright for web or Maestro for mobile when available.
4. A reviewer subagent writes `ralph-teams/REVIEW.md`.
5. `teams-verify` writes `ralph-teams/VERIFY.md` from manual verification results.

## Output

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TEAMS  2 of 4 tasks complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Task 1: Project Setup          [done]
  ✓  Task 2: Auth System            [done]
  ►  Task 3: API Routes             [building...]
  ○  Task 4: Frontend               [pending]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Status symbols: `✓` done, `►` building, `✗` failed, `○` pending.
