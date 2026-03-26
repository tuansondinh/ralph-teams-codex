---
name: teams-plan
description: "Plan and build a feature. Orchestrate a plan, spawn sequential builder subagents per phase with Playwright or Maestro verification, then run a reviewer and a fix pass if needed."
user-invocable: true
---

# Teams: Plan + Build

You are the planner and orchestrator. Your job: discuss the feature, create a plan, execute it with sequential builder subagents, review the result with a reviewer, and apply fixes.

---

## Step 1: Discuss + Plan

Ask: **"What do you want to build?"**

Discuss with the user. Identify the target platform: **web** or **mobile** (this determines whether the builder uses Playwright or Maestro for verification).

**Phase sizing:** Each phase runs in its own builder agent with a 200k token context window. A well-sized phase **MUST target ~60% of that context** — enough that the builder is doing substantial work, but not so much that it risks context exhaustion (context rot). Phases contain tasks (concrete steps the builder follows).
- **Too small:** a phase that takes only a few minutes or touches one file — merge it into a related phase or make it a task within a larger phase.
- **Too big:** a phase whose tasks would push the builder past ~60% context — context rot causes quality to degrade. Split it into two phases.
- **Right size:** "Implement full auth system" (tasks: user model + DB migration, signup/login endpoints, JWT middleware + refresh tokens, password reset flow, email verification, auth guards on all protected routes, unit + integration tests), "Build product catalog" (tasks: product model + seed data, list page with filters + pagination, detail page, search endpoint, cart integration, component tests).

> **Rule of thumb:** a phase = one meaningful feature area with enough depth to keep a builder busy for a substantial session. Tasks = the concrete steps the builder takes to complete it. Aim for 4–8 tasks per phase. Target ~60% context usage — not less (wasted capacity), not more (context rot).

**Phase complexity:** For each phase, assign a complexity level — this determines which model the builder uses:
- `simple` → `gpt-5.4-mini`: truly trivial phases only — renaming, copy changes, config tweaks, adding a single field
- `standard` → `gpt-5.4`: everything else — the default for any phase with real logic, UI, CRUD, auth, migrations, architecture, etc.

**Prepare the build directory:**

```bash
mkdir -p ralph-teams
```

**Determine the plan number:**
- Check for existing plan files: `.ralph-teams/PLAN-*.md`
- Count existing files to determine N (next plan number = count + 1)
- If plans exist, inform the user:
  > **Found [N-1] existing plan(s). Creating Plan #[N]. Use `teams-run` to resume an existing plan.**
- If no existing plans: plan number = 1

Write `.ralph-teams/PLAN-[N].md`:

```markdown
# Plan #[N]: [Feature Name]

Plan ID: #[N]
Generated: [date]
Platform: web | mobile
Status: draft

## Phases
1. [ ] Phase 1: [Description] — complexity: simple
   - [Task 1 description]
   - [Task 2 description]
2. [ ] Phase 2: [Description] — complexity: standard
   - [Task 1 description]
   - [Task 2 description]
   - [Task 3 description]
3. [ ] Phase 3: [Description] — complexity: standard
   - [Task 1 description]
   - [Task 2 description]

## Acceptance Criteria
- [Criterion 1]
- [Criterion 2]

## Verification
Tool: Playwright | Maestro
Scenarios:
- [Scenario 1: name — steps — expected result]
- [Scenario 2: name — steps — expected result]
```

---

## Step 2: Optional Plan Review

After writing the draft plan, ask the user:

> **"Would you like another AI agent to review this plan for completeness and edge cases? (Recommended: Yes)"**

If **yes**:
1. **Check for a second-opinion coding CLI:** Look for an available tool such as `mcp__Multi_CLI__Ask_Claude`, `mcp__Multi_CLI__Ask_Gemini`, or `mcp__Multi_CLI__Ask_OpenCode`.
   - If available: read `.ralph-teams/PLAN-[N].md` and call that tool with the prompt: *"Review this implementation plan. Identify missing phases, edge cases, or architectural gaps. Be concise."*
   - If not available: use `spawn_agent` to start a reviewer subagent and prompt it to review `.ralph-teams/PLAN-[N].md` for completeness, edge cases, and architectural gaps. After `wait_agent` returns and you have incorporated the feedback, call `close_agent`.
2. Evaluate the feedback. Incorporate valid findings into `.ralph-teams/PLAN-[N].md`.
3. Briefly tell the user what changed.

If **no**: skip to Step 3.

---

## Step 3: Get Approval

Display `.ralph-teams/PLAN-[N].md` and ask:

> **"Plan looks good? Reply `yes` to start, or tell me what to change."**

---

## Step 4: Execute — Sequential Builder Subagents

When approved:

1. Update `.ralph-teams/PLAN-[N].md` status to `approved`.
2. Capture the base commit SHA before building starts:
   ```bash
   git rev-parse HEAD
   ```
   Save this as `BASE_SHA` — you will pass it to the reviewer later.
3. Print:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     RALPH-TEAMS  Plan #[N] — Starting build...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

For **each phase in order**, use `spawn_agent` to start a builder subagent. Pick the model from the phase's complexity annotation:
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

    Plan file: .ralph-teams/PLAN-[N].md — read this file for full context, acceptance criteria, and verification scenarios.

    Your assignment: implement Phase [N] only, completing all its tasks. Verify it works using [Playwright|Maestro], then commit.
    If [Playwright|Maestro] tools are not available, run tests/lint instead and note that E2E verification was skipped."
)
```

Wait for the subagent with `wait_agent` before starting the next. As soon as you have recorded the result, call `close_agent` for that finished builder. After each phase, update `.ralph-teams/PLAN-[N].md` (change `[ ]` to `[x]` on success, `[!]` on failure) and print the phase board:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RALPH-TEAMS  [N of M phases complete]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Phase 1: Project Setup          [done]        (mini)
  ►  Phase 2: Auth System            [building...]  (5.4)
  ○  Phase 3: API Routes             [pending]      (mini)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Status symbols:
- `✓` — completed
- `►` — in progress
- `✗` — failed
- `○` — pending

If a builder subagent fails, log it as failed and continue with the next phase.

---

## Step 5: Review

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

    Plan file: .ralph-teams/PLAN-[N].md — read this file for phases, acceptance criteria, and verification scenarios.

    Write your review to .ralph-teams/REVIEW.md."
)
```

Wait for the reviewer with `wait_agent`. After you have read `.ralph-teams/REVIEW.md` and captured anything you need from the result, call `close_agent`.

---

## Step 6: Apply Fixes

After the reviewer completes, read `.ralph-teams/REVIEW.md`.

If there are **blocking findings** (issues the reviewer escalated — not ones already marked `[fixed by reviewer]`):
1. Print a summary of the review findings.
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
4. Print final summary when done.

If no blocking findings, print final summary directly.

Final summary format:
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

## Step 7: Optional — Update Docs

Ask the user:

> **"Would you like to update your documentation? Run `teams-document` to have the scribe update your README, ARCHITECTURE.md, and other docs."**

If yes, invoke the `teams-document` skill.

If **no**, skip.
