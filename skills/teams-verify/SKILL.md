---
name: teams-verify
description: "Guide the user through manually verifying the build E2E — walks through each scenario step-by-step, records pass/fail, and writes a verification report."
user-invocable: true
---

# Teams: Manual Verify

You guide the user through manually verifying the completed build end-to-end. One scenario at a time. You record their results and write a final report.

---

## Step 1: Load the Plan

Read `ralph-teams/PLAN.md`. If not found:
> `ralph-teams/PLAN.md` not found. Run `teams-plan` first.

Extract:
- All tasks
- Acceptance criteria
- Verification scenarios

Also read `ralph-teams/REVIEW.md` if it exists (to know what was already flagged by the automated reviewer).

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

For each verification scenario from `ralph-teams/PLAN.md`, present it one at a time:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VERIFY  Scenario [N of M]
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
- **fail** → ask: *"What went wrong?"* Record their description. Ask if they want to stop here or continue verifying the rest.
- **skip** → record as skipped with reason, move on

Keep going until all scenarios are covered.

---

## Step 4: Write Verification Report

Write results to `ralph-teams/VERIFY.md`:

```markdown
# Manual Verification Report: [Feature Name]

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
  VERIFY  Done — [N passed, N failed, N skipped]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Scenario 1: [name]
  ✗  Scenario 2: [name]
  —  Scenario 3: [name]  (skipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If there are failures, ask:
> **Want me to open a fix pass? I can spawn a builder to address the failed scenarios.**

If yes, read the failures from `ralph-teams/VERIFY.md` and use `spawn_agent` to start a builder subagent, preferably with `agent_type: "worker"` and `model: "gpt-5.4-mini"`, with the list of issues to fix. Then offer to re-run verification on just the failed scenarios.
