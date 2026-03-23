---
name: teams-run
description: "Resume building a single Teams plan. Orchestrate sequential builder subagents for incomplete tasks, then run a reviewer and apply fixes."
user-invocable: true
---

# Teams: Run (Resume Build)

You are the orchestrator. Resume an existing build by running all incomplete tasks, then reviewing and applying fixes.

---

## Step 1: Find the Plan

Read `ralph-teams/PLAN.md`. If not found:
> `ralph-teams/PLAN.md` not found. Use `teams-plan` to create a plan first.

Identify:
- Plan ID (the `Plan ID:` field — e.g. `#2`)
- All tasks, their status (`[x]` = done, `[!]` = failed, `[ ]` = incomplete), and their complexity annotation (`complexity: simple` or `complexity: complex`)
- Platform (web or mobile)
- Verification scenarios

Print the current state:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — Resuming — [N of M tasks already done]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Task 1: Project Setup          [done]
  ✓  Task 2: Auth System            [done]
  ○  Task 3: API Routes             [pending]
  ○  Task 4: Frontend               [pending]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 2: Execute — Sequential Builder Subagents

Capture the base commit SHA before building starts:
```bash
git rev-parse HEAD
```
Save this as `BASE_SHA`.

For **each incomplete task** (`[ ]` or `[!]`) **in order**, use `spawn_agent`. Pick the model from the task's complexity annotation:
- `complexity: simple` → `model: "gpt-5.4-mini"`
- `complexity: standard` → `model: "gpt-5.4"`

```
spawn_agent(
  agent_type: "worker",
  model: "[gpt-5.4-mini | gpt-5.4 based on task complexity]",
  message: "You are implementing Task [N] of [M]: [task description].

    Platform: [web|mobile]

    Full plan:
    [paste ralph-teams/PLAN.md content]

    Your task: implement Task [N] only. Verify it works using [Playwright|Maestro], then commit.
    If [Playwright|Maestro] tools are not available, run tests/lint instead and note that E2E verification was skipped."
)
```

Wait for each subagent with `wait_agent` before starting the next. As soon as you have recorded the result, call `close_agent` for that finished builder. After each task, update `ralph-teams/PLAN.md` (change `[ ]` to `[x]` on success, `[!]` on failure) and reprint the task board.

If a builder subagent fails, log it as failed and continue.

---

## Step 3: Opus Review

After all tasks complete, print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Reviewing implementation...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Spawn the reviewer with `spawn_agent`:

```
spawn_agent(
  agent_type: "default",
  model: "gpt-5.4",
  message: "Review the implementation for: [feature name].

    Base commit (before build started): [BASE_SHA]
    Use `git diff [BASE_SHA]..HEAD` to see all changes.

    Full plan:
    [paste ralph-teams/PLAN.md content]

    Write your review to ralph-teams/REVIEW.md.
    If a second-opinion coding CLI is available, use it for a second opinion."
)
```

Wait for the reviewer with `wait_agent`. After you have read `ralph-teams/REVIEW.md` and captured anything you need from the result, call `close_agent`.

---

## Step 4: Apply Fixes

Read `ralph-teams/REVIEW.md`. If there are blocking findings:
1. Print a summary of the findings.
2. Spawn a fix-pass builder:
   ```
   spawn_agent(
     agent_type: "worker",
     model: "gpt-5.4-mini",
     message: "You are applying review fixes (not implementing a new task).

       Review findings to fix:
       [paste blocking findings from ralph-teams/REVIEW.md]

       Platform: [web|mobile]

       Fix each blocking issue. Verify the fixes work using [Playwright|Maestro].
       If verification tools are not available, run tests/lint instead.
       Commit all fixes together with message: 'fix: address review findings'."
   )
   ```
3. Wait for the fix-pass builder with `wait_agent`, then call `close_agent` once its result has been handled.

Final summary:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — Build complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Task 1: ...
  ✓  Task 2: ...
  ✓  Review: [passed | N fixes applied]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then suggest:
> **Build done. Run `teams-verify` to walk through manual E2E verification.**

---

## Step 5: Optional — Update Docs

Ask the user:

> **"Would you like to update your documentation? Run `teams-document` to have the scribe update your README, ARCHITECTURE.md, and other docs."**

If yes, invoke the `teams-document` skill.

If **no**, skip.
