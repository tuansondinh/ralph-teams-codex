---
name: teams-verify
description: "Guide the user through manually verifying the build E2E — walks through each scenario step-by-step, records pass/fail, and writes a verification report."
user-invocable: true
---

# Teams: Manual Verify

You guide the user through manually verifying the completed build end-to-end. One scenario at a time. You record their results and write a final report.

---

## Step 1: Load the Plan

Read `.ralph-teams/PLAN.md`. If not found:
> `.ralph-teams/PLAN.md` not found. Run `teams-plan` first.

Extract:
- Plan ID (the `Plan ID:` field — e.g. `#2`)
- All tasks
- Acceptance criteria
- Verification scenarios

Also read `.ralph-teams/REVIEW.md` if it exists (to know what was already flagged by the automated reviewer).

---

## Step 2: Setup Check

Before starting, ask the user:

> **Before we verify, confirm setup:**
>
> - Is the app running? (URL or device/simulator)
> - Any test accounts or data needed?
> - Anything you want to skip?

Wait for their response. Note any skips.

---

## Step 3: Walk Through Scenarios

For each verification scenario from `.ralph-teams/PLAN.md`, present it one at a time:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — Scenario [N of M]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Scenario name]

  Steps:
  1. [Step]
  2. [Step]
  3. [Step]

  Expected result:
  [What the user should see]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then ask:
> **Result? `pass` / `fail` / `skip` — or describe what you saw.**

- **pass** → record it, move to next scenario
- **fail** → ask: *"What went wrong?"* Record their description. Then immediately offer:
  > **Bug detected. Run `teams-debug` to fix it now, or continue verifying the rest first?**

  If they say **fix now**: invoke the `teams-debug` skill directly, passing the scenario name and their failure description as context. After the fix is applied, re-run this scenario before continuing.

  If they say **continue**: record the failure and move to the next scenario.
- **skip** → record as skipped with reason, move on

Keep going until all scenarios are covered.

---

## Step 4: Write Verification Report

Write results to `.ralph-teams/VERIFY.md`:

```markdown
# Manual Verification Report: [Feature Name]

Plan ID: #[N]
Date: [date]
Verified by: User

## Summary
- Total scenarios: N
- Passed: N
- Failed: N
- Skipped: N

## Results

### ✓ Scenario 1: [Name]
Status: PASS

### ✗ Scenario 2: [Name]
Status: FAIL
User reported: [description]

### — Scenario 3: [Name]
Status: SKIPPED
Reason: [reason]

## Acceptance Criteria
- [x] Criterion 1
- [ ] Criterion 2 — FAILED (see scenario 2)
```

---

## Step 5: Summary

Print the final result:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — Done — [N passed, N failed, N skipped]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Scenario 1: [name]
  ✗  Scenario 2: [name]
  —  Scenario 3: [name]  (skipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If there are failures, offer:

> **N scenario(s) failed. Options:**
> - `teams-debug` — fix bugs one at a time with full plan context (recommended)
> - **Fix all** — I spawn a single builder to address all failures at once

If they choose **`teams-debug`**: invoke the `teams-debug` skill for each failed scenario in order, passing the scenario name and failure description. After each fix, mark the scenario as `FIXED` in `.ralph-teams/VERIFY.md`.

If they choose **fix all**: read the failures from `.ralph-teams/VERIFY.md` and use `spawn_agent` to start a builder subagent:

```
spawn_agent(
  agent_type: "worker",
  model: "gpt-5.4-mini",
  message: "You are fixing multiple bugs found during manual verification.

    Failed scenarios:
    [paste full list of failures from .ralph-teams/VERIFY.md]

    Feature plan (.ralph-teams/PLAN.md):
    [paste full PLAN.md content]

    Instructions:
    - Fix each failed scenario
    - Platform: [web|mobile from PLAN.md]
    - Verify fixes using [Playwright|Maestro] after applying them
    - If verification tools are not available, run tests/lint instead
    - Commit with message: 'fix: address verification failures'"
)
```

Wait for the builder with `wait_agent`. After you have handled the result and updated any verification state, call `close_agent`.

Then offer to re-run verification on just the failed scenarios.
