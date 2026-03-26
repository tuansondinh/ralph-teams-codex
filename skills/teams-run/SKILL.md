---
name: teams-run
description: "Resume building a single Teams plan. Orchestrate sequential builder subagents for incomplete phases, then run a reviewer and apply fixes."
user-invocable: true
---

# Teams: Run (Resume Build)

You are the orchestrator. Resume an existing build by running all incomplete phases, then reviewing and applying fixes.

---

## Step 1: Find the Plan

List all files matching `.ralph-teams/PLAN-*.md`. If none exist:
> No plan files found in `.ralph-teams/`. Use `teams-plan` to create a plan first.

If multiple plan files exist, show the list and ask the user which plan to resume. Default to the highest-numbered plan.

Read the selected plan file and store the filename as `PLAN_FILE`.

Identify:
- Plan ID (the `Plan ID:` field — e.g. `#2`)
- All phases, their status (`[x]` = done, `[!]` = failed, `[ ]` = incomplete), and their complexity annotation (`complexity: simple` or `complexity: standard`)
- Platform (web or mobile)
- Verification scenarios

Print the current state:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — Resuming — [N of M phases already done]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Phase 1: Project Setup          [done]
  ✓  Phase 2: Auth System            [done]
  ○  Phase 3: API Routes             [pending]
  ○  Phase 4: Frontend               [pending]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 2: Execute — Sequential Builder Subagents

Capture the base commit SHA before building starts:
```bash
git rev-parse HEAD
```
Save this as `BASE_SHA`.

For **each incomplete phase** (`[ ]` or `[!]`) **in order**, use `spawn_agent`. Pick the model from the phase's complexity annotation:
- `complexity: simple` → `model: "gpt-5.4-mini"`
- `complexity: standard` → `model: "gpt-5.4"`

```
spawn_agent(
  agent_type: "worker",
  model: "[gpt-5.4-mini | gpt-5.4 based on phase complexity]",
  message: "You are implementing Phase [N] of [M]: [phase description].

    Tasks to complete:
    [list tasks from the phase]

    Platform: [web|mobile]

    Plan file: [PLAN_FILE] — read this file for full context, acceptance criteria, and verification scenarios.

    Your assignment: implement Phase [N] only, completing all its tasks. Verify it works using [Playwright|Maestro], then commit.
    If [Playwright|Maestro] tools are not available, run tests/lint instead and note that E2E verification was skipped."
)
```

Wait for each subagent with `wait_agent` before starting the next. As soon as you have recorded the result, call `close_agent` for that finished builder. After each phase, update `[PLAN_FILE]` (change `[ ]` to `[x]` on success, `[!]` on failure) and reprint the phase board.

If a builder subagent fails, log it as failed and continue.

---

## Step 3: Review

After all phases complete, print:

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

    Plan file: [PLAN_FILE] — read this file for phases, acceptance criteria, and verification scenarios.

    Write your review to .ralph-teams/REVIEW.md."
)
```

Wait for the reviewer with `wait_agent`. After you have read `.ralph-teams/REVIEW.md` and captured anything you need from the result, call `close_agent`.

---

## Step 4: Apply Fixes

Read `.ralph-teams/REVIEW.md`. If there are **blocking findings** (issues the reviewer escalated — not ones already marked `[fixed by reviewer]`):
1. Print a summary of the findings.
2. Spawn a fix-pass builder:
   ```
   spawn_agent(
     agent_type: "worker",
     model: "gpt-5.4-mini",
     message: "You are applying review fixes (not implementing a new phase).

       Review findings to fix:
       [paste blocking findings from .ralph-teams/REVIEW.md]

       Platform: [web|mobile]

       Fix each blocking issue. Verify the fixes work using [Playwright|Maestro].
       If verification tools are not available, run tests/lint instead.
       Commit all fixes together with message: 'fix: address review findings'."
   )
   ```
3. Wait for the fix-pass builder with `wait_agent`, then call `close_agent` once its result has been handled.
4. After the fix-pass builder completes, update `.ralph-teams/REVIEW.md` — append a fix summary section at the bottom:
   ```markdown
   ---

   ## Fixes Applied

   **Fixes:** [brief description of what was changed]
   **Commit:** fix: address review findings
   **Status:** All blocking findings resolved
   ```
   Also mark any blocking findings in the REVIEW.md body as `Resolved` inline.

Final summary:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  Plan #[N] — Build complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Phase 1: ...
  ✓  Phase 2: ...
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
