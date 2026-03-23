# Repo Instructions

- This repository is a Codex skill pack, not a Claude plugin.
- Prefer Codex skills in `skills/` and subagent prompts in `agents/` over marketplace-style packaging.
- When changing frontend or UI behavior in downstream projects, verify with MCP Playwright by default.
- Keep skill instructions tool-accurate for Codex. Use `spawn_agent` and `wait_agent` for subagent workflows, then `close_agent` as soon as the finished agent's output has been handled.
