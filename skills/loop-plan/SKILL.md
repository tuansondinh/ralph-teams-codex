---
name: loop-plan
description: "Plan and build a large feature in sequential phases. Each phase gets a fresh builder and validator team with a clean context window."
user-invocable: false
---

# Teams: Loop Plan + Build

You are the orchestrator. Your job: plan the feature in phases, then execute each phase sequentially with a fresh Builder + Validator team.

---

## Step 1: Understand the Request

Ask: **"What do you want to build?"**

If unclear, ask 2–3 clarifying questions. Otherwise proceed.

---

## Step 2: Write the Plan

**Phase sizing:** Each phase should be large enough to fill a builder's context window — a substantial, self-contained slice of the feature. Think "implement the full auth system" not "add a login button". Phases are sequential and build on each other.

**Task sizing within a phase:** Each task inside a phase follows the same rules as single-plan tasks — meaningful and self-contained, not too small, not too big.

Create `ralph-teams/PLAN.md`:

```markdown
# Teams Plan: [Feature Name]

Generated: [date]
Status: approved
Mode: loop

## Summary
[What we're building — 2–4 sentences]

## E2E Testing Requirements
[To be collected from user]

---

### Phase 1: [Name]
Status: pending
Goal: [What this phase accomplishes]

Tasks:
- [ ] Task 1: [description]
- [ ] Task 2: [description]

Acceptance Criteria:
- [Criterion 1]
- [Criterion 2]

---

### Phase 2: [Name]
Status: pending
Goal: [Builds on Phase 1 — what this adds]

Tasks:
- [ ] Task 1: [description]

Acceptance Criteria:
- [Criterion 1]
```

---

## Step 3: Collect E2E Requirements

**Ask the user:**

> Before we build, I need to know what we'll test:
>
> 1. **E2E scenarios** — what user workflows should the validator test?
> 2. **Environment setup** — test accounts? API keys? Database setup?
> 3. **Test data** — any specific data the validator needs?
> 4. **Tool preference** — Playwright or Maestro? (default: Playwright)
> 5. **.env file** — provide a `.env.example` or list required variables

Document answers in `ralph-teams/PLAN.md` under `## E2E Testing Requirements`.

---

## Step 4: Show Plan and Get Approval

Display `ralph-teams/PLAN.md` and ask:

> **Plan and e2e requirements look good? Reply `yes` to start, or tell me what to change.**

---

## Step 5: Execute Phase by Phase

When approved, print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TEAMS  Starting build...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

For each phase in order:

### Per-phase execution

1. **Print phase header:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Phase [N/Total]: [Phase Name]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

2. **Update phase status** to `in-progress` in `ralph-teams/PLAN.md`.

3. **Spawn a fresh team** for this phase using Codex subagents. Use `spawn_agent` for a builder and a validator or reviewer agent, and keep their responsibilities separate.

4. **Add the phase's tasks** to the shared task list as "pending". Assign the first task to the Builder.

5. **Monitor progress** (same as single-plan watchdog):
   - Observe the shared task list only — Builder and Validator communicate directly via the `message` tool, the orchestrator cannot see those exchanges.
   - Reprint the task board on each status change.
   - Ping the Builder if the task list stalls.
   - **The user is not present. Do not pause or ask questions. If a task fails after the Validator's maximum pushbacks, continue with the next task without stopping.**

   Task board:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Phase [N] — [N of M tasks complete]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ✓  Task 1: ...     [done]
     ◉  Task 2: ...     [validating...]
     ○  Task 3: ...     [pending]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

   Status symbols: `✓` done · `►` in progress · `◉` validating · `✗` failed · `○` pending

6. **When all tasks in the phase are done**, shut down the team and update phase status in `ralph-teams/PLAN.md`:
   - All tasks passed → `Status: done`
   - Some tasks failed → `Status: partial`

7. Move to the next phase.

---

## When all phases complete:

Print final summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TEAMS  Build complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Phase 1: [Name]     [done]
  ✓  Phase 2: [Name]     [done]
  ~  Phase 3: [Name]     [partial]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
