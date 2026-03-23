---
name: teams-document
description: "Update existing project docs (README.md, ARCHITECTURE.md, etc.) to reflect the latest Teams plan. Spawns a lightweight scribe agent to find and update relevant documentation files."
user-invocable: true
---

# Teams: Document

Update existing project documentation to reflect what was built in the current plan. Spawns a scribe agent that finds relevant docs and updates them — no new files created unless explicitly needed.

**Prerequisite:** `.ralph-teams/PLAN.md` must exist. If not found, stop:
> `.ralph-teams/PLAN.md` not found. Run `teams-plan` first.

---

## Step 1: Load Context

Read:
- `.ralph-teams/PLAN.md` — plan ID, feature name, tasks completed, acceptance criteria
- `.ralph-teams/REVIEW.md` — if it exists, for additional context on what was changed
- Run `git log --oneline` to identify recent commits from the build

---

## Step 2: Confirm Scope

Show the user what will be updated:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — [Feature Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Scribe will scan for and update:
  • README.md
  • ARCHITECTURE.md
  • docs/**
  • Any other relevant docs found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask:
> **Anything to skip or add? Reply `go` to start, or tell me what to adjust.**

---

## Step 3: Spawn the Scribe

When confirmed, spawn a scribe agent:

```
spawn_agent(
  agent_type: "worker",
  model: "gpt-5.4-mini",
  message: "You are a documentation scribe. Your job is to update existing project documentation to reflect recent changes — not to create new files.

    Plan ID: #[N]
    Feature: [feature name]

    Tasks completed:
    [paste task list from .ralph-teams/PLAN.md]

    Acceptance criteria:
    [paste acceptance criteria from .ralph-teams/PLAN.md]

    Instructions:
    1. Find all existing documentation files: README.md, ARCHITECTURE.md, docs/**, CHANGELOG.md, or any other .md files that describe the project.
    2. For each relevant file, update only the sections affected by the completed tasks — do not rewrite unrelated content.
    3. Keep changes minimal and accurate. Only document what was actually built.
    4. Do NOT create new documentation files unless one is completely missing and clearly expected (e.g., no README.md at all).
    5. After updating, commit all documentation changes with message: 'docs: update docs for Plan #[N] — [feature name]'

    What to update (examples):
    - README: feature descriptions, usage instructions, setup steps
    - ARCHITECTURE.md: new components, changed data flows, updated diagrams descriptions
    - CHANGELOG.md: add an entry for this feature
    - API docs: new or changed endpoints"
)
```

Print while running:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — Updating docs...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Wait for the scribe with `wait_agent`. After you have captured the list of updated files and any commit details you need, call `close_agent`.

---

## Step 4: Done

After the scribe completes, print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — Docs updated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [list of files updated by the scribe]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
