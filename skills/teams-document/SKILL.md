---
name: teams-document
description: "Update existing project docs (README.md, ARCHITECTURE.md, etc.) and the active plan file to reflect the latest build. Spawns a lightweight scribe agent to find and update relevant documentation files and ensure the plan is accurate."
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
  • .ralph-teams/PLAN.md (verify phase statuses + overall status)
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

    Phases completed:
    [paste phase list from .ralph-teams/PLAN.md]

    Acceptance criteria:
    [paste acceptance criteria from .ralph-teams/PLAN.md]

    Instructions:
    1. Update `.ralph-teams/PLAN.md` first:
       - Run `git log --oneline` to verify which phases were actually committed.
       - Ensure each phase checkbox matches reality: `[x]` if committed, `[!]` if it failed, `[ ]` if not started.
       - Update the top-level `Status:` field to reflect the current state (e.g., `complete`, `in-progress`).
    2. Find all existing documentation files: README.md, ARCHITECTURE.md, docs/**, CHANGELOG.md, or any other .md files that describe the project.
    3. For each relevant file, update only the sections affected by the completed phases — do not rewrite unrelated content.
    4. Keep changes minimal and accurate. Only document what was actually built.
    5. Do NOT create new documentation files unless one is completely missing and clearly expected (e.g., no README.md at all).
    6. After updating, commit all changes with message: 'docs: update docs for Plan #[N] — [feature name]'

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
