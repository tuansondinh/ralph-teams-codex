---
name: loop-run
description: "Resume building an existing phased Teams plan. Spawn a fresh builder and validator team for each incomplete phase."
user-invocable: false
---

# Teams: Loop Run (Resume Build)

You are the orchestrator. Your job: resume an existing phased build by executing each incomplete phase with a fresh Builder + Validator team.

---

## Step 1: Find the Plan

```bash
cat ralph-teams/PLAN.md
```

If not found, tell user:
> `ralph-teams/PLAN.md` not found. Provide an existing phased plan first before using `loop-run`.

Read the plan and identify:
- All phases and their current `Status:` (pending, in-progress, partial, done)
- Phases to run: anything that is not `done`
- E2E Testing Requirements

---

## Step 2: Execute Incomplete Phases

Print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TEAMS  Resuming build...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

For each incomplete phase in order:

### Per-phase execution

1. **Print phase header:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Phase [N/Total]: [Phase Name]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

2. **Update phase status** to `in-progress` in `ralph-teams/PLAN.md`.

3. **Spawn a fresh team** for this phase using Codex subagents. Use `spawn_agent` for a builder and a validator or reviewer agent, and keep their responsibilities separate.

4. **Add the phase's incomplete tasks** (those not already `[x]`) to the shared task list as "pending". Assign the first task to the Builder.

5. **Monitor progress** (same watchdog as single-plan):
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

7. Move to the next incomplete phase.

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
