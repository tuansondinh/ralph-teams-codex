---
name: teams-debug
description: "Fix any bug related to an active Teams plan. Can be triggered by the user at any time or automatically from teams-verify on failure. Reads PLAN.md, VERIFY.md, and REVIEW.md for context, then spawns a targeted builder to fix the issue."
user-invocable: true
---

# Teams: Debug

Fix a bug related to the current Teams plan. This skill can be triggered:
- **By the user at any time** — e.g. "something's broken, use `teams-debug`"
- **Automatically from `teams-verify`** — when a scenario fails during manual verification

It reads the existing plan and any available verification/review reports to understand context before fixing.

**Prerequisite:** `.ralph-teams/PLAN.md` must exist. If not found, stop and tell the user to run `teams-plan` first.

---

## Step 1: Load Context

Check that `.ralph-teams/PLAN.md` exists. If not:
> `.ralph-teams/PLAN.md` not found. This skill requires an active Teams plan. Run `teams-plan` first.

Read all available context files:
- `.ralph-teams/PLAN.md` — the feature plan (note its `Plan ID:` field)
- `.ralph-teams/VERIFY.md` — if it exists, the manual verification report with failed scenarios
- `.ralph-teams/REVIEW.md` — if it exists, the automated review findings

---

## Step 2: Identify the Bug

If the user described the bug when invoking this skill, use that description.

Otherwise, ask:

> **What's the bug?**
>
> Describe what went wrong, what you expected, and what you saw. Include the scenario name if it came from `teams-verify`.

Wait for their response.

---

## Step 3: Confirm Scope

Summarize your understanding back to the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — Bug report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Feature:   [feature name from PLAN.md]
  Bug:       [one-line summary]
  Related:   [phase(s)/task(s) or scenario(s) from the plan]
  Criteria:  [affected acceptance criteria, if any]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask:
> **Correct? Reply `yes` to fix, or clarify what I got wrong.**

---

## Step 4: Spawn a Fix Builder

When confirmed, spawn a builder subagent:

```
spawn_agent(
  agent_type: "worker",
  model: "gpt-5.4-mini",
  message: "You are fixing a bug found during manual verification of a completed feature.

    Bug report:
    [user's bug description]

    Feature plan (.ralph-teams/PLAN.md):
    [paste full PLAN.md content]

    [If VERIFY.md exists:]
    Verification report (.ralph-teams/VERIFY.md):
    [paste VERIFY.md content]

    [If REVIEW.md exists:]
    Review findings (.ralph-teams/REVIEW.md):
    [paste REVIEW.md content]

    Instructions:
    - Investigate the root cause of the bug before making changes
    - Fix only what is broken — do not refactor unrelated code
    - Platform: [web|mobile from PLAN.md]
    - Verify the fix using [Playwright|Maestro] after applying it
    - If verification tools are not available, run tests/lint instead
    - Commit with message: 'fix: [short description of the bug fixed]'"
)
```

Print while the builder runs:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — Fixing bug...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Wait for the builder with `wait_agent`. After you have handled the result, call `close_agent`.

---

## Step 5: Update Verification Report

After the builder completes, if `.ralph-teams/VERIFY.md` exists, update the relevant scenario's status from `FAIL` to `FIXED`:

```markdown
### ✓ Scenario N: [Name]
Status: FIXED
Fix applied: [commit message or brief description]
```

---

## Step 5b: Update Review Report

If `.ralph-teams/REVIEW.md` exists, append a fix summary section at the bottom:

```markdown
---

## Fix Applied

**Bug:** [one-line bug summary]
**Fix:** [brief description of what was changed]
**Commit:** [commit message]
**Status:** Resolved
```

If the REVIEW.md already has findings related to this bug, update the relevant finding's status to `Resolved` inline as well.

---

## Step 6: Done

Print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — Fix applied
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Bug:    [summary]
  Status: Fixed + committed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then ask:
> **Want to re-verify this scenario? Run `teams-verify` to continue from where you left off.**
